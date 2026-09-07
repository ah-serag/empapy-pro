const db  = require('../../../config/condb') ; 


const addSerial = async (req, res) => {
  const client = await db.connect();
  try {
    const { material_id, serial_number } = req.body;
    
    await client.query('BEGIN');

    const matCheck = await client.query(`SELECT is_serialized FROM materials WHERE id = $1 LIMIT 1`, [material_id]);
    if (matCheck.rows.length === 0 || !matCheck.rows[0].is_serialized) {
      throw new Error('الصنف غير صالح لتسجيل سيريالات');
    }

    const serialCheck = await client.query(`SELECT id FROM material_serials WHERE serial_number = $1 LIMIT 1`, [serial_number]);
    if (serialCheck.rows.length > 0) throw new Error('السيريال مسجل مسبقاً');

    const result = await client.query(
      `INSERT INTO material_serials (material_id, serial_number, status) VALUES ($1, $2, 'AVAILABLE') RETURNING *`,
      [material_id, serial_number]
    );
    
const warehouse_name = 'المخزن الرئيسي';
 await client.query(
      `INSERT INTO inventory (material_id, warehouse_name, quantity) 
       VALUES ($1, $2, 1)
       ON CONFLICT (material_id, warehouse_name) 
       DO UPDATE SET quantity = inventory.quantity + 1`,
      [material_id, warehouse_name]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

const correctSerial = async (req, res) => {
  try {
    const { id } = req.params;
    const { correct_serial_number } = req.body;

    const oldSerialCheck = await db.query(
      `SELECT status FROM material_serials WHERE id = $1 LIMIT 1`, 
      [id]
    );
    
    if (oldSerialCheck.rows.length === 0) {
      return res.status(404).json({ error: 'سجل السيريال غير موجود' });
    }
    if (oldSerialCheck.rows[0].status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'لا يمكن تعديل السيريال لأنه مباع أو مستخدم بالفعل' });
    }

    const conflictCheck = await db.query(
      `SELECT id FROM material_serials WHERE serial_number = $1 LIMIT 1`, 
      [correct_serial_number]
    );
    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({ error: 'رقم السيريال الجديد مسجل مسبقاً لقطعة أخرى' });
    }

    const result = await db.query(
      `UPDATE material_serials SET serial_number = $1 WHERE id = $2 RETURNING *`,
      [correct_serial_number, id]
    );

    res.status(200).json({ success: true, message: 'تم تصحيح السيريال بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'خطأ داخلي', details: error.message });
  }
};

module.exports = { addSerial, correctSerial };