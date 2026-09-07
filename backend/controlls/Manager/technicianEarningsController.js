const db = require('../../config/condb');




// get all techniciannearning 
const getTechnicianEarnings = async (req, res) => {
  try {
    const { search, status, start_date, end_date, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    let whereClause = `WHERE 1=1`;
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR a.assignment_ref ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereClause += ` AND te.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (start_date) {
      whereClause += ` AND te.created_at >= $${paramIndex}`;
      params.push(`${start_date} 00:00:00`);
      paramIndex++;
    }
    if (end_date) {
      whereClause += ` AND te.created_at <= $${paramIndex}`;
      params.push(`${end_date} 23:59:59`);
      paramIndex++;
    }

    const query = `
      SELECT 
        te.id,
        te.execution_id,
        te.total_pool_amount,
        te.user_shares,
        te.earned_amount,
        te.status,
        te.created_at,
        u.id AS user_id,
        u.full_name AS technician_name,
        u.phone AS technician_phone,
        s.name_ar AS service_name,
        a.assignment_ref
      FROM technician_earnings te
      JOIN users u ON te.user_id = u.id
      JOIN services s ON te.service_id = s.id
      JOIN job_executions je ON te.execution_id = je.id
      JOIN assignments a ON je.assignment_id = a.id
      ${whereClause}
      ORDER BY te.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // استعلام العدد الإجمالي (لحساب عدد الصفحات Pagination)
    const countQuery = `
      SELECT COUNT(*)
      FROM technician_earnings te
      JOIN users u ON te.user_id = u.id
      JOIN job_executions je ON te.execution_id = je.id
      JOIN assignments a ON je.assignment_id = a.id
      ${whereClause}
    `;

    const queryParams = [...params, limit, offset];
    
    const [result, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, params)
    ]);

    const totalRecords = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    // حساب إجمالي المبالغ في الصفحة الحالية (للعرض الإحصائي)
    const currentTotalEarnings = result.rows.reduce((sum, row) => sum + Number(row.earned_amount), 0);

    return res.status(200).json({
      success: true,
      data: result.rows,
      meta: {
        totalRecords,
        totalPages,
        currentPage: Number(page),
        currentTotalEarnings
      }
    });

  } catch (error) {
    console.error("GET_EARNINGS_ERROR:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب سجلات الأرباح." });
  }
};
const approveTechnicianEarning = async (req, res) => {
  const client = await db.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const checkQuery = await client.query(
      `SELECT id, status, earned_amount, user_id FROM technician_earnings WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (checkQuery.rows.length === 0) {
      throw new Error("سجل العمولة غير موجود.");
    }

    const earning = checkQuery.rows[0];

    if (earning.status !== 'PENDING') {
      throw new Error(`لا يمكن اعتماد هذه العمولة لأن حالتها الحالية هي: ${earning.status}`);
    }

    const updateResult = await client.query(
      `UPDATE technician_earnings 
       SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "تم اعتماد عمولة الفني بنجاح وأصبحت جاهزة للتسوية المالية.",
      data: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("APPROVE_EARNING_ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "حدث خطأ أثناء اعتماد العمولة."
    });
  } finally {
    client.release();
  }
};
const cancelTechnicianEarning = async (req, res) => {
  const client = await db.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const checkQuery = await client.query(
      `SELECT id, status FROM technician_earnings WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (checkQuery.rows.length === 0) {
      throw new Error("سجل العمولة غير موجود.");
    }

    const earning = checkQuery.rows[0];

    if (earning.status !== 'PENDING') {
      throw new Error(`لا يمكن إلغاء هذه العمولة لأن حالتها الحالية هي: ${earning.status}`);
    }

    const updateResult = await client.query(
      `UPDATE technician_earnings 
       SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "تم إلغاء العمولة بنجاح ولن تُدرج في كشف الحساب.",
      data: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("CANCEL_EARNING_ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "حدث خطأ أثناء إلغاء العمولة."
    });
  } finally {
    client.release();
  }
};




// get tech manoy and give him 


