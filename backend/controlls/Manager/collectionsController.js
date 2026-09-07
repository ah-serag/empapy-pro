const pool = require('../../config/condb');
const getAllCollections = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = '', status = '', start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    const queryParams = [];
    let whereClause = 'WHERE 1=1';
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (c.execution_id::text ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR a.assignment_ref ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status === 'REMITTED') {
      whereClause += ` AND c.is_remitted = TRUE`;
    } else if (status === 'PENDING') {
      whereClause += ` AND c.is_remitted = FALSE`;
    }

    if (start_date) {
      whereClause += ` AND DATE(c.created_at) >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND DATE(c.created_at) <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }

    const query = `
      SELECT c.id, c.amount, c.is_remitted, c.created_at, c.execution_id, c.collected_by, u.full_name AS technician_name, a.assignment_ref
      FROM collections c
      JOIN users u ON c.collected_by = u.id
      LEFT JOIN job_executions je ON c.execution_id = je.id
      LEFT JOIN assignments a ON je.assignment_id = a.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN c.is_remitted = FALSE THEN c.amount ELSE 0 END), 0) as pending_amount
      FROM collections c 
      JOIN users u ON c.collected_by = u.id 
      LEFT JOIN job_executions je ON c.execution_id = je.id
      LEFT JOIN assignments a ON je.assignment_id = a.id
      ${whereClause}
    `;

    const [collectionsRes, countRes] = await Promise.all([
      pool.query(query, [...queryParams, limit, offset]),
      pool.query(countQuery, queryParams)
    ]);

    res.status(200).json({
      success: true,
      data: collectionsRes.rows,
      stats: {
        total_records: parseInt(countRes.rows[0].total_count),
        pending_amount: parseFloat(countRes.rows[0].pending_amount)
      },
      pagination: {
        total: parseInt(countRes.rows[0].total_count),
        page: parseInt(page),
        totalPages: Math.ceil(parseInt(countRes.rows[0].total_count) / limit),
      }
    });
  } catch (error) {
    console.error("GET_COLLECTIONS_ERROR:", error);
    res.status(500).json({ success: false, message: 'خطأ في جلب التحصيلات' });
  }
};

const remitCollection = async (req, res) => {
  const client = await pool.connect();
  const admin_id = req.user.id;
  const { id: collection_id } = req.params;
  const { target_safe_id, account_id, amount, notes } = req.body; 
  const remittedAmount = Number(amount);

  try {
    await client.query('BEGIN');

    const collRes = await client.query(`
      SELECT c.amount, c.is_remitted, c.collected_by, je.assignment_id, a.assignment_ref 
      FROM collections c
      LEFT JOIN job_executions je ON c.execution_id = je.id
      LEFT JOIN assignments a ON je.assignment_id = a.id
      WHERE c.id = $1 FOR UPDATE OF c
    `, [collection_id]);
    
    if (collRes.rows.length === 0) throw new Error('التحصيل غير موجود');
    if (collRes.rows[0].is_remitted) throw new Error('تم توريد هذا التحصيل مسبقاً');
    
    const collectedByUserId = collRes.rows[0].collected_by;
    const assignmentId = collRes.rows[0].assignment_id; 
    const assignmentRef = collRes.rows[0].assignment_ref; 
    const originalCollectionAmount = Number(collRes.rows[0].amount);

    if (remittedAmount > originalCollectionAmount) {
      throw new Error(`لا يمكنك توريد مبلغ (${remittedAmount}) أكبر من قيمة التحصيل الأصلية (${originalCollectionAmount}).`);
    }

    const techSafeRes = await client.query(`
      SELECT id, balance FROM safes 
      WHERE user_id = $1 AND type = 'TECHNICIAN_WALLET' FOR UPDATE
    `, [collectedByUserId]);
    
    if (techSafeRes.rows.length === 0) {
      throw new Error('الفني ليس لديه خزنة عهدة مسجلة على النظام.');
    }
    
    const techSafeId = techSafeRes.rows[0].id;
    const techBalance = Number(techSafeRes.rows[0].balance);

    if (techBalance < remittedAmount) {
      throw new Error(`رصيد عهدة الفني الحالي (${techBalance}) لا يكفي لتوريد هذا المبلغ (${remittedAmount}). يرجى التأكد من تسوية مصروفاته أولاً أو تقليل مبلغ التوريد.`);
    }

    const mainSafeRes = await client.query(`SELECT id FROM safes WHERE id = $1 FOR UPDATE`, [target_safe_id]);
    if (mainSafeRes.rows.length === 0) throw new Error('الخزنة المستهدفة غير موجودة.');

    await client.query(`UPDATE safes SET balance = balance - $1 WHERE id = $2`, [remittedAmount, techSafeId]);
    await client.query(`UPDATE safes SET balance = balance + $1 WHERE id = $2`, [remittedAmount, target_safe_id]);

    await client.query(`UPDATE collections SET is_remitted = TRUE WHERE id = $1`, [collection_id]);

    const taskText = assignmentRef ? `لمهمة رقم ${assignmentRef}` : 'بدون مهمة مرتبطة';
    const outNotes = `تحويل عهدة للمركز الرئيسي - تحصيل رقم ${collection_id} ${taskText}`;
    const inNotes =   `استلام عهدة من فني - تحصيل رقم ${collection_id} ${taskText} ${notes ? '-- ' + notes : ''}`;

    await client.query(`
      INSERT INTO treasury_transactions (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
      VALUES ($1, $2, 'OUT', $3, 'COLLECTION_REMIT', $4, $5, $6)
    `, [
      techSafeId, 
      account_id, 
      remittedAmount, 
      assignmentId || null, 
      outNotes,             
      admin_id
    ]);

    await client.query(`
      INSERT INTO treasury_transactions (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
      VALUES ($1, $2, 'IN', $3, 'COLLECTION_REMIT', $4, $5, $6)
    `, [
      target_safe_id, 
      account_id, 
      remittedAmount, 
      assignmentId || null, 
      inNotes,            
      admin_id
    ]);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'تم استلام وتوريد العهدة بنجاح.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("REMIT_COLLECTION_ERROR:", error); 
    res.status(400).json({ success: false, message: error.message || "حدث خطأ أثناء توريد التحصيل" });
  } finally {
    client.release();
  }
};
module.exports = { getAllCollections, remitCollection };