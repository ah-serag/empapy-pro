const db = require('../../../config/condb');




const getExplorerLevel = async (req, res) => {
  try {
    const { categoryId } = req.query;

    let subCategoriesQuery;
    let materialsQuery;
    let breadcrumbsQuery = null; 
    let params = [];

    if (!categoryId || categoryId === 'null') {
      subCategoriesQuery = `SELECT id, name FROM material_categories WHERE parent_id IS NULL ORDER BY name`;
      materialsQuery = null; 
    } else {
      const parsedId = parseInt(categoryId, 10);
      params = [parsedId];

      subCategoriesQuery = `SELECT id, name FROM material_categories WHERE parent_id = $1 ORDER BY name`;

      materialsQuery = `
        SELECT 
          m.id, m.sku, m.name, m.is_serialized, m.current_price , m.current_cost, m.unit, m.is_active,
          COALESCE(inv.total_quantity, 0) AS total_stock,
          COALESCE(ser.available_serials, '[]'::json) AS serials
        FROM materials m
        LEFT JOIN (
          SELECT material_id, SUM(quantity) AS total_quantity FROM inventory GROUP BY material_id
        ) inv ON m.id = inv.material_id
        LEFT JOIN (
          SELECT material_id, json_agg(json_build_object('id', id, 'serial', serial_number)) AS available_serials
          FROM material_serials WHERE status = 'AVAILABLE' GROUP BY material_id
        ) ser ON m.id = ser.material_id
        WHERE m.category_id = $1 AND m.is_active = TRUE
        ORDER BY m.name;
      `;

      breadcrumbsQuery = `
        WITH RECURSIVE category_tree AS (
          SELECT id, name, parent_id, 1 as level
          FROM material_categories
          WHERE id = $1
          
          UNION ALL
          
          SELECT p.id, p.name, p.parent_id, c.level + 1
          FROM material_categories p
          INNER JOIN category_tree c ON c.parent_id = p.id
        )
        SELECT id, name FROM category_tree ORDER BY level DESC; -- الترتيب من الأب الأكبر للقسم الحالي
      `;
    }

    const [categoriesResult, materialsResult, breadcrumbsResult] = await Promise.all([
      db.query(subCategoriesQuery, params),
      materialsQuery ? db.query(materialsQuery, params) : { rows: [] },
      breadcrumbsQuery ? db.query(breadcrumbsQuery, params) : { rows: [] } 
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        breadcrumbs: breadcrumbsResult.rows, 
        subCategories: categoriesResult.rows,
        materials: materialsResult.rows
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
module.exports = {
  getExplorerLevel,
};