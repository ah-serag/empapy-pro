const pool = require('../../config/condb');

const InvoiceController = {

 async createInvoice(req, res) {
    const client = await pool.connect();
    try {
      const { assignment_id, issued_by, subtotal, discount, notes } = req.body;
    

      const assignmentCheck = await client.query(
        'SELECT id FROM assignments WHERE id = $1',
        [assignment_id]
      );
      if (assignmentCheck.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "المهمة غير موجودة. تأكد من assignment_id." 
        });
      }

      const duplicateCheck = await client.query(
        'SELECT id FROM invoices WHERE assignment_id = $1',
        [assignment_id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "يوجد فاتورة بالفعل لهذه المهمة." 
        });
      }

      const currentYear = new Date().getFullYear();
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const invoice_ref = `INV-${currentYear}${randomDigits}`;

      const calculatedDiscount = discount || 0.00;

      if (parseFloat(calculatedDiscount) > parseFloat(subtotal)) {
        return res.status(400).json({
          success: false,
          message: "قيمة الخصم لا يمكن أن تكون أكبر من إجمالي الفاتورة."
        });
      }

      const total_amount = parseFloat(subtotal) - parseFloat(calculatedDiscount);

      const insertQuery = `
        INSERT INTO invoices 
        (invoice_ref, assignment_id, issued_by, subtotal, discount, total_amount, notes) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *;
      `;
      const values = [invoice_ref, assignment_id, issued_by, subtotal, calculatedDiscount, total_amount, notes];
      
      const newInvoice = await client.query(insertQuery, values);

      return res.status(201).json({
        success: true,
        message: "تم إنشاء الفاتورة بنجاح.",
        data: newInvoice.rows[0]
      });

    } catch (error) {
      console.error('Create Invoice Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: "حدث خطأ داخلي أثناء إنشاء الفاتورة." 
      });
    } finally {
      client.release();
    }
  },


async getInvoices(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      start_date,
      end_date
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (parsedPage - 1) * parsedLimit;

    let baseQuery = `
      FROM invoices i
      JOIN assignments a ON i.assignment_id = a.id
      JOIN bookings b ON a.booking_id = b.id
      LEFT JOIN teams t ON a.team_id = t.id
      WHERE 1=1
    `;
    
    const countParams = [];
    let paramIndex = 1;

    if (status && typeof status === 'string' && status.trim() !== '' && status !== 'all') {
      const validStatuses = ['unpaid', 'partially_paid', 'paid', 'cancelled'];
      const cleanStatus = status.trim();
      if (validStatuses.includes(cleanStatus)) {
        baseQuery += ` AND i.status = $${paramIndex}`;
        countParams.push(cleanStatus);
        paramIndex++;
      }
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const cleanSearch = search.trim();
      const isNumeric = !isNaN(cleanSearch) && cleanSearch !== '';

      if (isNumeric) {
        baseQuery += ` AND (i.id = $${paramIndex} OR a.id = $${paramIndex})`;
        countParams.push(parseInt(cleanSearch, 10));
        paramIndex++;
      } else {
        baseQuery += ` AND (
          i.invoice_ref ILIKE $${paramIndex} OR 
          a.assignment_ref ILIKE $${paramIndex} OR 
          b.booking_ref ILIKE $${paramIndex} OR 
          b.contact_name ILIKE $${paramIndex} OR 
          t.name ILIKE $${paramIndex}
        )`;
        countParams.push(`%${cleanSearch}%`);
        paramIndex++;
      }
    }

    if (start_date && end_date && typeof start_date === 'string' && typeof end_date === 'string') {
      baseQuery += ` AND (i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Cairo')::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      countParams.push(start_date.trim(), end_date.trim());
      paramIndex += 2;
    }

    const selectParams = [...countParams, parsedLimit, offset];
    
    const selectQuery = `
      SELECT 
        i.id AS invoice_id, 
        i.invoice_ref, 
        i.subtotal, 
        i.discount, 
        i.total_amount, 
        i.status AS invoice_status, 
        (i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Cairo') AS invoice_date,
        a.id AS assignment_id,
        a.assignment_ref ,
        b.booking_ref,
        b.contact_name, 
        b.contact_phone, 
        b.address,
        t.id AS team_id, 
        t.name AS team_name,
        
        COALESCE((
          SELECT SUM(amount) 
          FROM invoice_payments 
          WHERE invoice_id = i.id
        ), 0) AS paid_amount,

        -- 🔴 تم إضافة مصفوفة الدفعات هنا بدقة
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', ip.id,
            'amount', ip.amount,
            'payment_method', ip.payment_method,
            'notes', ip.notes,
            'created_at', (ip.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Cairo'),
            'safe_name', s.name
          ) ORDER BY ip.created_at DESC)
          FROM invoice_payments ip
          LEFT JOIN safes s ON s.id = ip.safe_id
          WHERE ip.invoice_id = i.id
        ), '[]'::json) AS payments,

        COALESCE((
          SELECT json_agg(json_build_object(
            'id', jes.id,
            'name', s.name_ar,
            'quantity', jes.quantity,
            'unit_price', jes.unit_price,
            'total_price', jes.total_price
          ))
          FROM job_executions je
          JOIN job_execution_services jes ON jes.execution_id = je.id
          JOIN services s ON s.id = jes.service_id
          WHERE je.assignment_id = i.assignment_id
        ), '[]'::json) AS services_details,

        COALESCE((
          SELECT json_agg(json_build_object(
            'id', jem.id,
            'name', m.name,
            'quantity', jem.quantity,
            'unit_price', jem.unit_price,
            'total_price', jem.total_price
          ))
          FROM job_executions je
          JOIN job_execution_materials jem ON jem.execution_id = je.id
          JOIN materials m ON m.id = jem.material_id
          WHERE je.assignment_id = i.assignment_id
        ), '[]'::json) AS materials_details

      ${baseQuery}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    const countQuery = `SELECT COUNT(*) ${baseQuery};`;

    const [invoicesResult, countResult] = await Promise.all([
      pool.query(selectQuery, selectParams),
      pool.query(countQuery, countParams)
    ]);

    const totalItems = parseInt(countResult.rows[0].count, 10) || 0;
    const totalPages = Math.ceil(totalItems / parsedLimit);

    return res.status(200).json({
      success: true,
      message: "تم جلب الفواتير بتفاصيلها بنجاح.",
      data: invoicesResult.rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage: parsedPage,
        itemsPerPage: parsedLimit
      }
    });

  } catch (error) {
    console.error('Fetch Invoices Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "حدث خطأ داخلي أثناء جلب الفواتير." 
    });
  }
},










async updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: "حالة الفاتورة غير صالحة." 
    });
  }

  const client = await pool.connect();
    
  try {
    await client.query('BEGIN');

    const updateInvoiceQuery = `
      UPDATE invoices 
      SET status = $1 
      WHERE id = $2 AND status != 'cancelled'
      RETURNING id, invoice_ref, status, assignment_id;
    `;
    const updatedInvoice = await client.query(updateInvoiceQuery, [status, id]);

    if (updatedInvoice.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false, 
        message: "الفاتورة غير موجودة أو ملغاة بالفعل." 
      });
    }

    const assignmentId = updatedInvoice.rows[0].assignment_id;

    if (assignmentId) {
      const updateBookingQuery = `
        UPDATE bookings 
        SET payment_status = $1 
        FROM assignments 
        WHERE bookings.id = assignments.booking_id 
        AND assignments.id = $2;
      `;
      await client.query(updateBookingQuery, [status, assignmentId]);
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "تم إلغاء الفاتورة وتحديث الحجز بنجاح.",
      data: {
        invoice: updatedInvoice.rows[0]
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update Status Error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: "حدث خطأ داخلي أثناء التحديث. تم التراجع عن التغييرات بأمان." 
    });
  } finally {
    // 4. إغلاق الاتصال بأمان تام هنا فقط لمنع مشكلة Double Release
    if (client) {
      client.release();
    }
  }
} ,

