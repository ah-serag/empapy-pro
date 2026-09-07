const pool = require('../../config/condb');

// ==========================================
// 1. المصروفات (Expenses)
// ==========================================
const getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = '', status = '', start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    const queryParams = [];
    let whereClause = 'WHERE 1=1';
    let paramIndex = 1;

    // بحث نصي (رقم المهمة، أو سبب المصروف، أو اسم الفني)
    if (search) {
      whereClause += ` AND (e.execution_id::text ILIKE $${paramIndex} OR e.reason ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
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
      SELECT e.id, e.amount, e.reason, e.status, e.created_at, e.execution_id, u.name AS technician_name
      FROM expenses e
      JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `SELECT COUNT(*) FROM expenses e JOIN users u ON e.created_by = u.id ${whereClause}`;

    const [expensesRes, countRes] = await Promise.all([
      pool.query(query, [...queryParams, limit, offset]),
      pool.query(countQuery, queryParams)
    ]);

    res.status(200).json({
      success: true,
      data: expensesRes.rows,
      pagination: {
        total: parseInt(countRes.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
      }
    });
  } catch (error) {
    console.error("GET_EXPENSES_ERROR:", error);
    res.status(500).json({ success: false, message: 'خطأ في جلب المصروفات' });
  }
};

// ==========================================
// 2. التحصيلات (Collections)
// ==========================================
const getAllCollections = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = '', status = '', start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    const queryParams = [];
    let whereClause = 'WHERE 1=1';
    let paramIndex = 1;

    // بحث نصي (رقم المهمة، أو اسم الفني)
    if (search) {
      whereClause += ` AND (c.execution_id::text ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // الفلترة حسب حالة التوريد
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
      SELECT c.id, c.amount, c.is_remitted, c.created_at, c.execution_id, u.name AS technician_name
      FROM collections c
      JOIN users u ON c.collected_by = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `SELECT COUNT(*) FROM collections c JOIN users u ON c.collected_by = u.id ${whereClause}`;

    const [collectionsRes, countRes] = await Promise.all([
      pool.query(query, [...queryParams, limit, offset]),
      pool.query(countQuery, queryParams)
    ]);

    res.status(200).json({
      success: true,
      data: collectionsRes.rows,
      pagination: {
        total: parseInt(countRes.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
      }
    });
  } catch (error) {
    console.error("GET_COLLECTIONS_ERROR:", error);
    res.status(500).json({ success: false, message: 'خطأ في جلب التحصيلات' });
  }
};

 module.exports = { getAllExpenses, getAllCollections };