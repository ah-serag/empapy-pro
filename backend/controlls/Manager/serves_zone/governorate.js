const pool = require("../../../config/condb");

const createGovernorate = async (req, res) => {
  try {
    const { name_ar, name_en, is_active } = req.body;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, message: "Arabic and English names are required." });
    }

    const result = await pool.query(
      `INSERT INTO governorates (name_ar, name_en, is_active)
       VALUES ($1, $2, COALESCE($3, true))
       RETURNING *`,
      [name_ar, name_en, is_active]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // كود الخطأ في Postgres لو الاسم متكرر (UNIQUE)
      return res.status(400).json({ success: false, message: "Governorate name already exists." });
    }
    return res.status(500).json({ success: false, message: "Database error during governorate creation." });
  }
};

const getAllGovernorates = async (req, res) => {
  try {
    const { active_only, search } = req.query;
    let query = `SELECT * FROM governorates WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (active_only === "true") {
      query += ` AND is_active = true`;
    }

    if (search) {
      query += ` AND (name_ar ILIKE $${paramIndex} OR name_en ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY name_en ASC`;

    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching governorates." });
  }
};

const getGovernorateById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM governorates WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Governorate not found." });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching governorate." });
  }
};

const updateGovernorate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_ar, name_en, is_active } = req.body;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, message: "Required fields cannot be empty." });
    }

    const result = await pool.query(
      `UPDATE governorates
       SET name_ar = $1, name_en = $2, is_active = $3
       WHERE id = $4
       RETURNING *`,
      [name_ar, name_en, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Governorate not found to update." });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: "Governorate name already exists." });
    }
    return res.status(500).json({ success: false, message: "Database error during governorate update." });
  }
};

const deleteGovernorate = async (req, res) => {
  try {
    const { id } = req.params;

    // حماية: التأكد إن المحافظة مفيش مناطق مربوطة بيها قبل الحذف
    const zonesCheck = await pool.query(`SELECT id FROM zones WHERE governorate_id = $1 LIMIT 1`, [id]);
    if (zonesCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete governorate because it has linked zones. Delete or reassign the zones first." 
      });
    }

    const result = await pool.query(`DELETE FROM governorates WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Governorate not found." });
    }

    return res.status(200).json({ success: true, message: "Governorate deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during governorate deletion." });
  }
};

const getGovernoratesAndZones = async (req, res) => {
  try {
    const query = `
      SELECT 
        g.*,
        COALESCE(
          json_agg(z.* ORDER BY z.name_en ASC) FILTER (WHERE z.id IS NOT NULL), 
          '[]'
        ) as zones
      FROM governorates g
      LEFT JOIN zones z ON g.id = z.governorate_id
      GROUP BY g.id
      ORDER BY g.name_en ASC;
    `;
    const result = await pool.query(query);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching aggregated data." });
  }
};


module.exports = {
  createGovernorate,
  getAllGovernorates,
  getGovernorateById,
  updateGovernorate,
  deleteGovernorate ,
  getGovernoratesAndZones
};



