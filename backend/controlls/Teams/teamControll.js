const pool = require('../../config/condb'); 
const socket = require('../../config/socket');
const {cloudinary , uploadToCloudinary} = require("../../utils/uploadCloudniary");

const getSupervisorAssignments = async (req, res) => {
  try {
    const supervisorId =  req.user.id; 

    if(!supervisorId){
        return res.status(400).json({ 
        success: false, 
        message: "يجب ادخال  id  المستخدم " 
      });
    }

    const teamCheck = await pool.query(
      `SELECT is_active FROM teams WHERE supervisor_id = $1 LIMIT 1`, 
      [supervisorId]
    );

    if (teamCheck.rowCount > 0 && teamCheck.rows[0].is_active === false) {
      return res.status(403).json({
        success: false,
        message: "الفريق الخاص بك غير مفعل حالياً، لا يمكنك عرض المهام. يرجى التواصل مع الإدارة."
      });
    }

    const query = `
      SELECT 
        a.id AS assignment_id,
        a.assigned_at,
        a.notes AS assignment_notes,
        a.status AS assignment_status,
        
        json_build_object(
          'id', b.id,
          'booking_ref', b.booking_ref,
          'contact_name', b.contact_name,
          'contact_phone', b.contact_phone,
          'address', b.address,
          'location_url', b.location_url,
          'preferred_date', b.preferred_date,
          'customer_notes', b.notes
        ) AS booking_details,

        json_build_object(
          'team_id', t.id,
          'team_name', t.name,
          'team_type', t.team_type,
          'members', COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'name', u.full_name,
                  'user_id', tm.id
                )
              )
              FROM team_members tm
              INNER JOIN users u  ON u.id = tm.user_id

              WHERE tm.team_id = t.id AND tm.is_active = true
            ), 
            '[]'::json
          )
        ) AS team_details

      FROM assignments a
      INNER JOIN teams t ON a.team_id = t.id
      INNER JOIN bookings b ON a.booking_id = b.id
       
      WHERE t.supervisor_id = $1 
        AND a.status IN ('pending', 'in_progress')
      ORDER BY b.preferred_date ASC, b.preferred_time_from ASC;
    `;

    const result = await pool.query(query, [supervisorId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "لا يوجد مهام قيد التنفيذ أو معلقة لفريقك حالياً.",
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم جلب المهام بنجاح.",
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getSupervisorAssignments:", error.message);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ داخلي أثناء جلب مهام المشرف."
    });
  }
};