async recordInvoicePayment (req, res) {
  const client = await pool.connect();
  const recorded_by = req.user.id; 
  const { id: invoice_id } = req.params;
  const { amount, payment_method, target_safe_id, account_id, notes } = req.body;
  
  const paymentAmount = Number(amount);

  try {
    await client.query('BEGIN');

    // 1. استرجاع بيانات الفاتورة (بدون booking_id لأنه غير موجود بالجدول)
    const invoiceRes = await client.query(`
      SELECT id, invoice_ref, assignment_id, total_amount, status 
      FROM invoices 
      WHERE id = $1 FOR UPDATE
    `, [invoice_id]);

    if (invoiceRes.rows.length === 0) throw new Error("الفاتورة غير موجودة.");
    const invoice = invoiceRes.rows[0];

    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      throw new Error(`لا يمكن تسجيل دفعة لفاتورة حالتها: ${invoice.status}`);
    }

    // 2. التحقق من الدفعات السابقة والمبالغ المتبقية
    const paymentsRes = await client.query(`
      SELECT COALESCE(SUM(amount), 0) as total_paid 
      FROM invoice_payments WHERE invoice_id = $1
    `, [invoice_id]);
    
    const totalPaidSoFar = Number(paymentsRes.rows[0].total_paid);
    const totalAmount = Number(invoice.total_amount);
    const remainingAmount = totalAmount - totalPaidSoFar;

    if (paymentAmount <= 0) throw new Error("يجب إدخال مبلغ صحيح أكبر من الصفر.");
    if (paymentAmount > remainingAmount) {
      throw new Error(`المبلغ المدخل (${paymentAmount}) يتجاوز المتبقي من الفاتورة (${remainingAmount}).`);
    }

    // 3. التحقق من الخزنة وشجرة الحسابات
    const safeRes = await client.query(`SELECT id FROM safes WHERE id = $1 FOR UPDATE`, [target_safe_id]);
    if (safeRes.rows.length === 0) throw new Error("الخزنة المحددة غير موجودة.");

    const accountRes = await client.query(`SELECT id FROM accounts WHERE id = $1`, [account_id]);
    if (accountRes.rows.length === 0) throw new Error("البند المحاسبي غير موجود.");

    // 4. تسجيل الدفعة
    await client.query(`
      INSERT INTO invoice_payments (invoice_id, amount, payment_method, technician_id, safe_id, recorded_by, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      invoice_id, 
      paymentAmount, 
      payment_method, 
      null, 
      target_safe_id, 
      recorded_by, 
      notes || 'تحصيل دفعة مالية لحسابات الشركة مباشرة'
    ]);

    // 5. زيادة رصيد الخزنة
    await client.query(`
      UPDATE safes SET balance = balance + $1 WHERE id = $2
    `, [paymentAmount, target_safe_id]);

    // 6. تسجيل حركة الخزينة وتوجيهها محاسبياً
    await client.query(`
      INSERT INTO treasury_transactions 
      (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
      VALUES ($1, $2, 'IN', $3, 'INVOICE_PAYMENT', $4, $5, $6)
    `, [
      target_safe_id, 
      account_id, 
      paymentAmount, 
      invoice.assignment_id, 
      `تحصيل مباشر - فاتورة رقم ${invoice.invoice_ref}`, 
      recorded_by
    ]);

    // 7. تحديث حالة الفاتورة
    const newTotalPaid = totalPaidSoFar + paymentAmount;
    const newStatus = (totalAmount - newTotalPaid) <= 0.01 ? 'paid' : 'partially_paid';

    await client.query(`UPDATE invoices SET status = $1 WHERE id = $2`, [newStatus, invoice_id]);

    // 8. 🔴 التحديث الدقيق لجدول الحجوزات عبر وسيط المهمة (assignment) بالحروف الصغيرة (Small letters)
    if (invoice.assignment_id) {
      // أ. جلب معرف الحجز من جدول المهام
      const assignmentRes = await client.query(`
        SELECT booking_id FROM assignments WHERE id = $1
      `, [invoice.assignment_id]);

      if (assignmentRes.rows.length > 0) {
        const bookingId = assignmentRes.rows[0].booking_id;
        
        // ب. تحديث حالة الدفع في جدول الحجوزات (paid أو partial)
        const bookingPaymentStatus = newStatus === 'paid' ? 'paid' : 'partial';
        
        await client.query(`
          UPDATE bookings 
          SET payment_status = $1 
          WHERE id = $2
        `, [bookingPaymentStatus, bookingId]);
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ 
      success: true, 
      message: `تم تسجيل الدفعة لحسابات الشركة بنجاح. حالة الفاتورة: ${newStatus === 'paid' ? 'خالصة' : 'مدفوعة جزئياً'}`,
      newStatus
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("RECORD_PAYMENT_ERROR:", error);
    res.status(400).json({ success: false, message: error.message || "حدث خطأ أثناء تسجيل الدفعة" });
  } finally {
    client.release();
  }
}










  
};

module.exports = InvoiceController;