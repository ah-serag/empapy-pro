const pool = require('../../../config/condb');

const getInventoryTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); 
    const offset = (page - 1) * limit;

    const { material_id, transaction_type, source, start_date, end_date, search } = req.query;

    let queryConditions = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (material_id && !isNaN(Number(material_id))) {
      queryConditions += ` AND it.material_id = $${paramIndex}`;
      queryParams.push(Number(material_id));
      paramIndex++;
    }

    if (transaction_type && ['IN', 'OUT'].includes(transaction_type.toUpperCase())) {
      queryConditions += ` AND it.transaction_type = $${paramIndex}`;
      queryParams.push(transaction_type.toUpperCase());
      paramIndex++;
    }

    if (source && ['JOB_EXECUTION', 'PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(source.toUpperCase())) {
      queryConditions += ` AND it.source = $${paramIndex}`;
      queryParams.push(source.toUpperCase());
      paramIndex++;
    }

    if (start_date) {
      queryConditions += ` AND it.created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      queryConditions += ` AND it.created_at <= $${paramIndex}`;
      queryParams.push(`${end_date} 23:59:59`);
      paramIndex++;
    }

    if (search && search.trim() !== '') {
      queryConditions += ` AND (
        m.name ILIKE $${paramIndex} 
        OR m.sku ILIKE $${paramIndex}
        OR it.source_id::text ILIKE $${paramIndex}
        OR it.notes ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const dataQuery = `
      SELECT 
        it.id, 
        it.material_id,
        it.transaction_type, 
        it.source, 
        it.source_id, 
        it.quantity, 
        it.balance_after, 
        it.unit_cost, 
        it.total_cost,
        it.created_by,
        it.notes,
        it.created_at,
        m.name AS material_name, 
        m.sku AS material_code,
        u.full_name AS created_by_name
      FROM inventory_transactions it
      LEFT JOIN materials m ON it.material_id = m.id
      LEFT JOIN users u ON it.created_by = u.id
      ${queryConditions}
      ORDER BY it.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total_records 
      FROM inventory_transactions it 
      LEFT JOIN materials m ON it.material_id = m.id
      ${queryConditions}
    `;

    const dataParams = [...queryParams, limit, offset];
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, queryParams)
    ]);

    const totalRecords = parseInt(countResult.rows[0].total_records);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total_records: totalRecords,
        total_pages: totalPages,
        current_page: page,
        limit: limit
      }
    });

  } catch (error) {
    console.error("GET_INVENTORY_TRANSACTIONS_ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "حدث خطأ داخلي أثناء جلب حركات المخزن. يرجى مراجعة السجلات." 
    });
  }
};

module.exports = { getInventoryTransactions };