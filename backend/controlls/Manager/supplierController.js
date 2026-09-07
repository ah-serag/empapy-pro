const pool = require('../../config/condb');




const getSuppliers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); 
    const offset = (page - 1) * limit;


    const { search, status } = req.query;

    let queryConditions = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      queryConditions += ` AND status = $${paramIndex}`;
      queryParams.push(status.toUpperCase());
      paramIndex++;
    }

    if (search && search.trim() !== '') {
      queryConditions += ` AND (
        name ILIKE $${paramIndex} 
        OR company_name ILIKE $${paramIndex} 
        OR phone ILIKE $${paramIndex}
        OR tax_number ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // 3. استعلام جلب البيانات
    const dataQuery = `
      SELECT 
        id, name, phone, email, address, company_name, tax_number, balance, status, created_at
      FROM suppliers
      ${queryConditions}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // 4. استعلام العد (Count) لمعرفة إجمالي السجلات وتحديد أرقام الصفحات
    const countQuery = `
      SELECT COUNT(*) AS total_records 
      FROM suppliers
      ${queryConditions}
    `;

    // تنفيذ الاستعلامين بالتوازي (Performance)
    const dataParams = [...queryParams, limit, offset];
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, queryParams)
    ]);

    const totalRecords = parseInt(countResult.rows[0].total_records);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      data: dataResult.rows,
      pagination: {
        totalRecords: totalRecords,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: limit
      }
    });

  } catch (error) {
    console.error("GET_SUPPLIERS_ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء جلب قائمة الموردين.' 
    });
  }
};








const createSupplier = async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      name, phone, email, address, company_name, tax_number 
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'اسم المورد مطلوب.' });
    }

  
    const checkDuplicate = await client.query(`
      SELECT id FROM suppliers 
      WHERE (name = $1) 
         OR (phone = $2 AND phone IS NOT NULL AND phone != '') 
         OR (tax_number = $3 AND tax_number IS NOT NULL AND tax_number != '')
      LIMIT 1
    `, [name.trim(), phone?.trim(), tax_number?.trim()]);

    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ error: 'هذا المورد مسجل مسبقاً (الاسم، التليفون، أو الرقم الضريبي موجود بالفعل).' });
    }

    // 3. الإدراج الآمن (ممنوع إدخال Balance من الفرونت إند، يأخذ الديفولت 0.00)
    const newSupplier = await client.query(`
      INSERT INTO suppliers (name, phone, email, address, company_name, tax_number, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, name, company_name, balance, status
    `, [
      name.trim(),
      phone?.trim() || null,
      email?.trim() || null,
      address?.trim() || null,
      company_name?.trim() || null,
      tax_number?.trim() || null
    ]);

    res.status(201).json({
      success: true,
      message: 'تم إضافة المورد بنجاح.',
      data: newSupplier.rows[0]
    });

  } catch (error) {
    console.error("CREATE_SUPPLIER_ERROR:", error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة المورد.' });
  } finally {
    client.release();
  }
};


const updateSupplier = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { 
      name, phone, email, address, company_name, tax_number, status 
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'معرف المورد غير صالح.' });
    }
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'اسم المورد مطلوب.' });
    }
    if (status && !['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'حالة المورد غير صالحة.' });
    }

    // 1. التحقق من وجود المورد
    const supplierCheck = await client.query(`SELECT id FROM suppliers WHERE id = $1`, [id]);
    if (supplierCheck.rows.length === 0) {
      return res.status(404).json({ error: 'المورد غير موجود.' });
    }

    // 2. التحقق من عدم التكرار مع مورد آخر
    const duplicateCheck = await client.query(`
      SELECT id FROM suppliers 
      WHERE id != $1 
        AND ((name = $2) OR (phone = $3 AND phone IS NOT NULL AND phone != ''))
      LIMIT 1
    `, [id, name.trim(), phone?.trim()]);

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'يوجد مورد آخر مسجل بنفس الاسم أو رقم الهاتف.' });
    }

    // 3. التعديل الآمن (ممنوووووع تعديل حقل balance هنا نهائياً)
    const updatedSupplier = await client.query(`
      UPDATE suppliers 
      SET 
        name = $1, 
        phone = $2, 
        email = $3, 
        address = $4, 
        company_name = $5, 
        tax_number = $6, 
        status = COALESCE($7, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, name, company_name, phone, status, balance
    `, [
      name.trim(),
      phone?.trim() || null,
      email?.trim() || null,
      address?.trim() || null,
      company_name?.trim() || null,
      tax_number?.trim() || null,
      status ? status.toUpperCase() : null,
      id
    ]);

    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات المورد بنجاح.',
      data: updatedSupplier.rows[0]
    });

  } catch (error) {
    console.error("UPDATE_SUPPLIER_ERROR:", error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث بيانات المورد.' });
  } finally {
    client.release();
  }
};


