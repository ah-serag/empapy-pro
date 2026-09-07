const pool = require('../../config/condb');

const getTreasuryTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 15, 
      search = '', 
      type = '', 
      start_date, 
      end_date 
    } = req.query;

    const offset = (page - 1) * limit;
    const queryParams = [];
    let whereClause = 'WHERE 1=1';
    let paramIndex = 1;

    // 1. فلتر البحث (النصي)
    if (search) {
      whereClause += ` AND (sf.name ILIKE $${paramIndex} OR acc.name ILIKE $${paramIndex} OR tt.notes ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 2. فلتر نوع الحركة (IN / OUT)
    if (type) {
      whereClause += ` AND tt.transaction_type = $${paramIndex}`;
      queryParams.push(type.toUpperCase());
      paramIndex++;
    }

    // 3. فلتر من تاريخ
    if (start_date) {
      whereClause += ` AND DATE(tt.created_at) >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    // 4. فلتر إلى تاريخ
    if (end_date) {
      whereClause += ` AND DATE(tt.created_at) <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }

    const query = `
      SELECT 
        tt.id, tt.transaction_type, tt.amount, tt.reference_type, tt.reference_id, tt.notes, tt.created_at,
        sf.name AS safe_name,
        acc.name AS account_name,
        u.full_name AS created_by_name
      FROM treasury_transactions tt
      LEFT JOIN safes sf ON tt.safe_id = sf.id
      LEFT JOIN accounts acc ON tt.account_id = acc.id
      LEFT JOIN users u ON tt.created_by = u.id
      ${whereClause}
      ORDER BY tt.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // استعلام العدد الكلي للـ Pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM treasury_transactions tt
      LEFT JOIN safes sf ON tt.safe_id = sf.id
      LEFT JOIN accounts acc ON tt.account_id = acc.id
      ${whereClause}
    `;

    const [transactionsRes, countRes] = await Promise.all([
      pool.query(query, [...queryParams, limit, offset]),
      pool.query(countQuery, queryParams)
    ]);

    const totalRecords = parseInt(countRes.rows[0].count);

    res.status(200).json({
      success: true,
      data: transactionsRes.rows,
      pagination: {
        total: totalRecords,
        page: parseInt(page),
        totalPages: Math.ceil(totalRecords / limit),
      }
    });

  } catch (error) {
    console.error("GET_TREASURY_TRANSACTIONS_ERROR:", error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب حركات الخزينة' });
  }
};

module.exports = { getTreasuryTransactions };