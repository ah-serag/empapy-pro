const pool = require('../../config/condb');

const createPurchaseInvoice = async (req, res) => {
  const client = await pool.connect();
  const created_by = req?.user?.id;

  try {
    const {
      supplier_id,
      supplier_invoice_number,
      items, 
      discount = 0,
      paid_amount = 0,
      safe_id,
      account_id, 
      notes,
      invoice_date
    } = req.body;

  
    if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'البيانات غير مكتملة. يجب تحديد المورد وإضافة صنف واحد على الأقل.' });
    }
    
    if (Number(paid_amount) > 0) {
      if (!safe_id) {
        return res.status(400).json({ error: 'تنبيه أمني: يجب تحديد الخزنة لسحب المبلغ المدفوع.' });
      }
      if (!account_id) {
        return res.status(400).json({ error: 'تنبيه محاسبي: يجب تحديد البند المحاسبي (مثال: موردين / مشتريات) لتسجيل الحركة.' });
      }
    }

    if (Number(discount) < 0 || Number(paid_amount) < 0) {
      return res.status(400).json({ error: 'تنبيه أمني: غير مسموح بإدخال قيم مالية سالبة.' });
    }

    await client.query('BEGIN'); 

    let calculated_total = 0;
    
    for (const item of items) {
      if (!item.material_id || Number(item.quantity) <= 0 || Number(item.unit_price) < 0) {
        throw new Error(`بيانات الصنف (${item.name}) غير صالحة. الكمية والسعر يجب أن تكون أرقاماً موجبة.`);
      }

      if (item.is_serialized) {
        if (!item.serials || !Array.isArray(item.serials) || item.serials.length !== Number(item.quantity)) {
          throw new Error(`الصنف المسريل (${item.name}) يتطلب إدخال عدد سيريالات يطابق الكمية المطلوبة (${item.quantity}).`);
        }
        
        for (const serialObj of item.serials) {
          if (!serialObj.serial_number || serialObj.serial_number.trim() === '') {
            throw new Error(`توجد سيريالات فارغة للصنف (${item.name}). الرجاء تعبئتها.`);
          }
        }
      }

      calculated_total += (Number(item.quantity) * Number(item.unit_price));
    }

    const net_amount = calculated_total - Number(discount);
    
    if (net_amount < 0) throw new Error('قيمة الخصم أكبر من الإجمالي.');
    if (Number(paid_amount) > net_amount) throw new Error('المبلغ المدفوع لا يمكن أن يتجاوز صافي الفاتورة.');

    let payment_status = 'UNPAID';
    if (Number(paid_amount) === net_amount && net_amount > 0) payment_status = 'PAID';
    else if (Number(paid_amount) > 0) payment_status = 'PARTIALLY_PAID';

    const currentYear = new Date().getFullYear();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const invoice_ref = `PI-${currentYear}-${randomDigits}`;

 
    const supplierRes = await client.query(`SELECT balance FROM suppliers WHERE id = $1 FOR UPDATE`, [supplier_id]);
    if (supplierRes.rows.length === 0) throw new Error('المورد المحدد غير موجود.');
    let current_supplier_balance = Number(supplierRes.rows[0].balance);

    if (Number(paid_amount) > 0) {
      const safeRes = await client.query(`SELECT balance FROM safes WHERE id = $1 FOR UPDATE`, [safe_id]);
      if (safeRes.rows.length === 0) throw new Error('الخزنة المحددة غير موجودة.');
      if (Number(safeRes.rows[0].balance) < Number(paid_amount)) {
        throw new Error(`رصيد الخزنة الحالي (${safeRes.rows[0].balance}) لا يكفي لسداد الدفعة.`);
      }
    }

   
    const invoiceRes = await client.query(`
      INSERT INTO purchase_invoices 
      (invoice_ref, supplier_invoice_number, supplier_id, total_amount, discount, net_amount, paid_amount, payment_status, safe_id, notes, created_by, invoice_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, CURRENT_DATE))
      RETURNING id
    `, [
      invoice_ref, supplier_invoice_number || null, supplier_id, calculated_total, discount, net_amount, paid_amount, payment_status, safe_id || null, notes, created_by, invoice_date
    ]);
    const invoice_id = invoiceRes.rows[0].id;

 
    const targetWarehouse = 'المخزن الرئيسي';

    for (const item of items) {
      const purchased_qty = Number(item.quantity);
      const purchased_price = Number(item.unit_price);
      const item_total = purchased_qty * purchased_price;

      const matRes = await client.query(`SELECT current_cost FROM materials WHERE id = $1 FOR UPDATE`, [item.material_id]);
      if (matRes.rows.length === 0) throw new Error(`الخامة (${item.name}) غير موجودة بقاعدة البيانات.`);
      const old_current_cost = Number(matRes.rows[0].current_cost) || 0;

      const totalQtyRes = await client.query(`SELECT COALESCE(SUM(quantity), 0) AS total_qty FROM inventory WHERE material_id = $1`, [item.material_id]);
      const current_total_qty = Number(totalQtyRes.rows[0].total_qty);

      await client.query(`
        INSERT INTO purchase_invoice_items (invoice_id, material_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [invoice_id, item.material_id, purchased_qty, purchased_price, item_total]);

      if (item.is_serialized && item.serials) {
        for (const serialObj of item.serials) {
          try {
            await client.query(`
              INSERT INTO material_serials (material_id, serial_number, status)
              VALUES ($1, $2, 'AVAILABLE')
            `, [item.material_id, serialObj.serial_number.trim()]);
          } catch (err) {
            if (err.code === '23505') { 
              throw new Error(`السيريال (${serialObj.serial_number}) مكرر وموجود مسبقاً في المخزن للصنف (${item.name}).`);
            }
            throw err;
          }
        }
      }

      const checkInv = await client.query(`
        SELECT id, quantity 
        FROM inventory 
        WHERE material_id = $1 AND warehouse_name = $2 
        FOR UPDATE
      `, [item.material_id, targetWarehouse]);

      let balance_after = 0;

      if (checkInv.rows.length > 0) {
        // الصنف موجود بالفعل -> زيادة الرصيد
        const updateInvRes = await client.query(`
          UPDATE inventory 
          SET quantity = quantity + $1, last_updated = CURRENT_TIMESTAMP 
          WHERE material_id = $2 AND warehouse_name = $3
          RETURNING quantity
        `, [purchased_qty, item.material_id, targetWarehouse]);
        balance_after = updateInvRes.rows[0].quantity;
      } else {

        const insertInvRes = await client.query(`
          INSERT INTO inventory (material_id, warehouse_name, quantity, last_updated)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          RETURNING quantity
        `, [item.material_id, targetWarehouse, purchased_qty]);
        balance_after = insertInvRes.rows[0].quantity;
      }

      await client.query(`
        INSERT INTO inventory_transactions 
        (material_id, transaction_type, source, source_id, quantity, balance_after, unit_cost, created_by, notes)
        VALUES ($1, 'IN', 'PURCHASE', $2, $3, $4, $5, $6, $7)
      `, [
        item.material_id, invoice_id, purchased_qty, balance_after, purchased_price, created_by, `شراء بموجب فاتورة ${invoice_ref}`
      ]); 

      // ز) حساب المتوسط المرجح والتحديث في جدول materials (الحقل: current_cost)
      let new_current_cost = purchased_price; 
      if (current_total_qty > 0) {
        new_current_cost = ((current_total_qty * old_current_cost) + (purchased_qty * purchased_price)) / (current_total_qty + purchased_qty);
      }
      
      await client.query(`UPDATE materials SET current_cost = $1 WHERE id = $2`, [new_current_cost, item.material_id]);
    }

  
    current_supplier_balance += net_amount;
    await client.query(`
      INSERT INTO supplier_transactions (supplier_id, transaction_type, reference_id, reference_type, amount, balance_after, notes, created_by)
      VALUES ($1, 'INVOICE', $2, 'PURCHASE_INVOICE', $3, $4, $5, $6)
    `, [supplier_id, invoice_id, net_amount, current_supplier_balance, `فاتورة مشتريات رقم ${invoice_ref}`, created_by]);

    if (Number(paid_amount) > 0) {
      current_supplier_balance -= Number(paid_amount);
      await client.query(`
        INSERT INTO supplier_transactions (supplier_id, transaction_type, reference_id, reference_type, amount, balance_after, notes, created_by)
        VALUES ($1, 'PAYMENT', $2, 'PURCHASE_INVOICE', $3, $4, $5, $6)
      `, [supplier_id, invoice_id, paid_amount, current_supplier_balance, `دفعة نقدية لفاتورة ${invoice_ref}`, created_by]);

      await client.query(`UPDATE safes SET balance = balance - $1 WHERE id = $2`, [paid_amount, safe_id]);

      await client.query(`
        INSERT INTO treasury_transactions (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
        VALUES ($1, $2, 'OUT', $3, 'PURCHASE_PAYMENT', $4, $5, $6)
      `, [
        safe_id, 
        account_id, 
        paid_amount, 
        invoice_id, 
        `صرف نقدي للمورد - فاتورة مشتريات ${invoice_ref}`, 
        created_by
      ]);

      await client.query(`
        INSERT INTO supplier_payments (supplier_id, invoice_id, safe_id, account_id, amount, payment_method, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, 'CASH', $6, $7)
      `, [
        supplier_id, 
        invoice_id, 
        safe_id, 
        account_id, 
        paid_amount, 
        `دفعة نقدية مرتبطة بالفاتورة ${invoice_ref}`, 
        created_by
      ]);
    }

    await client.query(`UPDATE suppliers SET balance = $1 WHERE id = $2`, [current_supplier_balance, supplier_id]);

    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'تم تسجيل الفاتورة، وتحديث المخازن والسيريالات والماليات بنجاح.',
      data: { invoice_id, invoice_ref, net_amount, payment_status }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("CREATE_PURCHASE_INVOICE_ERROR:", error);
    res.status(400).json({
      success: false,
      message: error.message || 'حدث خطأ غير متوقع أثناء تسجيل الفاتورة.'
    });
  } finally {
    client.release();
  }
};





const getAllPurchaseInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    const queryParams = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause += ` AND (pi.invoice_ref ILIKE $${queryParams.length} OR s.name ILIKE $${queryParams.length})`;
    }

    if (status) {
      queryParams.push(status);
      whereClause += ` AND pi.payment_status = $${queryParams.length}`;
    }

    const query = `
      SELECT 
        pi.id, pi.invoice_ref, pi.net_amount, pi.paid_amount, 
        pi.payment_status, pi.invoice_date,
        s.name AS supplier_name
      FROM purchase_invoices pi
      JOIN suppliers s ON pi.supplier_id = s.id
      ${whereClause}
      ORDER BY pi.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM purchase_invoices pi 
      JOIN suppliers s ON pi.supplier_id = s.id 
      ${whereClause}
    `;
    
    const [invoicesRes, countRes] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, queryParams.length - 2))
    ]);

    res.status(200).json({
      success: true,
      data: invoicesRes.rows,
      total: parseInt(countRes.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
    });
  } catch (error) {
    console.error("GET_ALL_INVOICES_ERROR:", error);
    res.status(500).json({ success: false, message: 'خطأ في جلب الفواتير' });
  }
};

const getPurchaseInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'معرف الفاتورة غير صالح.' });
    }

    const invoiceQuery = `
      SELECT 
        pi.*,
        s.name AS supplier_name, 
        s.company_name AS supplier_company,
        sf.name AS safe_name,
        u.full_name AS created_by_name
      FROM purchase_invoices pi
      JOIN suppliers s ON pi.supplier_id = s.id
      LEFT JOIN safes sf ON pi.safe_id = sf.id
      LEFT JOIN users u ON pi.created_by = u.id
      WHERE pi.id = $1
    `;
    const invoiceRes = await pool.query(invoiceQuery, [id]);

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }

    const invoice = invoiceRes.rows[0];

    // 2. جلب أصناف الفاتورة
    const itemsQuery = `
      SELECT 
        pii.id, pii.quantity, pii.unit_price, pii.total_price,
        m.name AS material_name, m.sku AS material_sku, m.is_serialized
      FROM purchase_invoice_items pii
      JOIN materials m ON pii.material_id = m.id
      WHERE pii.invoice_id = $1
    `;
    const itemsRes = await pool.query(itemsQuery, [id]);
    invoice.items = itemsRes.rows;

    // 3. جلب سجل الدفعات الخاص بهذه الفاتورة حصرياً (الجدول الجديد)
    const paymentsQuery = `
      SELECT 
        sp.id, 
        sp.amount, 
        sp.payment_method, 
        sp.notes, 
        sp.created_at,
        sf.name AS safe_name,
        acc.name AS account_name,
        u.full_name AS created_by_name
      FROM supplier_payments sp
      LEFT JOIN safes sf ON sp.safe_id = sf.id
      LEFT JOIN accounts acc ON sp.account_id = acc.id
      LEFT JOIN users u ON sp.created_by = u.id
      WHERE sp.invoice_id = $1
      ORDER BY sp.created_at DESC
    `;
    const paymentsRes = await pool.query(paymentsQuery, [id]);
    invoice.payments = paymentsRes.rows;

    // إرسال النتيجة المكتملة للفرونت إند
    res.status(200).json({ success: true, data: invoice });

  } catch (error) {
    console.error("GET_INVOICE_BY_ID_ERROR:", error);
    res.status(500).json({ success: false, message: 'خطأ داخلي أثناء جلب تفاصيل الفاتورة.' });
  }
};

 
const payPurchaseInvoice = async (req, res) => {
  const client = await pool.connect();
  const created_by = req?.user?.id;
  const { id: invoice_id } = req.params;

  try {
    const { amount, safe_id, account_id, notes } = req.body;
    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'المبلغ يجب أن يكون أكبر من صفر.' });
    }
    if (!safe_id) {
      return res.status(400).json({ success: false, message: 'يجب تحديد الخزنة.' });
    }
    if (!account_id) {
      return res.status(400).json({ success: false, message: 'يجب تحديد البند المحاسبي لتسجيل الدفعة المالية.' });
    }

    await client.query('BEGIN');

    const invoiceRes = await client.query(`
      SELECT net_amount, paid_amount, payment_status, supplier_id, invoice_ref 
      FROM purchase_invoices 
      WHERE id = $1 FOR UPDATE
    `, [invoice_id]);

    if (invoiceRes.rows.length === 0) {
      throw new Error('الفاتورة غير موجودة.');
    }

    const invoice = invoiceRes.rows[0];
    
    if (invoice.payment_status === 'PAID') {
      throw new Error('هذه الفاتورة مسددة بالكامل مسبقاً.');
    }

    const netAmount = Number(invoice.net_amount);
    const oldPaidAmount = Number(invoice.paid_amount);
    const remainingAmount = netAmount - oldPaidAmount;

    if (paymentAmount > remainingAmount) {
      throw new Error(`المبلغ المطلوب سداده (${paymentAmount}) يتجاوز المتبقي من الفاتورة (${remainingAmount}).`);
    }

    const safeRes = await client.query(`SELECT balance, name FROM safes WHERE id = $1 FOR UPDATE`, [safe_id]);
    if (safeRes.rows.length === 0) throw new Error('الخزنة المحددة غير موجودة.');
    
    const safeBalance = Number(safeRes.rows[0].balance);
    if (safeBalance < paymentAmount) {
      throw new Error(`رصيد الخزنة الحالية (${safeRes.rows[0].name}) لا يكفي لسداد هذا المبلغ.`);
    }

    const supplierRes = await client.query(`SELECT balance FROM suppliers WHERE id = $1 FOR UPDATE`, [invoice.supplier_id]);
    if (supplierRes.rows.length === 0) throw new Error('المورد غير موجود.');
    let supplierBalance = Number(supplierRes.rows[0].balance);

  
    const newPaidAmount = oldPaidAmount + paymentAmount;
    const newPaymentStatus = newPaidAmount >= netAmount ? 'PAID' : 'PARTIALLY_PAID';

    await client.query(`
      UPDATE purchase_invoices 
      SET paid_amount = $1, payment_status = $2 
      WHERE id = $3
    `, [newPaidAmount, newPaymentStatus, invoice_id]);

    await client.query(`UPDATE safes SET balance = balance - $1 WHERE id = $2`, [paymentAmount, safe_id]);
    
    await client.query(`
      INSERT INTO treasury_transactions (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
      VALUES ($1, $2, 'OUT', $3, 'PURCHASE_PAYMENT', $4, $5, $6)
    `, [
      safe_id, 
      account_id, 
      paymentAmount, 
      invoice_id, 
      notes || `سداد دفعة من فاتورة المشتريات رقم ${invoice.invoice_ref}`, 
      created_by
    ]);

    await client.query(`
      INSERT INTO supplier_payments (supplier_id, invoice_id, safe_id, account_id, amount, payment_method, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, 'CASH', $6, $7)
    `, [
      invoice.supplier_id, 
      invoice_id, 
      safe_id, 
      account_id, 
      paymentAmount, 
      notes || `دفعة نقدية لفاتورة رقم ${invoice.invoice_ref}`, 
      created_by
    ]);

    supplierBalance -= paymentAmount;
    await client.query(`UPDATE suppliers SET balance = $1 WHERE id = $2`, [supplierBalance, invoice.supplier_id]);
    
    await client.query(`
      INSERT INTO supplier_transactions (supplier_id, transaction_type, reference_id, reference_type, amount, balance_after, notes, created_by)
      VALUES ($1, 'PAYMENT', $2, 'PURCHASE_INVOICE', $3, $4, $5, $6)
    `, [
      invoice.supplier_id, 
      invoice_id, 
      paymentAmount, 
      supplierBalance, 
      notes || `دفعة نقدية لفاتورة ${invoice.invoice_ref}`, 
      created_by
    ]);

    await client.query('COMMIT'); 

    res.status(200).json({
      success: true,
      message: 'تم سداد الدفعة بنجاح وتحديث جميع الحسابات والخزائن.',
      data: { invoice_id, newPaymentStatus, newPaidAmount }
    });

  } catch (error) {
    await client.query('ROLLBACK'); 
    console.error("PAY_INVOICE_ERROR:", error);
    res.status(400).json({ success: false, message: error.message || 'حدث خطأ أثناء السداد.' });
  } finally {
    client.release();
  }
};


module.exports = { createPurchaseInvoice  , getAllPurchaseInvoices , getPurchaseInvoiceById , payPurchaseInvoice };