const getPendingSettlements = async (req, res) => {
  try {
    const { technician_id } = req.params;
    const { search } = req.query; 

    let query = `
      SELECT 
        te.id AS earning_id,
        te.execution_id,
        te.earned_amount,
        te.created_at AS earning_date,
        s.name_ar AS service_name,
        a.assignment_ref,
        b.contact_name AS customer_name,
        b.contact_phone AS customer_phone,
        COALESCE(
          (SELECT SUM(jes.quantity) 
           FROM job_execution_services jes
           WHERE jes.execution_id = te.execution_id 
             AND jes.service_id = te.service_id), 
          0
        ) AS service_quantity
      FROM technician_earnings te
      JOIN services s ON te.service_id = s.id
      JOIN job_executions je ON te.execution_id = je.id
      JOIN assignments a ON je.assignment_id = a.id
      JOIN bookings b ON a.booking_id = b.id
      WHERE te.user_id = $1 AND te.status = 'APPROVED'
    `;

    const queryParams = [technician_id];

    if (search && search.trim() !== "") {
      query += ` AND (
        a.assignment_ref ILIKE $2 OR 
        b.contact_name ILIKE $2 OR 
        b.contact_phone ILIKE $2 OR 
        s.name_ar ILIKE $2
      )`;
      queryParams.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY je.created_at ASC`;
    const earningsResult = await db.query(query, queryParams);
    const flatEarnings = earningsResult.rows;

    const tasksMap = {};
    flatEarnings.forEach(row => {
      if (!tasksMap[row.execution_id]) {
        tasksMap[row.execution_id] = {
          execution_id: row.execution_id,
          assignment_ref: row.assignment_ref,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          visit_date: row.earning_date, 
          task_total_earned: 0,        
          services: []                
        };
      }
      
      tasksMap[row.execution_id].services.push({
        earning_id: row.earning_id,
        service_name: row.service_name,
        service_quantity: row.service_quantity,
        earned_amount: Number(row.earned_amount)
      });
      
      tasksMap[row.execution_id].task_total_earned += Number(row.earned_amount);
    });

    const groupedTasks = Object.values(tasksMap);

    // 3. جلب السلف المعلقة (PENDING)
    const advancesQuery = `
      SELECT id, amount, notes, created_at
      FROM employee_advances
      WHERE user_id = $1 AND status = 'PENDING'
      ORDER BY created_at ASC
    `;
    const advancesResult = await db.query(advancesQuery, [technician_id]);

    // 4. الحسابات الرياضية الدقيقة للنهائي
    const totalEarnings = flatEarnings.reduce((sum, row) => sum + Number(row.earned_amount), 0);
    const totalAdvances = advancesResult.rows.reduce((sum, row) => sum + Number(row.amount), 0);
    const netAmount = totalEarnings - totalAdvances;

    return res.status(200).json({
      success: true,
      data: {
        earnings: flatEarnings,      
        tasks: groupedTasks,         
        advances: advancesResult.rows,
        summary: {
          visits_count: groupedTasks.length,
          services_count: flatEarnings.length, 
          total_earnings: totalEarnings,
          total_advances: totalAdvances,
          net_amount: netAmount
        }
      }
    });

  } catch (error) {
    console.error("GET_SETTLEMENTS_ERROR:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب مستحقات الفني." });
  }
};



const executeSettlement = async (req, res) => {
  const client = await db.connect();
  try {
    const { technician_id, safe_id, account_id } = req.body;
    const created_by = req?.user?.id; 

    if (!technician_id || !safe_id || !account_id) {
      throw new Error("يجب تحديد الفني، الخزنة، والبند المحاسبي لإتمام التسوية.");
    }

    await client.query('BEGIN');

    // 1. قفل المستحقات وتجميدها مالياً
    const earningsQuery = await client.query(`
      SELECT id, earned_amount 
      FROM technician_earnings 
      WHERE user_id = $1 AND status = 'APPROVED' 
      FOR UPDATE
    `, [technician_id]);
    
    const earnings = earningsQuery.rows;
    if (earnings.length === 0) {
      throw new Error("لا توجد مستحقات معتمدة لهذا الفني لتسويتها.");
    }

    // 2. قفل السلف المعلقة وتجميدها
    const advancesQuery = await client.query(`
      SELECT id, amount 
      FROM employee_advances 
      WHERE user_id = $1 AND status = 'PENDING' 
      FOR UPDATE
    `, [technician_id]);
    
    const advances = advancesQuery.rows;

    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.earned_amount), 0);
    const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    const netToPay = totalEarnings - totalAdvances;

    if (netToPay < 0) {
      throw new Error(`إجمالي السلف (${totalAdvances}) يتجاوز الأرباح (${totalEarnings}). لا يمكن إتمام التسوية حالياً.`);
    }

    if (netToPay > 0) {
      const safeUpdate = await client.query(`
        UPDATE safes 
        SET balance = balance - $1
        WHERE id = $2 
        RETURNING balance, name
      `, [netToPay, safe_id]);

      if (safeUpdate.rows.length === 0) throw new Error("الخزنة المحددة غير صالحة.");
      if (Number(safeUpdate.rows[0].balance) < 0) throw new Error("رصيد الخزنة غير كافٍ لدفع الصافي.");
    }

    const currentYear = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const settlement_ref = `PAY-${currentYear}-${randomDigits}`;

    const settlementResult = await client.query(`
      INSERT INTO payroll_settlements 
      (settlement_ref, technician_id, total_amount, safe_id, account_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, settlement_ref
    `, [
      settlement_ref,
      technician_id,
      netToPay, // نسجل الصافي الفعلي بعد خصم السلف
      safe_id,
      account_id,
      created_by
    ]);

    const settlementId = settlementResult.rows[0].id;

    // 6. تسجيل الحركة المالية في شجرة الحسابات (فقط لو دفعنا فلوس فعلية)
    if (netToPay > 0) {
      await client.query(`
        INSERT INTO treasury_transactions 
        (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
        VALUES ($1, $2, 'OUT', $3, 'PAYROLL', $4, $5, $6)
      `, [
        safe_id,
        account_id,
        netToPay,
        settlementId, 
        `تسوية مستحقات (أرباح: ${totalEarnings} - سلف: ${totalAdvances}) مرجع: ${settlement_ref}`,
        created_by
      ]);
    }

    const earningIds = earnings.map(e => e.id);
    await client.query(`
      UPDATE technician_earnings 
      SET status = 'PAID', settlement_id = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ANY($2::int[])
    `, [settlementId, earningIds]);

    if (advances.length > 0) {
      const advanceIds = advances.map(a => a.id);
      await client.query(`
        UPDATE employee_advances 
        SET status = 'DEDUCTED', deducted_at = CURRENT_TIMESTAMP 
        WHERE id = ANY($1::int[])
      `, [advanceIds]);
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `تمت التسوية. مستحقات: ${totalEarnings} | سلف: ${totalAdvances} | الصافي المدفوع: ${netToPay} ج.م.`,
      settlement: {
        id: settlementId,
        ref: settlement_ref,
        total_paid: netToPay
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("EXECUTE_SETTLEMENT_ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "حدث خطأ أثناء التسوية." });
  } finally {
    client.release();
  }
};

// const getPendingSettlements = async (req, res) => {
//   try {
//     const { technician_id } = req.params;
//     const { search } = req.query; 

//     let query = `
//       SELECT 
//         te.id AS earning_id,
//         te.execution_id,
//         te.earned_amount,
//         te.created_at AS earning_date,
//         s.name_ar AS service_name,
//         a.assignment_ref,
//         b.contact_name AS customer_name,
//         b.contact_phone AS customer_phone
//       FROM technician_earnings te
//       JOIN services s ON te.service_id = s.id
//       JOIN job_executions je ON te.execution_id = je.id
//       JOIN assignments a ON je.assignment_id = a.id
//       JOIN bookings b ON a.booking_id = b.id
//       WHERE te.user_id = $1 AND te.status = 'APPROVED'
//     `;

//     const queryParams = [technician_id];

//     if (search && search.trim() !== "") {
//       query += ` AND (
//         a.assignment_ref ILIKE $2 OR 
//         b.contact_name ILIKE $2 OR 
//         b.contact_phone ILIKE $2 OR 
//         s.name_ar ILIKE $2
//       )`;
//       queryParams.push(`%${search.trim()}%`);
//     }

//     // إضافة الترتيب في النهاية
//     query += ` ORDER BY je.created_at ASC`;

//     // تنفيذ الاستعلام الآمن
//     const result = await db.query(query, queryParams);

//     // حساب الإجمالي
//     const totalAmount = result.rows.reduce((sum, row) => sum + Number(row.earned_amount), 0);

//     return res.status(200).json({
//       success: true,
//       data: result.rows,
//       total_amount: totalAmount
//     });

//   } catch (error) {
//     console.error("GET_SETTLEMENTS_ERROR:", error);
//     return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب مستحقات الفني." });
//   }
// };


// const executeSettlement = async (req, res) => {
//   const client = await db.connect();
//   try {
//     const { technician_id, safe_id, account_id } = req.body;
//     const created_by = req?.user?.id; 

//     if (!technician_id || !safe_id || !account_id) {
//       throw new Error("يجب تحديد الفني، الخزنة، والبند المحاسبي لإتمام التسوية.");
//     }

//     await client.query('BEGIN');

//     const earningsQuery = await client.query(`
//       SELECT id, earned_amount 
//       FROM technician_earnings 
//       WHERE user_id = $1 AND status = 'APPROVED' 
//       FOR UPDATE
//     `, [technician_id]);

//     const earnings = earningsQuery.rows;
//     if (earnings.length === 0) {
//       throw new Error("لا توجد مستحقات معتمدة لهذا الفني لتسويتها.");
//     }

//     const totalToPay = earnings.reduce((sum, e) => sum + Number(e.earned_amount), 0);

//     const safeUpdate = await client.query(`
//       UPDATE safes 
//       SET balance = balance - $1
//       WHERE id = $2 
//       RETURNING balance, name
//     `, [totalToPay, safe_id]);

//     if (safeUpdate.rows.length === 0) throw new Error("الخزنة المحددة غير صالحة.");


//     const currentYear = new Date().getFullYear();
//     const randomDigits = Math.floor(1000 + Math.random() * 9000);
//     const settlement_ref = `PAY-${currentYear}-${randomDigits}`;

//     const settlementResult = await client.query(`
//       INSERT INTO payroll_settlements 
//       (settlement_ref, technician_id, total_amount, safe_id, account_id, created_by)
//       VALUES ($1, $2, $3, $4, $5, $6)
//       RETURNING id, settlement_ref
//     `, [
//       settlement_ref,
//       technician_id,
//       totalToPay,
//       safe_id,
//       account_id,
//       created_by
//     ]);

//     const settlementId = settlementResult.rows[0].id;

//     await client.query(`
//       INSERT INTO treasury_transactions 
//       (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
//       VALUES ($1, $2, 'OUT', $3, 'PAYROLL', $4, $5, $6)
//     `, [
//       safe_id,
//       account_id,
//       totalToPay,
//       settlementId, 
//       `تسوية عمولات ورواتب فني - مرجع: ${settlement_ref}`,
//       created_by
//     ]);


//     const earningIds = earnings.map(e => e.id);
//     await client.query(`
//       UPDATE technician_earnings 
//       SET status = 'PAID', settlement_id = $1, updated_at = CURRENT_TIMESTAMP 
//       WHERE id = ANY($2::int[])
//     `, [settlementId, earningIds]);

//     await client.query('COMMIT');

//     return res.status(200).json({
//       success: true,
//       message: `تمت تسوية مبلغ ${totalToPay} ج.م بنجاح، وإصدار إيصال الدفع.`,
//       settlement: {
//         id: settlementId,
//         ref: settlement_ref,
//         total_paid: totalToPay
//       }
//     });

//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error("EXECUTE_SETTLEMENT_ERROR:", error);
//     return res.status(400).json({ success: false, message: error.message || "حدث خطأ أثناء التسوية." });
//   } finally {
//     client.release();
//   }
// };


















// history from settlement 
const getPayrollSettlements = async (req, res) => {
  try {
    const { search, start_date, end_date, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    let whereClause = `WHERE 1=1`;
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (tech.full_name ILIKE $${paramIndex} OR ps.settlement_ref ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (start_date) {
      whereClause += ` AND ps.created_at >= $${paramIndex}`;
      params.push(`${start_date} 00:00:00`);
      paramIndex++;
    }
    if (end_date) {
      whereClause += ` AND ps.created_at <= $${paramIndex}`;
      params.push(`${end_date} 23:59:59`);
      paramIndex++;
    }

    const query = `
      SELECT 
        ps.id,
        ps.settlement_ref,
        ps.total_amount,
        ps.created_at,
        ps.notes,
        tech.full_name AS technician_name,
        admin.full_name AS created_by_name,
        s.name AS safe_name,
        acc.name AS account_name
      FROM payroll_settlements ps
      JOIN users tech ON ps.technician_id = tech.id
      JOIN users admin ON ps.created_by = admin.id
      JOIN safes s ON ps.safe_id = s.id
      JOIN accounts acc ON ps.account_id = acc.id
      ${whereClause}
      ORDER BY ps.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM payroll_settlements ps
      JOIN users tech ON ps.technician_id = tech.id
      ${whereClause}
    `;

    const queryParams = [...params, limit, offset];
    
    const [result, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, params)
    ]);

    const totalRecords = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      data: result.rows,
      meta: { totalRecords, totalPages, currentPage: Number(page) }
    });

  } catch (error) {
    console.error("GET_SETTLEMENTS_HISTORY_ERROR:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب سجل التسويات." });
  }
};




module.exports = {
  getTechnicianEarnings,
  approveTechnicianEarning,
  cancelTechnicianEarning,
  getPendingSettlements, 
  executeSettlement,  
  getPayrollSettlements   
};
