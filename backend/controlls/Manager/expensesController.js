const pool = require('../../config/condb');

const getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = '', status = '', start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    const queryParams = [];
    let whereClause = 'WHERE 1=1';
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (
        e.id::text ILIKE $${paramIndex} 
        OR je.assignment_id::text ILIKE $${paramIndex} 
        OR u.full_name ILIKE $${paramIndex} 
        OR e.reason ILIKE $${paramIndex}
        OR a.assignment_ref ILIKE $${paramIndex}
      ) `;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'ALL') {
      whereClause += ` AND e.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (start_date) {
      whereClause += ` AND DATE(e.created_at) >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND DATE(e.created_at) <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }

    const query = `
      SELECT 
        e.id, 
        e.amount, 
        e.reason, 
        e.status, 
        e.created_at, 
        e.execution_id, 
        e.created_by, 
        u.full_name AS technician_name,
        je.assignment_id,
        a.assignment_ref
      FROM expenses e
      JOIN users u ON e.created_by = u.id
      LEFT JOIN job_executions je ON e.execution_id = je.id
      LEFT JOIN assignments a ON je.assignment_id = a.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN e.status = 'PENDING_APPROVAL' THEN e.amount ELSE 0 END), 0) as pending_amount
      FROM expenses e 
      JOIN users u ON e.created_by = u.id 
      LEFT JOIN job_executions je ON e.execution_id = je.id
      LEFT JOIN assignments a ON je.assignment_id = a.id
      ${whereClause}
    `;

    const [expensesRes, countRes] = await Promise.all([
      pool.query(query, [...queryParams, limit, offset]),
      pool.query(countQuery, queryParams)
    ]);

    res.status(200).json({
      success: true,
      data: expensesRes.rows,
      stats: {
        total_records: parseInt(countRes.rows[0].total_count, 10),
        pending_amount: parseFloat(countRes.rows[0].pending_amount)
      },
      pagination: {
        total: parseInt(countRes.rows[0].total_count, 10),
        page: parseInt(page, 10),
        totalPages: Math.ceil(parseInt(countRes.rows[0].total_count, 10) / limit),
      }
    });
  } catch (error) {
    console.error("GET_EXPENSES_ERROR:", error);
    res.status(500).json({ success: false, message: 'خطأ في جلب المصروفات' });
  }
};

const approveExpense = async (req, res) => {
  const client = await pool.connect();
  const admin_id = req.user.id;
  const { id: expense_id } = req.params;
  const { amount, notes, account_id } = req.body; 
  const approvedAmount = Number(amount);

  try {
    await client.query('BEGIN');

    const expRes = await client.query(`
      SELECT e.amount, e.status, e.created_by, e.execution_id, je.assignment_id, a.assignment_ref 
      FROM expenses e
      JOIN job_executions je ON e.execution_id = je.id
      LEFT JOIN assignments a ON je.assignment_id = a.id
      WHERE e.id = $1 FOR UPDATE OF e
    `, [expense_id]);

    if (expRes.rows.length === 0) throw new Error('المصروف غير موجود');
    if (expRes.rows[0].status === 'APPROVED') throw new Error('تم اعتماد وتسوية هذا المصروف مسبقاً');
    if (expRes.rows[0].status === 'REJECTED') throw new Error('هذا المصروف تم رفضه مسبقاً');
    
    const createdByUserId = expRes.rows[0].created_by;
    const assignmentId = expRes.rows[0].assignment_id; 
    const assignmentRef = expRes.rows[0].assignment_ref;
    const originalExpenseAmount = Number(expRes.rows[0].amount);

    if (approvedAmount > originalExpenseAmount) {
      throw new Error(`لا يمكنك اعتماد مبلغ (${approvedAmount}) أكبر من قيمة المصروف المسجل (${originalExpenseAmount}).`);
    }

    const techSafeRes = await client.query(`SELECT id FROM safes WHERE user_id = $1 AND type = 'TECHNICIAN_WALLET' FOR UPDATE`, [createdByUserId]);
    if (techSafeRes.rows.length === 0) {
      throw new Error('الفني ليس لديه خزنة عهدة مسجلة على النظام لتسوية المصروف منها.');
    }
    const techSafeId = techSafeRes.rows[0].id;

    await client.query(`UPDATE safes SET balance = balance - $1 WHERE id = $2`, [approvedAmount, techSafeId]);

    await client.query(`UPDATE expenses SET status = 'APPROVED', amount = $1 WHERE id = $2`, [approvedAmount, expense_id]);

    const taskText = assignmentRef ? `لمهمة رقم ${assignmentRef}` : `لمهمة رقم ${assignmentId}`;
    const transactionNotes = notes || `تسوية مصروفات فني من العهدة ${taskText}. (معرف المصروف: ${expense_id})`;

    await client.query(`
      INSERT INTO treasury_transactions (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
      VALUES ($1, $2, 'OUT', $3, 'JOB_EXECUTION_EXPENSE', $4, $5, $6)
    `, [
      techSafeId, 
      account_id, 
      approvedAmount, 
      assignmentId, 
      transactionNotes, 
      admin_id
    ]);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'تم اعتماد المصروف وتسوية عهدة الفني بنجاح.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("APPROVE_EXPENSE_ERROR:", error); 
    res.status(400).json({ success: false, message: error.message || "حدث خطأ أثناء اعتماد المصروف" });
  } finally {
    client.release();
  }
};


const rejectExpense = async (req, res) => {
  const client = await pool.connect();
  const { id: expense_id } = req.params;
  
  try {
    const expRes = await client.query(`SELECT status FROM expenses WHERE id = $1`, [expense_id]);
    if (expRes.rows.length === 0) throw new Error('المصروف غير موجود');
    if (expRes.rows[0].status !== 'PENDING_APPROVAL') throw new Error('تم اتخاذ إجراء مسبقاً على هذا المصروف');

    await client.query(`UPDATE expenses SET status = 'REJECTED' WHERE id = $1`, [expense_id]);
    res.status(200).json({ success: true, message: 'تم رفض المصروف بنجاح ولن يتم تسويته.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

module.exports = { getAllExpenses, approveExpense, rejectExpense };