const startJobExecution = async (req, res) => {
  const client = await pool.connect();

  try {
     const assignment_id = parseInt(req.params.id, 10);
    if (!assignment_id) {
      throw new Error('رقم المهمة مطلوب.');
    }

    await client.query('BEGIN');

    const assignmentCheck = await client.query(
      `SELECT status FROM assignments WHERE id = $1 FOR UPDATE`, 
      [assignment_id]
    );

    if (assignmentCheck.rows.length === 0) {
      throw new Error('التكليف غير موجود.');
    }

    if (['IN_PROGRESS', 'NEEDS_REVIEW', 'COMPLETED', 'CANCELED'].includes(assignmentCheck.rows[0].status)) {
      throw new Error('لا يمكن بدء هذه المهمة، لأنها قيد التنفيذ أو تم إنهاؤها مسبقاً.');
    }

    const execInsertQuery = `
      INSERT INTO job_executions (assignment_id, started_at, status)
      VALUES ($1, CURRENT_TIMESTAMP, 'IN_PROGRESS')
      RETURNING id
    `;
    const execResult = await client.query(execInsertQuery, [assignment_id]);
    const executionId = execResult.rows[0].id;
     
   


    await client.query(`
      UPDATE assignments 
      SET status = 'in_progress' 
      WHERE id = $1
    `, [assignment_id]);
     
    await client.query(`
      UPDATE bookings 
      SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
      WHERE id = (SELECT booking_id FROM assignments WHERE id = $1)
    `, [assignment_id]);


    await client.query('COMMIT');
    
    res.status(201).json({ 
      status: 'success', 
      message: 'تم بدء المهمة بنجاح، جاري تسجيل الوقت.',
      data: { 
        execution_id: executionId 
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Start Job Error: ", error);
    res.status(400).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};

const revertJobExecution = async (req, res) => {
  const client = await pool.connect();

  try {
    const assignment_id = parseInt(req.params.id, 10);

    if (!assignment_id || isNaN(assignment_id)) {
      throw new Error('رقم المهمة غير صحيح.');
    }

    await client.query('BEGIN');

    const assignmentCheck = await client.query(
      `SELECT status FROM assignments WHERE id = $1 FOR UPDATE`, 
      [assignment_id]
    );

    if (assignmentCheck.rows.length === 0) {
      throw new Error('التكليف غير موجود.');
    }

    if (assignmentCheck.rows[0].status !== 'in_progress') {
      throw new Error('لا يمكن التراجع إلا إذا كانت المهمة قيد التنفيذ.');
    }


    await client.query(`
      DELETE FROM job_executions 
      WHERE assignment_id = $1 AND status = 'IN_PROGRESS'
    `, [assignment_id]);

    await client.query(`
      UPDATE assignments 
      SET status = 'pending'
      WHERE id = $1
    `, [assignment_id]);
   
   await client.query(`
      UPDATE bookings 
      SET status = 'assigned', updated_at = CURRENT_TIMESTAMP 
      WHERE id = (SELECT booking_id FROM assignments WHERE id = $1)
    `, [assignment_id]);


    await client.query('COMMIT');
    
    res.status(200).json({ 
      status: 'success', 
      message: 'تم التراجع عن بدء المهمة بنجاح.'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Revert Job Error: ", error);
    res.status(400).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};

// members
const searchActiveMembers = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ 
        success: false, 
        message: "يرجى إدخال اسم الفني أو رقمه (ID) للبحث." 
      });
    }

    
    const searchQuery = `
      SELECT DISTINCT 
        tm.id AS user_id, 
        u.full_name As name
      FROM users u
      INNER JOIN team_members tm ON u.id = tm.user_id
      WHERE tm.is_active = true
        AND (u.full_name ILIKE $1 OR u.id::TEXT = $2)
      LIMIT 10;
    `;
    
    const nameSearch = `%${keyword}%`;
    const idSearch = keyword.trim(); 

    const result = await pool.query(searchQuery, [nameSearch, idSearch]);

    return res.status(200).json({
      success: true,
      message: "نتائج البحث",
      data: result.rows
    });

  } catch (error) {
    console.error("Error in searchActiveMembers:", error.message);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء البحث عن الفنيين."
    });
  }
};

// services
const getActiveServicesList = async (req, res) => {
  try {

    const query = `
      SELECT id, name_ar  , base_price
      FROM services 
      WHERE is_active = true 
      ORDER BY name_ar ASC;
    `;
    
    const result = await pool.query(query);


    return res.status(200).json({
      success: true,
      message: "تم جلب قائمة الخدمات بنجاح.",
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getActiveServicesList:", error.message);
    
    return res.status(500).json({
      success: false,
      message: "حدث خطأ داخلي أثناء جلب قائمة الخدمات المتاحة."
    });
  }
};



// materails 
const searchMaterialsForExecution = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ status: 'error', message: 'يرجى إدخال حرفين على الأقل للبحث' });
    }

    const searchTerm = `%${q.trim()}%`;

    const query = `
      SELECT 
        m.id, m.sku, m.name, m.is_serialized, m.current_price, m.unit,
        COALESCE(inv.total_quantity, 0) AS available_stock,
        COALESCE(
          json_agg(json_build_object('id', s.id, 'serial', s.serial_number)) 
          FILTER (WHERE s.id IS NOT NULL), '[]'::json
        ) AS available_serials
      FROM materials m
      LEFT JOIN (
        SELECT material_id, SUM(quantity) AS total_quantity 
        FROM inventory GROUP BY material_id
      ) inv ON m.id = inv.material_id
      LEFT JOIN material_serials s ON m.id = s.material_id AND s.status = 'AVAILABLE'
      WHERE (m.name ILIKE $1 OR m.sku ILIKE $1) AND m.is_active = TRUE
      GROUP BY m.id, m.sku, m.name, m.is_serialized, m.current_price, m.unit, inv.total_quantity
      HAVING COALESCE(inv.total_quantity, 0) > 0 
      LIMIT 15;
    `;

    const { rows } = await pool.query(query, [searchTerm]);
    
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error("Error searching materials:", error);
    res.status(500).json({ status: 'error', message: 'خطأ في البحث عن الخامات' });
  }
};