const getSuppliersForSelect = async (req, res) => {
  try {
    const query = `
      SELECT id, name, company_name, balance 
      FROM suppliers 
      WHERE status = 'ACTIVE' 
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GET_SUPPLIERS_SELECT_ERROR:", error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب قائمة الموردين.' });
  }
};



const getSupplierTransactions = async (req, res) => {
  try {
    let { 
      page = 1, 
      limit = 15, 
      supplier_id, 
      transaction_type, 
      start_date, 
      end_date,
      search 
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = (parsedPage - 1) * parsedLimit;
    
    let baseQuery = `
      SELECT 
        st.id, 
        st.transaction_type, 
        st.reference_id, 
        st.reference_type, 
        st.amount, 
        st.balance_after, 
        st.notes, 
        st.created_at,
        s.id AS supplier_id, 
        s.name AS supplier_name, 
        s.company_name, 
        s.phone AS supplier_phone, 
        s.balance AS supplier_current_balance,
        u.full_name AS created_by_name
      FROM supplier_transactions st
      JOIN suppliers s ON st.supplier_id = s.id
      LEFT JOIN users u ON st.created_by = u.id
      WHERE 1=1
    `;
    
    const values = [];
    let valueIndex = 1;

    if (search && search.trim() !== '') {
      baseQuery += ` AND (
        s.name ILIKE $${valueIndex} OR 
        s.phone ILIKE $${valueIndex} OR 
        s.company_name ILIKE $${valueIndex} OR 
        st.id::TEXT = $${valueIndex}
      )`;
      values.push(`%${search.trim()}%`);
      valueIndex++;
    }

    if (supplier_id && !isNaN(supplier_id)) {
      baseQuery += ` AND st.supplier_id = $${valueIndex++}`;
      values.push(parseInt(supplier_id, 10));
    }

    if (transaction_type && transaction_type !== 'ALL' && transaction_type.trim() !== '') {
      baseQuery += ` AND st.transaction_type = $${valueIndex++}`;
      values.push(transaction_type.trim());
    }

    if (start_date && end_date) {
      baseQuery += ` AND st.created_at::DATE >= $${valueIndex++}::DATE AND st.created_at::DATE <= $${valueIndex++}::DATE`;
      values.push(start_date, end_date);
    } else if (start_date) {
      baseQuery += ` AND st.created_at::DATE >= $${valueIndex++}::DATE`;
      values.push(start_date);
    } else if (end_date) {
      baseQuery += ` AND st.created_at::DATE <= $${valueIndex++}::DATE`;
      values.push(end_date);
    }

    // حساب العدد الإجمالي للصفحات (بدون Limit و Offset)
    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS total`;
    const totalResult = await pool.query(countQuery, values);
    const totalRecords = parseInt(totalResult.rows[0].count, 10);

    // إضافة الترتيب وتقسيم الصفحات
    baseQuery += ` ORDER BY st.created_at DESC LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
    values.push(parsedLimit, offset);

    // تنفيذ الاستعلام النهائي
    const result = await pool.query(baseQuery, values);

    return res.status(200).json({
      success: true,
      message: "تم جلب حركات الموردين بنجاح.",
      data: result.rows,
      meta: {
        total: totalRecords,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(totalRecords / parsedLimit) || 1,
      }
    });

  } catch (error) {
    console.error("GET_SUPPLIER_TRANSACTIONS_ERROR:", error); 
    return res.status(500).json({ 
      success: false, 
      message: "حدث خطأ أمني أو برمجي أثناء جلب البيانات.",
      error: error.message
    });
  }
};





module.exports = {
  createSupplier,
  updateSupplier,
  getSuppliersForSelect ,
  getSuppliers ,
  getSupplierTransactions
};