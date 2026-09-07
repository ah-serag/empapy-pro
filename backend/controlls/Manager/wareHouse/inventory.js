const db  = require('../../../config/condb') ; 

const adjustInventory = async (req, res) => {
  const client = await db.connect(); 
  const created_by = req?.user?.id; 

  try {
    const { material_id, warehouse_name, quantity_change, notes } = req.body; 
    const targetWarehouse = warehouse_name || 'المخزن الرئيسي';

    if (!material_id || quantity_change === undefined || quantity_change === 0) {
      return res.status(400).json({ error: 'المدخلات غير صالحة. يجب تحديد الصنف والكمية.' });
    }
    if (!created_by) {
      return res.status(401).json({ error: 'غير مصرح لك بإجراء هذا التعديل.' });
    }

    await client.query('BEGIN'); 

    // 2. التحقق من نوع الصنف وسعره
    const matCheck = await client.query(`
      SELECT is_serialized, current_cost, name 
      FROM materials 
      WHERE id = $1 LIMIT 1
    `, [material_id]);

    if (matCheck.rows.length === 0) {
      throw new Error('الصنف غير موجود.');
    }
    
    if (matCheck.rows[0].is_serialized) {
      throw new Error('هذا الصنف يُدار بالسيريالات، لا يمكن تعديل كميته يدوياً هنا.');
    }

    const unit_cost = matCheck.rows[0].current_cost || 0;

    const currentInv = await client.query(`
      SELECT id, quantity 
      FROM inventory 
      WHERE material_id = $1 AND warehouse_name = $2 
      FOR UPDATE 
    `, [material_id, targetWarehouse]);

    let currentQuantity = 0;
    if (currentInv.rows.length > 0) {
      currentQuantity = Number(currentInv.rows[0].quantity);
    }

    const newQuantity = currentQuantity + Number(quantity_change);

    if (newQuantity < 0) {
      throw new Error('رصيد المخزن لا يكفي لهذه العملية (لا يمكن أن يكون الرصيد سالباً).');
    }

    // 4. تحديث المخزون (أو إضافته إذا لم يكن موجوداً)
    let inventoryResult;
    if (currentInv.rows.length === 0) {
      // إذا كان الصنف لم يدخل هذا المخزن من قبل
      inventoryResult = await client.query(`
        INSERT INTO inventory (material_id, warehouse_name, quantity, last_updated) 
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING *
      `, [material_id, targetWarehouse, newQuantity]);
    } else {
      // تحديث الرصيد الحالي
      inventoryResult = await client.query(`
        UPDATE inventory 
        SET quantity = $1, last_updated = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [newQuantity, currentInv.rows[0].id]);
    }

    // 5. تسجيل حركة المخزن (Inventory Transaction)
    const transaction_type = Number(quantity_change) > 0 ? 'IN' : 'OUT';
    const absQuantity = Math.abs(Number(quantity_change));
    const audit_notes = notes || `تسوية جردية يدوية (${transaction_type === 'IN' ? 'إضافة' : 'خصم'}) للمخزن: ${targetWarehouse}`;

   await client.query(`
      INSERT INTO inventory_transactions 
      (material_id, transaction_type, source, source_id, quantity, balance_after, unit_cost, created_by, notes)
      VALUES ($1, $2, 'ADJUSTMENT', NULL, $3, $4, $5, $6, $7)
    `, [
      material_id,       
      transaction_type,   
      absQuantity,        
      newQuantity,     
      unit_cost,        
      created_by,         
      audit_notes        
    ]);

    await client.query('COMMIT'); 

    res.status(200).json({ 
      success: true, 
      message: 'تم تعديل المخزون وتسجيل الحركة بنجاح.',
      data: inventoryResult.rows[0] 
    });

  } catch (error) {
    await client.query('ROLLBACK'); // 🔴 التراجع عن كل شيء في حال حدوث أي خطأ
    console.error("ADJUST_INVENTORY_ERROR:", error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'حدث خطأ أثناء تعديل المخزون.' 
    });
  } finally {
    client.release(); // 🔴 إغلاق الاتصال لتوفير موارد السيرفر
  }
};


module.exports = { adjustInventory };