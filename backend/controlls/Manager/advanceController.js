const db = require('../../config/condb'); 

const getAdvances = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    let whereClause = "";
    const queryParams = [];

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause = `WHERE u.full_name ILIKE $1`;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM employee_advances ea
      JOIN users u ON ea.user_id = u.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    const limitParamIndex = queryParams.length + 1;
    const offsetParamIndex = queryParams.length + 2;
    queryParams.push(limit, offset);

    const dataQuery = `
      SELECT 
        ea.id, 
        ea.amount, 
        ea.status, 
        ea.notes, 
        ea.created_at, 
        ea.deducted_at,
        u.full_name AS employee_name,
        s.name AS safe_name,
        cb.full_name AS created_by_name
      FROM employee_advances ea
      JOIN users u ON ea.user_id = u.id
      JOIN safes s ON ea.taken_from_safe_id = s.id
      LEFT JOIN users cb ON ea.created_by = cb.id
      ${whereClause}
      ORDER BY ea.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;
    
    const result = await db.query(dataQuery, queryParams);

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total_records: totalRecords,
        current_page: page,
        total_pages: totalPages,
        limit: limit,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    });

  } catch (error) {
    console.error("GET_ADVANCES_ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "حدث خطأ داخلي أثناء جلب بيانات السلفيات." 
    });
  }
};

const createAdvance = async (req, res) => {
  const client = await db.connect();
  const created_by = req?.user?.id; 
  
  try {
    const { user_id, taken_from_safe_id, amount, account_id, notes } = req.body;

    if (!user_id || !taken_from_safe_id || !amount || !account_id) {
      throw new Error("تنبيه أمني: بيانات الموظف، الخزنة، المبلغ، والبند المحاسبي (account_id) مطلوبة.");
    }
    
    const advanceAmount = Number(amount);
    if (isNaN(advanceAmount) || advanceAmount <= 0) {
      throw new Error("تنبيه أمني: يجب أن يكون مبلغ السلفة رقماً صحيحاً أكبر من الصفر.");
    }

    await client.query('BEGIN'); 

    const safeQuery = await client.query(
      `SELECT id, name, balance, type FROM safes WHERE id = $1 FOR UPDATE`,
      [taken_from_safe_id]
    );

    if (safeQuery.rows.length === 0) {
      throw new Error("الخزنة المحددة غير موجودة.");
    }

    const safe = safeQuery.rows[0];

    if (Number(safe.balance) < advanceAmount) {
      throw new Error(`رصيد العهدة غير كافٍ. الرصيد الحالي: ${safe.balance}`);
    }

    const userQuery = await client.query(
      `SELECT full_name FROM users WHERE id = $1`,
      [user_id]
    );

    if (userQuery.rows.length === 0) {
      throw new Error("الموظف المحدد غير موجود في النظام.");
    }

    const userName = userQuery.rows[0].full_name;

    await client.query(
      `UPDATE safes SET balance = balance - $1 WHERE id = $2`,
      [advanceAmount, taken_from_safe_id]
    );

    const advanceResult = await client.query(`
      INSERT INTO employee_advances 
      (user_id, taken_from_safe_id, amount, status, notes, created_by) 
      VALUES ($1, $2, $3, 'PENDING', $4, $5)
      RETURNING *
    `, [user_id, taken_from_safe_id, advanceAmount, notes, created_by]);

    const advanceRecord = advanceResult.rows[0];

    await client.query(`
      INSERT INTO treasury_transactions 
      (safe_id, account_id, transaction_type, reference_type, reference_id, amount, notes, created_by)
      VALUES ($1, $2, 'OUT', 'ADVANCE', $3, $4, $5, $6)
    `, [
      taken_from_safe_id, 
      account_id,
      advanceRecord.id,
      advanceAmount, 
      `سلفة للموظف (${userName}) - ${notes || ''}`, 
      created_by
    ]);

    await client.query('COMMIT'); 

    return res.status(201).json({
      success: true,
      message: "تم تسجيل السلفة، وخصمها من العهدة، وإثباتها في شجرة الحسابات بنجاح.",
      data: {
        ...advanceRecord,
        full_name: userName 
      }
    });

  } catch (error) {
    await client.query('ROLLBACK'); 
    console.error("CREATE_ADVANCE_ERROR:", error);
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

const cancelAdvance = async (req, res) => {
  const client = await db.connect();
  const cancelled_by = req?.user?.id; 

  try {
    const { id } = req.params; 
    
    await client.query('BEGIN');

    // 1. Get and lock the advance
    const advanceQuery = await client.query(
      `SELECT id, amount, taken_from_safe_id, status FROM employee_advances WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (advanceQuery.rows.length === 0) {
      throw new Error("تنبيه أمني: السلفة المحددة غير موجودة.");
    }

    const advance = advanceQuery.rows[0];

    // 2. Validate status
    if (advance.status !== 'PENDING') {
      throw new Error(`لا يمكن إلغاء هذه السلفة لأن حالتها الحالية: ${advance.status}`);
    }

    // 3. Update advance status
    await client.query(
      `UPDATE employee_advances SET status = 'CANCELLED' WHERE id = $1`,
      [id]
    );

    // 4. Return money to the safe
    await client.query(
      `UPDATE safes SET balance = balance + $1 WHERE id = $2`,
      [advance.amount, advance.taken_from_safe_id]
    );

    // 5. Add a treasury transaction (Reversal)
    await client.query(`
      INSERT INTO treasury_transactions 
      (safe_id, transaction_type, reference_type, reference_id, amount, notes, created_by)
      VALUES ($1, 'IN', 'ADVANCE_CANCEL', $2, $3, $4, $5)
    `, [
      advance.taken_from_safe_id,
      id,
      advance.amount,
      `إلغاء سلفة ورجوع المبلغ للعهدة (سلفة رقم ${id})`,
      cancelled_by
    ]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "تم إلغاء السلفة وإرجاع المبلغ للعهدة بنجاح."
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("CANCEL_ADVANCE_ERROR:", error);
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

module.exports = { getAdvances, createAdvance  ,cancelAdvance };