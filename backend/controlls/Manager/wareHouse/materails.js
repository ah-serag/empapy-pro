const db  = require('../../../config/condb') ; 




const createMaterial = async (req, res) => {
  try {
    const { sku, name, category_id, is_serialized, current_cost, current_price, unit, is_active } = req.body;
    
    const nameCheck = await db.query(`SELECT id FROM materials WHERE name = $1 LIMIT 1`, [name]);
    if (nameCheck.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'اسم الصنف مسجل مسبقاً' });
    }

    const skuCheck = await db.query(`SELECT id FROM materials WHERE sku = $1 LIMIT 1`, [sku]);
    if (skuCheck.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'كود القطعة (SKU) مسجل مسبقاً لصنف آخر' });
    }

    const categoryCheck = await db.query(`SELECT id FROM material_categories WHERE id = $1 LIMIT 1`, [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'القسم المختار غير موجود' });
    }

    const result = await db.query(
      `INSERT INTO materials 
        (sku , name, category_id, is_serialized, current_cost, current_price, unit, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [sku, name, category_id, is_serialized, current_cost, current_price, unit, is_active]
    );
    
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'خطأ في السيرفر', error: error.message });
  }
};



const getMaterials = async (req, res) => {
  try {

    const result = await db.query(`
      SELECT 
        m.*, 
        c.name as category_name,
        COALESCE(SUM(i.quantity), 0) as quantity
      FROM materials m
      LEFT JOIN material_categories c ON m.category_id = c.id
      LEFT JOIN inventory i ON m.id = i.material_id
      GROUP BY m.id, c.name
      ORDER BY m.name ASC
    `);
    
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'خطأ في السيرفر', error: error.message });
  }
};



const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { 
      name, 
      sku, 
      category_id, 
      current_cost, 
      current_price, 
      unit, 
      is_serialized, 
      is_active 
    } = req.body;
    
    const materialCheck = await db.query(`SELECT id FROM materials WHERE id = $1 LIMIT 1`, [id]);
    if (materialCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'الصنف غير موجود' });
    }
    
    const result = await db.query(
      `UPDATE materials 
       SET 
         name = $1, 
         sku = $2,
         category_id = $3,
         current_cost = $4, 
         current_price = $5, 
         unit = $6,
         is_serialized = $7,
         is_active = $8
       WHERE id = $9 
       RETURNING *`,
      [
        name, 
        sku, 
        category_id, 
        current_cost, 
        current_price, 
        unit, 
        is_serialized, 
        is_active, 
        id
      ]
    );
    
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'خطأ في السيرفر', error: error.message });
  }
};


const deactivateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const materialCheck = await db.query(
      `SELECT id, is_active FROM materials WHERE id = $1 LIMIT 1`, 
      [id]
    );
    
    if (materialCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'الصنف غير موجود' });
    }
    
    const currentActiveStatus = materialCheck.rows[0].is_active;
    const newActiveStatus = !currentActiveStatus;
    
    await db.query(
      `UPDATE materials SET is_active = $1 WHERE id = $2`, 
      [newActiveStatus, id]
    );
    
    res.status(200).json({ 
      status: 'success', 
      message: 'تم تعديل الحالة بنجاح',
      is_active: newActiveStatus 
    });
    
  } catch (error) {
    console.error("Error toggling material status:", error);
    res.status(500).json({ status: 'error', message: 'خطأ في السيرفر', error: error.message });
  }
};


module.exports = {
  createMaterial,
  getMaterials,
  updateMaterial,
  deactivateMaterial
};