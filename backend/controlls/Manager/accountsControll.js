const db = require('../../config/condb');

const createAccount = async (req, res) => {
  try {
    const { code, name, type } = req.body;


    if (!code || typeof code !== 'string' || code.trim().length === 0 || code.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "كود الحساب مطلوب ويجب أن يكون نصاً لا يتجاوز 50 حرفاً"
      });
    }


    const validTypes = ["REVENUE", "EXPENSE"];
    if (!type || typeof type !== 'string' || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "نوع الحساب غير صالح. يجب أن يكون REVENUE (إيراد) أو EXPENSE (مصروف)"
      });
    }

    const cleanCode = code.trim();
    const cleanName = name.trim();


    const checkCodeQuery = `SELECT id FROM accounts WHERE code = $1 LIMIT 1`;
    const codeResult = await db.query(checkCodeQuery, [cleanCode]);
    
    if (codeResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "كود الحساب مستخدم بالفعل لحساب آخر"
      });
    }

 
    const insertQuery = `
      INSERT INTO accounts (code, name, type) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    
    const values = [cleanCode, cleanName, type];
    const newAccountResult = await db.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      data: newAccountResult.rows[0]
    });

  } catch (error) {
    console.error("CREATE_ACCOUNT_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ داخلي في الخادم"
    });
  }
};

const getAllAccounts = async (req, res) => {
  try {
    const query = `SELECT * FROM accounts ORDER BY code ASC;`;
    const result = await db.query(query);
    
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GET_ACCOUNTS_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الحسابات"
    });
  }
};



const getAccountsList = async (req, res) => {
  try {
    const query = `SELECT id, name, code FROM accounts ORDER BY code ASC;`;
    const result = await db.query(query);
    
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GET_ACCOUNTS_LIST_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الحسابات"
    });
  }
};
module.exports = {
  createAccount,
  getAllAccounts ,
  getAccountsList
};