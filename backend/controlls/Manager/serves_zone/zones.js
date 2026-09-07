const pool = require("../../../config/condb");

const createZone = async (req, res) => {
  try {
    const { name_ar, name_en, governorate_id, is_active, notes } = req.body;

    if (!name_ar || !name_en || !governorate_id) {
      return res.status(400).json({ success: false, message: "Arabic name, English name, and Governorate are required." });
    }

    const result = await pool.query(
      `INSERT INTO zones (name_ar, name_en, governorate_id, is_active, notes)
       VALUES ($1, $2, $3, COALESCE($4, true), $5)
       RETURNING *`,
      [name_ar, name_en, governorate_id, is_active, notes || null]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during zone creation." });
  }
};

const getAllZones = async (req, res) => { 
  try {
    const { active_only, search, governorate_id } = req.query;
    
    let query = `
      SELECT z.*, g.name_ar AS governorate_name_ar, g.name_en AS governorate_name_en 
      FROM zones z
      LEFT JOIN governorates g ON z.governorate_id = g.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (active_only === "true") {
      query += ` AND z.is_active = true`;
    }

    if (governorate_id) {
      query += ` AND z.governorate_id = $${paramIndex}`;
      params.push(governorate_id);
      paramIndex++;
    }

    // فلتر البحث الشامل (بالاسم أو اسم المحافظة)
    if (search) {
      query += ` AND (
        z.name_ar ILIKE $${paramIndex} OR 
        z.name_en ILIKE $${paramIndex} OR 
        g.name_ar ILIKE $${paramIndex} OR 
        g.name_en ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`); 
      paramIndex++;
    }

    query += ` ORDER BY g.name_en ASC, z.name_en ASC`;

    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching zones." });
  }
};

const getZoneById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT z.*, g.name_ar AS governorate_name_ar, g.name_en AS governorate_name_en 
      FROM zones z
      LEFT JOIN governorates g ON z.governorate_id = g.id
      WHERE z.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Zone not found." }); 
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during fetching zone." });
  }
};

const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_ar, name_en, governorate_id, is_active, notes } = req.body;

    if (!name_ar || !name_en || !governorate_id) {
      return res.status(400).json({ success: false, message: "Required fields cannot be empty." });
    }

    const result = await pool.query(
      `UPDATE zones
       SET name_ar = $1, name_en = $2, governorate_id = $3, is_active = $4, notes = $5
       WHERE id = $6
       RETURNING *`,
      [name_ar, name_en, governorate_id, is_active, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Zone not found to update." });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during zone update." });
  }
};

const deleteZone = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM zones WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Zone not found." });
    }

    return res.status(200).json({ success: true, message: "Zone deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error during zone deletion." });
  }
};

module.exports = {
  createZone,
  getAllZones,
  getZoneById,
  updateZone,
  deleteZone
};