const db = require('../../config/condb');


const upsertTechnicianProfile = async (req, res) => {
  try {
    const { user_id, tier, custom_shares } = req.body;

    if (!user_id || isNaN(Number(user_id))) {
      return res.status(400).json({ success: false, message: "معرف المستخدم (user_id) غير صالح." });
    }

    const validTiers = ['LEAD', 'ASSISTANT', 'TRAINEE'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ success: false, message: "تنبيه أمني: الرتبة الوظيفية المحددة غير صالحة." });
    }

    let shares = 1.00;
    if (custom_shares && !isNaN(Number(custom_shares)) && Number(custom_shares) > 0) {
      shares = Number(custom_shares); 
    } else {
      if (tier === 'LEAD') shares = 2.00;
      else if (tier === 'ASSISTANT') shares = 1.00;
      else if (tier === 'TRAINEE') shares = 0.50;
    }

    const query = `
      INSERT INTO technician_profiles (user_id, tier, default_shares, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        tier = EXCLUDED.tier,
        default_shares = EXCLUDED.default_shares,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await db.query(query, [user_id, tier, shares]);

    res.status(200).json({
      success: true,
      message: "تم تحديث الملف الوظيفي والوزن المالي للفني بنجاح.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("UPSERT_TECHNICIAN_PROFILE_ERROR:", error);
    res.status(500).json({ success: false, message: "خطأ داخلي أثناء تحديث بيانات الفني." });
  }
};


const getAllTechnicianProfiles = async (req, res) => {
    
  try {
    const query = `
      SELECT 
        tp.id AS profile_id, 
        tp.tier, 
        tp.default_shares, 
        tp.updated_at,
        u.id AS user_id, 
        u.full_name, 
        u.phone,
        u.email
      FROM technician_profiles tp
      JOIN users u ON tp.user_id = u.id
      ORDER BY tp.tier ASC, u.full_name ASC;
    `;
    const result = await db.query(query);

    res.status(200).json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error("GET_TECHNICIAN_PROFILES_ERROR:", error);
    res.status(500).json({ success: false, message: "خطأ في جلب بيانات الفنيين." });
  }
};

module.exports = {
  upsertTechnicianProfile,
  getAllTechnicianProfiles
};