const db = require('../../config/condb');

const createSafe = async (req, res) => {
  try {
    const { name, type, user_id, is_active } = req.body;


    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: "اسم الخزنة مطلوب ويجب أن يكون نصاً بين 2 و 255 حرفاً"
      });
    }

    const validTypes = ["MAIN", "BANK", "TECHNICIAN_WALLET" ,"DIGITAL_WALLET"];
    if (!type || typeof type !== 'string' || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "نوع الخزنة غير صالح. يجب أن يكون MAIN أو BANK أو TECHNICIAN_WALLET"
      });
    }

    let finalUserId = null;
    if (type === 'TECHNICIAN_WALLET') {
      const parsedUserId = parseInt(user_id, 10);
      if (!user_id || isNaN(parsedUserId) || parsedUserId <= 0) {
        return res.status(400).json({
          success: false,
          message: "يجب اختيار المشرف المسؤول عن العهدة بشكل صحيح"
        });
      }
      finalUserId = parsedUserId;
    }

    let finalIsActive = true;
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: "قيمة الحالة (is_active) غير صالحة"
        });
      }
      finalIsActive = is_active;
    }

    const cleanName = name.trim();

   
    const checkNameQuery = `SELECT id FROM safes WHERE name = $1 LIMIT 1`;
    const nameResult = await db.query(checkNameQuery, [cleanName]);
    
    if (nameResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "يوجد خزنة بهذا الاسم بالفعل"
      });
    }

    if (finalUserId !== null) {
      const checkUserQuery = `SELECT id FROM users WHERE id = $1 LIMIT 1`;
      const userResult = await db.query(checkUserQuery, [finalUserId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "المشرف المختار غير موجود في النظام. الرجاء التأكد من البيانات"
        });
      }
    }

  
    const insertQuery = `
      INSERT INTO safes (name, type, user_id, is_active) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    
    const values = [cleanName, type, finalUserId, finalIsActive];
    const newSafeResult = await db.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      data: newSafeResult.rows[0]
    });

  } catch (error) {
    console.error("CREATE_SAFE_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ داخلي في الخادم"
    });
  }
};

const getAllSafes = async (req, res) => {
  try {
    const query = `SELECT * FROM safes ORDER BY created_at DESC;`;
    const result = await db.query(query);
    
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GET_SAFES_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الخزن"
    });
  }
};

const toggleSafeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

 
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        success: false,
        message: "معرف الخزنة (ID) غير صالح"
      });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "قيمة الحالة يجب أن تكون صحيحة أو خاطئة (Boolean)"
      });
    }

    const updateQuery = `
      UPDATE safes 
      SET is_active = $1 
      WHERE id = $2 
      RETURNING *;
    `;
    
    const result = await db.query(updateQuery, [is_active, parsedId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الخزنة غير موجودة"
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("TOGGLE_SAFE_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ داخلي في الخادم"
    });
  }
};


const getAvailableSafesForUser = async (req, res) => {
  try {
    const userId = req.user.id; 

    const query = `
      SELECT id, name, type
      FROM safes 
      WHERE is_active = true 
        AND (type != 'TECHNICIAN_WALLET' OR user_id = $1)
      ORDER BY type ASC, name ASC;
    `;

    const result = await db.query(query, [userId]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("GET_AVAILABLE_SAFES_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الخزن المتاحة"
    });
  }
};


const getCompanySafes = async (req, res) => {

  try {
    const query = `
      SELECT id, name 
      FROM safes 
      WHERE user_id IS NULL 
        AND is_active = TRUE 
      ORDER BY id ASC
    `;
    
    const result = await db.query(query);

    res.status(200).json({ 
      success: true, 
      data: result.rows 
    });
    
  } catch (error) {
    console.error("GET_COMPANY_SAFES_ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "حدث خطأ أثناء جلب قائمة خزائن ومحافظ الشركة." 
    });
  }
};

const getTechnicianWallets = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id, 
        s.name, 
        s.balance, 
        s.user_id,
        u.full_name AS technician_name
      FROM safes s
      JOIN users u ON s.user_id = u.id
      WHERE s.type = 'TECHNICIAN_WALLET' AND s.is_active = TRUE
      ORDER BY s.name ASC
    `;
    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GET_TECH_WALLETS_ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "حدث خطأ أثناء جلب بيانات عهد الفنيين." 
    });
  }
};

module.exports = {
  createSafe,
  getAllSafes,
  toggleSafeStatus ,
  getAvailableSafesForUser ,
  getCompanySafes ,
  getTechnicianWallets
};