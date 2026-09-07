const pool = require("../../../config/condb");

// ================= Categories =================

const createCategory = async (req, res) => {
  try {
    const { name_ar, name_en, icon, sort_order, is_active } = req.body;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, message: "Arabic and English names are required." });
    }

    const result = await pool.query(
      `INSERT INTO service_categories (name_ar, name_en, icon, sort_order, is_active)
       VALUES ($1, $2, $3, COALESCE($4, 0), COALESCE($5, true))
       RETURNING *`,
      [name_ar, name_en, icon || null, sort_order, is_active]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during category creation." });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { active_only } = req.query;
    let query = `SELECT * FROM service_categories`;
    const params = [];

    if (active_only === "true") {
      query += ` WHERE is_active = true`;
    }
    query += ` ORDER BY sort_order ASC, created_at DESC`;

    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching categories." });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM service_categories WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching category." });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_ar, name_en, icon, sort_order, is_active } = req.body;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, message: "Arabic and English names cannot be empty." });
    }

    const result = await pool.query(
      `UPDATE service_categories
       SET name_ar = $1, name_en = $2, icon = $3, sort_order = $4, is_active = $5
       WHERE id = $6
       RETURNING *`,
      [name_ar, name_en, icon || null, sort_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found to update." });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during category update." });
  }
};

const deleteCategory = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query("BEGIN");

    const servicesCheck = await client.query(`SELECT id FROM services WHERE category_id = $1 LIMIT 1`, [id]);
    if (servicesCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete category because it contains linked services. Delete services first." 
      });
    }

    const result = await client.query(`DELETE FROM service_categories WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    await client.query("COMMIT");
    return res.status(200).json({ success: true, message: "Category deleted successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json({ success: false, message: "Database error during category deletion." });
  } finally {
    client.release();
  }
};

// ================= Services =================

const createService = async (req, res) => {
  try {
    let { category_id, name_ar, name_en, base_price, duration_hours, is_active } = req.body;

    name_ar = name_ar?.trim();
    name_en = name_en?.trim();

    if (!category_id || !name_ar || !name_en) {
      return res.status(400).json({ 
        success: false, 
        message: "معرف القسم، الاسم بالعربية، والاسم بالإنجليزية مطلوبة." 
      });
    }

    // 3. التحقق من وجود القسم (Category)
    const categoryCheck = await pool.query(`SELECT id FROM service_categories WHERE id = $1`, [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "معرف القسم المحدد غير موجود في قاعدة البيانات." 
      });
    }

    // 4. الفحص المسبق (Pre-flight Check) لأسماء الخدمات لتوفير رسالة مخصصة
    // نستخدم ILIKE أو LOWER لضمان عدم تكرار الاسم حتى لو اختلف حجم الحروف (في الإنجليزي)
    const duplicateCheck = await pool.query(
      `SELECT name_ar, name_en FROM services WHERE name_ar = $1 OR LOWER(name_en) = LOWER($2)`,
      [name_ar, name_en]
    );

    if (duplicateCheck.rows.length > 0) {
      const duplicate = duplicateCheck.rows[0];
      if (duplicate.name_ar.trim() === name_ar) {
        return res.status(400).json({ success: false, message: "تنبيه: يوجد خدمة مسجلة بنفس الاسم العربي بالفعل." });
      }
      if (duplicate.name_en.toLowerCase() === name_en.toLowerCase()) {
        return res.status(400).json({ success: false, message: "تنبيه: يوجد خدمة مسجلة بنفس الاسم الإنجليزي بالفعل." });
      }
    }

    // 5. الإدخال النهائي في قاعدة البيانات
    const result = await pool.query(
      `INSERT INTO services (
        category_id, name_ar, name_en, base_price, duration_hours, is_active
       )
       VALUES ($1, $2, $3, COALESCE($4, 0.00), COALESCE($5, 1.0), COALESCE($6, true))
       RETURNING *`,
      [category_id, name_ar, name_en, base_price, duration_hours, is_active]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error("CREATE_SERVICE_ERROR:", err);
    
    if (err.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: "تنبيه أمني: تم رفض الإدخال من قاعدة البيانات لأن الاسم مكرر." 
      });
    }

    return res.status(500).json({ success: false, message: "حدث خطأ داخلي في قاعدة البيانات أثناء إنشاء الخدمة." });
  }
};

const getAllServices = async (req, res) => {
  try {
    const { category_id, active_only } = req.query;
    let query = `SELECT * FROM services WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (category_id) {
      query += ` AND category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (active_only === "true") {
      query += ` AND is_active = true`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching services." });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM services WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching service." });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    // تم حذف الحقول الملغية من هنا
    const { category_id, name_ar, name_en, base_price, duration_hours, is_active } = req.body;

    if (!category_id || !name_ar || !name_en) {
      return res.status(400).json({ success: false, message: "Category ID, Arabic name, and English name are required." });
    }

    const categoryCheck = await pool.query(`SELECT id FROM service_categories WHERE id = $1`, [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "The specified category ID does not exist." });
    }

    const result = await pool.query(
      `UPDATE services
       SET category_id = $1, name_ar = $2, name_en = $3, 
           base_price = $4, duration_hours = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [category_id, name_ar, name_en, base_price, duration_hours, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Service not found to update." });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during service update." });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await pool.query(`
      SELECT 
        EXISTS(SELECT 1 FROM job_execution_services WHERE service_id = $1) AS in_jobs,
        EXISTS(SELECT 1 FROM technician_earnings WHERE service_id = $1) AS in_earnings
    `, [id]);
    
    if (checkResult.rows[0].in_jobs || checkResult.rows[0].in_earnings) {
      return res.status(400).json({ 
        success: false, 
        message: "لا يمكن الحذف لارتباط الخدمة بمهام ومستحقات سابقة." 
      });
    }

    const result = await pool.query(`DELETE FROM services WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "الخدمة غير موجودة." });
    }

    return res.status(200).json({ success: true, message: "تم حذف الخدمة بنجاح." });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ 
        success: false, 
        message: "مرفوض أمنياً: الخدمة مستخدمة في النظام." 
      });
    }
    return res.status(500).json({ success: false, message: "حدث خطأ في النظام أثناء الحذف." });
  }
};

const getCategoriesAndServices = async (req, res) => {
  try {
    const query = `
      SELECT 
        sc.*,
        COALESCE(
          json_agg(
            (
              to_jsonb(s.*) || 
              jsonb_build_object(
                'commission_type', scp.commission_type,
                'pool_value', scp.pool_value,
                'has_commission_rule', CASE WHEN scp.id IS NOT NULL THEN true ELSE false END
              )
            ) ORDER BY s.created_at DESC
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'::json
        ) as services
      FROM service_categories sc
      LEFT JOIN services s ON sc.id = s.category_id
      LEFT JOIN service_commission_pools scp ON s.id = scp.service_id
      GROUP BY sc.id
      ORDER BY sc.sort_order ASC, sc.created_at DESC;
    `;
    
    const result = await pool.query(query);
    
    return res.status(200).json({ 
      success: true, 
      data: result.rows 
    });
  } catch (err) {
    console.error("GET_CATEGORIES_ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Database error during fetching aggregated data." 
    });
  }
};



module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getCategoriesAndServices
};