
const db = require('../../../config/condb');


const upsertServiceCommission = async (req, res) => {
  try {
    const { service_id, commission_type, pool_value } = req.body;

    if (!service_id || isNaN(Number(service_id))) {
      return res.status(400).json({ success: false, message: "معرف الخدمة غير صالح." });
    }
    
    const validTypes = ['FIXED_PER_JOB', 'FIXED_PER_UNIT', 'PERCENTAGE'];
    if (!validTypes.includes(commission_type)) {
      return res.status(400).json({ success: false, message: "نوع العمولة غير صالح." });
    }

    if (isNaN(Number(pool_value)) || Number(pool_value) < 0) {
      return res.status(400).json({ success: false, message: "يجب أن تكون قيمة العمولة رقماً موجباً." });
    }

    const query = `
      INSERT INTO service_commission_pools (service_id, commission_type, pool_value, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (service_id) 
      DO UPDATE SET 
        commission_type = EXCLUDED.commission_type,
        pool_value = EXCLUDED.pool_value,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await db.query(query, [service_id, commission_type, pool_value]);

    res.status(200).json({
      success: true,
      message: "تم حفظ إعدادات عمولة الخدمة بنجاح.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("UPSERT_SERVICE_COMMISSION_ERROR:", error);
    res.status(500).json({ success: false, message: "حدث خطأ داخلي أثناء حفظ الإعدادات." });
  }
};


const getAllServiceCommissions = async (req, res) => {
  try {
    const query = `
      SELECT 
        scp.id,
        scp.commission_type,
        scp.pool_value,
        s.id AS service_id,
        s.name AS service_name,
        s.price AS base_price
      FROM services s
      LEFT JOIN service_commission_pools scp ON s.id = scp.service_id
      ORDER BY s.id ASC;
    `;
    const result = await db.query(query);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GET_SERVICE_COMMISSIONS_ERROR:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب قواعد العمولات." });
  }
};

module.exports = {
  upsertServiceCommission,
  getAllServiceCommissions
};