const submitJobExecution = async (req, res) => {
  const client = await pool.connect();
  let uploadedImagesIds = []; 

  try {
    const assignment_id = parseInt(req.body.assignment_id, 10);
    const tech_notes = req.body.tech_notes || null;
    const collected_amount = parseFloat(req.body.collected_amount) || 0;
    const additional_expenses = parseFloat(req.body.additional_expenses) || 0;
    const expenses_reason = req.body.expenses_reason || null;
    
    const payment_method = req.body.payment_method || 'NONE'; 
    
    const started_at = req.body.started_at ? new Date(req.body.started_at) : new Date();
    const completed_at = req.body.completed_at ? new Date(req.body.completed_at) : new Date();

    const members = req.body.members ? JSON.parse(req.body.members) : [];
    const services = req.body.services ? JSON.parse(req.body.services) : [];
    const materials = req.body.materials ? JSON.parse(req.body.materials) : [];
    const photoStages = req.body.photo_stages ? JSON.parse(req.body.photo_stages) : []; 

    if (!assignment_id || isNaN(assignment_id)) {
      throw new Error('رقم المهمة (Assignment ID) غير صحيح أو مفقود.');
    }
    if (members.length === 0) {
      throw new Error('يجب تحديد فني واحد على الأقل.');
    }
    if (additional_expenses > 0 && (!expenses_reason || expenses_reason.trim() === '')) {
      throw new Error('يجب كتابة تفاصيل المشتريات الخارجية (سبب المصروف).');
    }
    if (!['CASH', 'TRANSFER', 'NONE'].includes(payment_method)) {
      throw new Error('طريقة الدفع المرسلة غير صالحة.');
    }

    let payment_status = 'UNPAID'; 

    if (payment_method === 'CASH') {
      payment_status = 'PAID'; 
      if (collected_amount <= 0) {
        throw new Error('يجب إدخال المبلغ المحصل نقداً في حالة الدفع كاش.');
      }
    } else if (payment_method === 'TRANSFER') {
      payment_status = 'PENDING';
    } else {
      payment_status = 'UNPAID';
    }

    await client.query('BEGIN');

    // 🔴 تم تعديل الاستعلام لجلب رقم الحجز (booking_ref) ليُستخدم في الإشعار
    const assignmentCheck = await client.query(
      `SELECT a.status, b.booking_ref 
       FROM assignments a 
       JOIN bookings b ON a.booking_id = b.id 
       WHERE a.id = $1 FOR UPDATE`, 
      [assignment_id]
    );

    if (assignmentCheck.rows.length === 0) {
      throw new Error('التكليف غير موجود في النظام.');
    }
    if (['COMPLETED', 'CANCELED'].includes(assignmentCheck.rows[0].status)) {
      throw new Error('لا يمكن إقفال مهمة تم إنهاؤها أو إلغاؤها مسبقاً.');
    }

    const bookingRef = assignmentCheck.rows[0].booking_ref;

    const execUpdateQuery = `
      UPDATE job_executions 
      SET 
        completed_at = $1, 
        tech_notes = $2, 
        collected_amount = $3, 
        additional_expenses = $4, 
        expenses_reason = $5,
        payment_method = $6,
        payment_status = $7,
        status = 'NEEDS_REVIEW'
      WHERE assignment_id = $8 AND status = 'IN_PROGRESS'
      RETURNING id
    `;

    const execResult = await client.query(execUpdateQuery, [
      completed_at,         
      tech_notes,           
      collected_amount,    
      additional_expenses,  
      expenses_reason,      
      payment_method,       
      payment_status,       
      assignment_id        
    ]);

    if (execResult.rows.length === 0) {
        throw new Error('المهمة ليست في حالة قيد التنفيذ أو غير موجودة.');
    }

    const executionId = execResult.rows[0].id;

    for (const memberId of members) {
      await client.query(
        `INSERT INTO job_execution_members (execution_id, member_id) VALUES ($1, $2)`,
        [executionId, memberId]
      );
    }

    for (const srv of services) {
      if (!srv.service_id || !srv.quantity || srv.quantity <= 0) continue;

      const srvCheck = await client.query(`
        SELECT id, base_price 
        FROM services 
        WHERE id = $1 AND is_active = true
      `, [srv.service_id]);
      
      if (srvCheck.rows.length === 0) {
        throw new Error(`الخدمة رقم ${srv.service_id} غير موجودة أو غير مفعلة.`);
      }

      const frozen_unit_price = srvCheck.rows[0].base_price;

      await client.query(
        `INSERT INTO job_execution_services 
        (execution_id, service_id, quantity, unit_price) 
        VALUES ($1, $2, $3, $4)`,
        [
          executionId, 
          srv.service_id, 
          srv.quantity, 
          frozen_unit_price 
        ]
      );
    }

    for (const mat of materials) {
      if (!mat.material_id || !mat.quantity || mat.quantity <= 0) continue;

      const matDb = await client.query(
        `SELECT current_cost, current_price, is_serialized FROM materials WHERE id = $1 AND is_active = true`,
        [mat.material_id]
      );
      
      if (matDb.rows.length === 0) {
        throw new Error(`الخامة ${mat.material_id} غير موجودة أو غير مفعلة.`);
      }
      
      const { current_cost, current_price, is_serialized } = matDb.rows[0];

      let serialsToSave = [];
      if (is_serialized) {
        for (const serialNum of mat.serials) {
          const serialCheck = await client.query(
            `SELECT id FROM material_serials WHERE material_id = $1 AND serial_number = $2 AND status = 'AVAILABLE'`, 
            [mat.material_id, serialNum]
          );
          if (serialCheck.rows.length === 0) {
            throw new Error(`السيريال ${serialNum} غير متاح في المخزن للخامة ${mat.material_id}. يرجى مراجعة الأرقام.`);
          }
        }
        serialsToSave = mat.serials;
      }

      await client.query(`
        INSERT INTO job_execution_materials (
          execution_id, material_id, quantity, unit_cost, unit_price, serials_used
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        executionId, 
        mat.material_id, 
        mat.quantity, 
        current_cost, 
        current_price, 
        JSON.stringify(serialsToSave)
      ]);
      
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, "job_executions", "image"));
      const uploadResults = await Promise.all(uploadPromises);

      for (let i = 0; i < uploadResults.length; i++) {
        const result = uploadResults[i];
        const stage = photoStages[i] || 'DURING'; 

        uploadedImagesIds.push(result.public_id);

        await client.query(`
          INSERT INTO job_execution_photos (execution_id, url, stage)
          VALUES ($1, $2, $3)
        `, [executionId, result.secure_url, stage]);
      }
    }

    await client.query(`
      UPDATE assignments SET status = 'NEEDS_REVIEW' WHERE id = $1
    `, [assignment_id]);


    const notificationTitle = `مراجعة مطلوبة للمهمة #${bookingRef}`;
    const notificationMessage = `قام الفريق بإنهاء مهمة مرتبطة بالحجز رقم (${bookingRef}) وتنتظر المراجعة والاعتماد.`;
    
    const notificationResult = await client.query(
      `INSERT INTO notifications (title, message, type, is_read) 
       VALUES ($1, $2, 'execution_review', false) 
       RETURNING *`,
      [notificationTitle, notificationMessage]
    );

    await client.query('COMMIT');
    
    try {
      const io = socket.getIo(); 
      io.to('manager-room').emit('notification:needs_review', {
        title: notificationTitle,
        message: notificationMessage,
        booking_ref: bookingRef,
        execution_id: executionId,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.error("Socket emit failed in submitJobExecution:", socketError);
    }

    res.status(201).json({ 
      status: 'success', 
      message: 'تم إنهاء المهمة وإرسالها للمراجعة بنجاح.',
      data: { executionId }
    });

  } catch (error) {
    await client.query('ROLLBACK');

    if (uploadedImagesIds.length > 0) {
      uploadedImagesIds.forEach(id => {
        cloudinary.uploader.destroy(id).catch(err => console.error("Cloudinary Cleanup Error:", err));
      });
    }

    console.error("Submit Job Execution Error: ", error);
    res.status(400).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};



// ------- rejected ----- 

const getSupervisorRejectedExecutions = async (req, res) => {
  try {
    const supervisorId = req.user.id; 

    if (!supervisorId) {
      return res.status(400).json({ 
        success: false, 
        message: "يجب ادخال id المستخدم" 
      });
    }

    // 1. التحقق من حالة فريق المشرف
    const teamCheck = await pool.query(
      `SELECT is_active FROM teams WHERE supervisor_id = $1 LIMIT 1`, 
      [supervisorId]
    );

    if (teamCheck.rowCount > 0 && teamCheck.rows[0].is_active === false) {
      return res.status(403).json({
        success: false,
        message: "الفريق الخاص بك غير مفعل حالياً، لا يمكنك عرض المهام. يرجى التواصل مع الإدارة."
      });
    }

    // 2. جلب المهام المرفوضة بكل تفاصيلها باستخدام JSON_AGG لتجميع القوائم
    const query = `
      SELECT 
        -- بيانات التنفيذ المرفوض (المسودة)
        je.id AS execution_id,
        je.status AS execution_status,
        je.tech_notes, -- سيحتوي على سبب الرفض
        je.collected_amount,
        je.payment_method,
        je.additional_expenses,
        je.expenses_reason,
        je.started_at,
        je.completed_at,
        
        -- بيانات التكليف
        a.id AS assignment_id,
        a.status AS assignment_status,
        
        -- تفاصيل الحجز
        json_build_object(
          'id', b.id,
          'booking_ref', b.booking_ref,
          'contact_name', b.contact_name,
          'contact_phone', b.contact_phone,
          'address', b.address,
          'location_url', b.location_url,
          'preferred_date', b.preferred_date,
          'customer_notes', b.notes
        ) AS booking_details,

        -- أعضاء الفريق المنفذين فعلياً في المسودة
        COALESCE((
          SELECT json_agg(json_build_object(
            'member_id', jem.member_id, 
            'name', u.full_name, 
            'phone', u.phone
          ))
          FROM job_execution_members jem
          JOIN team_members tm ON jem.member_id = tm.id
          JOIN users u ON tm.user_id = u.id
          WHERE jem.execution_id = je.id
        ), '[]'::json) AS execution_members,

        -- الخدمات المسجلة في المسودة
        COALESCE((
          SELECT json_agg(json_build_object(
            'service_id', jes.service_id, 
            'name_ar', s.name_ar, 
            'quantity', jes.quantity,
            'unit_price', jes.unit_price, 
            'total_price', jes.total_price 
          ))
          FROM job_execution_services jes
          JOIN services s ON jes.service_id = s.id
          WHERE jes.execution_id = je.id
        ), '[]'::json) AS services,

        -- الخامات المسجلة في المسودة
        COALESCE((
          SELECT json_agg(json_build_object(
            'material_id', jem.material_id, 
            'name_ar', m.name, 
            'quantity', jem.quantity, 
            'unit_cost', jem.unit_cost, 
            'unit_price', jem.unit_price,
            'total_cost', jem.total_cost,
            'total_price', jem.total_price
          ))
          FROM job_execution_materials jem
          JOIN materials m ON jem.material_id = m.id
          WHERE jem.execution_id = je.id
        ), '[]'::json) AS materials,

        -- الصور المرفوعة
        COALESCE((
          SELECT json_agg(json_build_object(
            'url', jep.url, 
            'stage', jep.stage, 
            'created_at', jep.created_at
          ))
          FROM job_execution_photos jep
          WHERE jep.execution_id = je.id
        ), '[]'::json) AS photos

      FROM job_executions je
      INNER JOIN assignments a ON je.assignment_id = a.id
      INNER JOIN teams t ON a.team_id = t.id
      INNER JOIN bookings b ON a.booking_id = b.id
       
      WHERE t.supervisor_id = $1 
        AND je.status = 'REJECTED' -- 🔴 جلب المرفوض فقط
      ORDER BY je.updated_at DESC; -- الأحدث أولاً
    `;

    const result = await pool.query(query, [supervisorId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "لا توجد أي مهام مرفوضة تتطلب التعديل حالياً.",
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم جلب المهام المرفوضة بنجاح.",
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error in getSupervisorRejectedExecutions:", error.message);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ داخلي أثناء جلب المهام المرفوضة للمشرف."
    });
  }
};




const updateRejectedExecution = async (req, res) => {
  const client = await pool.connect();
  let uploadedImagesIds = []; 

  try {
    // 1. استقبال الـ ID من الـ params أو الـ body
    const execution_id = req.params.id || req.body.execution_id;
    
    if (!execution_id) {
      throw new Error('رقم سجل التنفيذ (Execution ID) غير صحيح أو مفقود.');
    }

    // 2. استقبال البيانات الأساسية
    const tech_notes = req.body.tech_notes || null;
    const collected_amount = parseFloat(req.body.collected_amount) || 0;
    const additional_expenses = parseFloat(req.body.additional_expenses) || 0;
    const expenses_reason = req.body.expenses_reason || null;
    const payment_method = req.body.payment_method || 'NONE'; 
    
    // الأوقات (نحافظ عليها أو نحدث وقت الانتهاء فقط)
    const started_at = req.body.started_at ? new Date(req.body.started_at) : new Date();
    const completed_at = req.body.completed_at ? new Date(req.body.completed_at) : new Date();

    // القوائم المرسلة (Arrays)
    const members = req.body.team_members ? JSON.parse(req.body.team_members) : [];
    const services = req.body.services ? JSON.parse(req.body.services) : [];
    const materials = req.body.materials ? JSON.parse(req.body.materials) : [];
    
    // الصور
    const retainedPhotos = req.body.retained_photos ? JSON.parse(req.body.retained_photos) : []; // الصور القديمة المحتفظ بها
    const newPhotoStages = req.body.new_photo_stages ? JSON.parse(req.body.new_photo_stages) : []; // مراحل الصور الجديدة

    // 3. التحقق الأمني
    if (members.length === 0) {
      throw new Error('يجب تحديد فني واحد على الأقل.');
    }
    if (additional_expenses > 0 && (!expenses_reason || expenses_reason.trim() === '')) {
      throw new Error('يجب كتابة تفاصيل المشتريات الخارجية (سبب المصروف).');
    }
    if (!['CASH', 'TRANSFER', 'NONE'].includes(payment_method)) {
      throw new Error('طريقة الدفع المرسلة غير صالحة.');
    }

    let payment_status = 'UNPAID'; 
    if (payment_method === 'CASH') {
      payment_status = 'PAID'; 
      if (collected_amount <= 0) {
        throw new Error('يجب إدخال المبلغ المحصل نقداً في حالة الدفع كاش.');
      }
    } else if (payment_method === 'TRANSFER') {
      payment_status = 'PENDING';
    } else {
      payment_status = 'UNPAID';
    }

    await client.query('BEGIN');

    const execCheck = await client.query(
      `SELECT je.assignment_id, je.status, b.booking_ref 
       FROM job_executions je
       JOIN assignments a ON je.assignment_id = a.id
       JOIN bookings b ON a.booking_id = b.id
       WHERE je.id = $1 FOR UPDATE`, 
      [execution_id]
    );
    
    if (execCheck.rows.length === 0) {
      throw new Error('سجل التنفيذ غير موجود.');
    }
    if (execCheck.rows[0].status !== 'REJECTED') {
      throw new Error('لا يمكن تعديل مهمة ليست في حالة الرفض (REJECTED).');
    }

    const assignment_id = execCheck.rows[0].assignment_id;
    const bookingRef = execCheck.rows[0].booking_ref;

    // 5. تحديث البيانات الأساسية في جدول job_executions
    const execUpdateQuery = `
      UPDATE job_executions 
      SET 
        started_at = $1,
        completed_at = $2, 
        tech_notes = $3, 
        collected_amount = $4, 
        additional_expenses = $5, 
        expenses_reason = $6,
        payment_method = $7,
        payment_status = $8,
        status = 'NEEDS_REVIEW',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
    `;

    await client.query(execUpdateQuery, [
      started_at,         
      completed_at,         
      tech_notes,           
      collected_amount,    
      additional_expenses,  
      expenses_reason,      
      payment_method,       
      payment_status,       
      execution_id        
    ]);


    await client.query(`DELETE FROM job_execution_members WHERE execution_id = $1`, [execution_id]);
    for (const memberId of members) {
      await client.query(
        `INSERT INTO job_execution_members (execution_id, member_id) VALUES ($1, $2)`,
        [execution_id, memberId]
      );
    }

  
    await client.query(`DELETE FROM job_execution_services WHERE execution_id = $1`, [execution_id]);
    for (const srv of services) {
      if (!srv.service_id || !srv.quantity || srv.quantity <= 0) continue;

      const srvCheck = await client.query(`
        SELECT base_price FROM services WHERE id = $1 AND is_active = true
      `, [srv.service_id]);
      
      const final_unit_price = srvCheck.rows.length > 0 ? srvCheck.rows[0].base_price : srv.unit_price;

      await client.query(
        `INSERT INTO job_execution_services (execution_id, service_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [execution_id, srv.service_id, srv.quantity, final_unit_price]
      );
    }

   
    await client.query(`DELETE FROM job_execution_materials WHERE execution_id = $1`, [execution_id]);
    for (const mat of materials) {
      if (!mat.material_id || !mat.quantity || mat.quantity <= 0) continue;

      const matDb = await client.query(
        `SELECT current_cost, current_price, is_serialized FROM materials WHERE id = $1 AND is_active = true`,
        [mat.material_id]
      );
      
      const current_cost = matDb.rows.length > 0 ? matDb.rows[0].current_cost : mat.unit_cost;
      const current_price = matDb.rows.length > 0 ? matDb.rows[0].current_price : mat.unit_price;
      const is_serialized = matDb.rows.length > 0 ? matDb.rows[0].is_serialized : (mat.serials && mat.serials.length > 0);

      let serialsToSave = [];
      if (is_serialized && mat.serials) {
        for (const serialNum of mat.serials) {
          const serialCheck = await client.query(
            `SELECT id FROM material_serials WHERE material_id = $1 AND serial_number = $2 AND status = 'AVAILABLE'`, 
            [mat.material_id, serialNum]
          );
          if (serialCheck.rows.length === 0) {
            throw new Error(`السيريال ${serialNum} غير متاح في المخزن للخامة. يرجى مراجعة الأرقام.`);
          }
        }
        serialsToSave = mat.serials;
      }

      await client.query(`
        INSERT INTO job_execution_materials (execution_id, material_id, quantity, unit_cost, unit_price, serials_used)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [execution_id, mat.material_id, mat.quantity, current_cost, current_price, JSON.stringify(serialsToSave)]);
    }

    await client.query(`DELETE FROM job_execution_photos WHERE execution_id = $1`, [execution_id]);
    
    for (const photo of retainedPhotos) {
      if(photo.url && photo.stage) {
        await client.query(`
          INSERT INTO job_execution_photos (execution_id, url, stage) VALUES ($1, $2, $3)
        `, [execution_id, photo.url, photo.stage]);
      }
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, "job_executions", "image"));
      const uploadResults = await Promise.all(uploadPromises);

      for (let i = 0; i < uploadResults.length; i++) {
        const result = uploadResults[i];
        const stage = newPhotoStages[i] || 'DURING'; 

        uploadedImagesIds.push(result.public_id);

        await client.query(`
          INSERT INTO job_execution_photos (execution_id, url, stage) VALUES ($1, $2, $3)
        `, [execution_id, result.secure_url, stage]);
      }
    }


    await client.query(`UPDATE assignments SET status = 'NEEDS_REVIEW' WHERE id = $1`, [assignment_id]);
    await client.query(`UPDATE bookings SET status = 'in_progress' WHERE id = (SELECT booking_id FROM assignments WHERE id = $1)`, [assignment_id]);

    const notificationTitle = `إعادة مراجعة للمهمة #${bookingRef}`;
    const notificationMessage = `قام الفريق بتعديل وإعادة إرسال المهمة المرفوضة للحجز رقم (${bookingRef}). يرجى المراجعة.`;
    
    await client.query(
      `INSERT INTO notifications (title, message, type, is_read) 
       VALUES ($1, $2, 'execution_review', false) 
       RETURNING *`,
      [notificationTitle, notificationMessage]
    );

    await client.query('COMMIT');
    
    try {
      const io = socket.getIo(); 
      io.to('manager-room').emit('notification:needs_review', {
        title: notificationTitle,
        message: notificationMessage,
        booking_ref: bookingRef,
        execution_id: execution_id,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.error("Socket emit failed in updateRejectedExecution:", socketError);
    }
    
    res.status(200).json({ 
      status: 'success', 
      message: 'تم تعديل المهمة وإرسالها للمراجعة بنجاح.',
      data: { execution_id }
    });

  } catch (error) {
    await client.query('ROLLBACK');

    if (uploadedImagesIds.length > 0) {
      uploadedImagesIds.forEach(id => {
        cloudinary.uploader.destroy(id).catch(err => console.error("Cloudinary Cleanup Error:", err));
      });
    }

    console.error("Update Rejected Execution Error: ", error);
    res.status(400).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};







module.exports = {
  getSupervisorAssignments ,
  searchActiveMembers,
  getActiveServicesList ,
  searchMaterialsForExecution ,
  submitJobExecution ,
  startJobExecution ,
   revertJobExecution  ,

   // rejected 
     getSupervisorRejectedExecutions,
  updateRejectedExecution

};