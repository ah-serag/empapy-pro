const db  = require('../../../config/condb') ; 


const createCategory = async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    
    if (parent_id) {
      const parentCheck = await db.query(`SELECT id FROM material_categories WHERE id = $1 LIMIT 1`, [parent_id]);
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ status: 'error', message: 'القسم الأب المحدد غير موجود' });
      }
    }

    const result = await db.query(
      `INSERT INTO material_categories (name, parent_id) VALUES ($1, $2) RETURNING *`,
      [name, parent_id || null]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'خطأ في السيرفر', error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM material_categories ORDER BY id ASC`);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'خطأ في السيرفر', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategoriesCheck = await db.query(
      `SELECT id FROM material_categories WHERE parent_id = $1 LIMIT 1`, 
      [id]
    );
    if (subCategoriesCheck.rows.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'لا يمكن حذف هذا القسم لأنه يحتوي على أقسام فرعية' 
      });
    }

    const materialsCheck = await db.query(
      `SELECT id FROM materials WHERE category_id = $1 LIMIT 1`, 
      [id]
    );
    if (materialsCheck.rows.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'لا يمكن حذف هذا القسم لوجود أصناف (خامات) مسجلة بداخله' 
      });
    }

    const result = await db.query(`DELETE FROM material_categories WHERE id = $1`, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'القسم غير موجود' });
    }

    res.status(200).json({ status: 'success', message: 'تم الحذف بنجاح' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'خطأ في السيرفر', error: error.message });
  }
};
























module.exports = {
  createCategory,
  getCategories,
  deleteCategory
};