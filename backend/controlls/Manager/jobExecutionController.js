const db = require('../../config/condb');
const socket = require('../../config/socket');

const getAllJobExecutions = async (req, res) => {
  const client = await db.connect();
  
  try {
    const { search, status, start_date, end_date, limit = 30, page = 1 } = req.query;
    
    const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = ["1=1"];
    let values = [];

    
if (search && search.trim() !== "") {
      values.push(`%${search.trim()}%`);
      whereClauses.push(`(
        b.booking_ref ILIKE $${values.length} OR 
        a.assignment_ref ILIKE $${values.length} OR 
        b.contact_name ILIKE $${values.length} OR 
        b.contact_phone ILIKE $${values.length} OR 
        CAST(a.id AS TEXT) ILIKE $${values.length} OR 
        CAST(b.id AS TEXT) ILIKE $${values.length}
      )`);
    }

    if (status && status.trim() !== "") {
      values.push(status.trim());
      whereClauses.push(`je.status = $${values.length}`);
    }

    if (start_date && start_date.trim() !== "") {
      values.push(start_date);
      whereClauses.push(`je.created_at >= $${values.length}::timestamp`);
    }

    if (end_date && end_date.trim() !== "") {
      values.push(`${end_date} 23:59:59`);
      whereClauses.push(`je.created_at <= $${values.length}::timestamp`);
    }

    const masterQuery = `
      WITH filtered_executions AS (
        SELECT 
          je.id AS execution_id, je.started_at, je.completed_at, je.tech_notes, 
          je.collected_amount, je.additional_expenses, je.expenses_reason, 
          je.status AS execution_status,  je.payment_method , je.payment_status , je.created_at AS execution_created_at,
          a.id AS assignment_id, a.status AS assignment_status,
          b.id AS booking_id, b.booking_ref, b.contact_name, b.contact_phone, 
          b.address, b.status AS booking_status,t.supervisor_id ,
            
          COUNT(*) OVER() AS total_count
        FROM job_executions je
        JOIN assignments a ON je.assignment_id = a.id
        JOIN teams t ON a.team_id =  t.id
        JOIN bookings b ON a.booking_id = b.id
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY je.created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      )
      SELECT 
        fe.*,
        (SELECT  COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
            'member_id', jem.member_id, 
            'name', u.full_name, 
            'phone', u.phone
        )), '[]'::json)
         FROM job_execution_members jem
         JOIN team_members tm ON jem.member_id = tm.id
         JOIN users u ON tm.user_id = u.id
         WHERE jem.execution_id = fe.execution_id) AS team_members,

       (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
            'service_id', jes.service_id, 
            'name_ar', s.name_ar, 
            'quantity', jes.quantity,
            'unit_price', jes.unit_price, 
            'total_price', jes.total_price 
        )), '[]'::json)
         FROM job_execution_services jes
         JOIN services s ON jes.service_id = s.id
         WHERE jes.execution_id = fe.execution_id) AS services,

        (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
            'material_id', jem.material_id, 
            'name_ar', m.name, 
            'is_serialized', m.is_serialized,
            'quantity', jem.quantity, 
            'unit_cost', jem.unit_cost, 
            'unit_price', jem.unit_price,
            'total_cost', jem.total_cost,
            'total_price', jem.total_price,
            'serials_used', jem.serials_used
        )), '[]'::json)
         FROM job_execution_materials jem
         JOIN materials m ON jem.material_id = m.id
         WHERE jem.execution_id = fe.execution_id) AS materials,

        (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
            'url', jep.url, 
            'stage', jep.stage, 
            'created_at', jep.created_at
        )), '[]'::json)
         FROM job_execution_photos jep
         WHERE jep.execution_id = fe.execution_id) AS photos

      FROM filtered_executions fe;
    `;

    values.push(limitNum, offset);

    const { rows } = await client.query(masterQuery, values);

    const totalRecords = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    const totalPages = Math.ceil(totalRecords / limitNum);

    const cleanedData = rows.map(row => {
      const { total_count, ...rest } = row;
      return rest;
    });

    res.status(200).json({
      status: 'success',
      data: cleanedData,
      pagination: {
        total: totalRecords,
        page: pageNum,
        limit: limitNum,
        total_pages: totalPages
      }
    });

  } catch (error) {
    console.error("Master Executions Fetch Error:", error);
    res.status(500).json({ status: 'error', message: 'حدث خطأ داخلي أثناء استرجاع بيانات المهام.' });
  } finally {
    client.release();
  }
};








const distributeExecutionCommissions = async (client, execution_id) => {
  try {
    const servicesQuery = await client.query(`
      SELECT jes.service_id, jes.quantity, jes.total_price, s.name_ar AS service_name 
      FROM job_execution_services jes
      JOIN services s ON jes.service_id = s.id
      WHERE jes.execution_id = $1
    `, [execution_id]);

    const executedServices = servicesQuery.rows;
    if (executedServices.length === 0) return; 

    const membersQuery = await client.query(`
      SELECT tm.user_id, u.full_name 
      FROM job_execution_members jem
      JOIN team_members tm ON jem.member_id = tm.id
      JOIN users u ON tm.user_id = u.id
      WHERE jem.execution_id = $1
    `, [execution_id]);

    const executionMembers = membersQuery.rows;
    if (executionMembers.length === 0) return; 

    const teamUserIds = [...new Set(executionMembers.map(m => m.user_id))];

    const profilesQuery = await client.query(`
      SELECT user_id, tier, default_shares 
      FROM technician_profiles 
      WHERE user_id = ANY($1::int[])
    `, [teamUserIds]);

    const missingProfiles = [];
    const teamData = []; 

    teamUserIds.forEach(userId => {
      const profile = profilesQuery.rows.find(p => p.user_id === userId);
      if (!profile) {
        const memberName = executionMembers.find(m => m.user_id === userId)?.full_name;
        missingProfiles.push(memberName || `User ID: ${userId}`);
      } else {
        teamData.push({
          user_id: userId,
          tier: (profile.tier || '').toUpperCase(),
          default_shares: Number(profile.default_shares) || 1
        });
      }
    });

    if (missingProfiles.length > 0) {
      throw new Error(`لا يمكن اعتماد المهمة: الفنيون الآتية أسماؤهم ليس لهم رتبة مالية مسجلة: ${missingProfiles.join('، ')}`);
    }


    const count = teamData.length;
    let finalDistribution = [];

    if (count === 1) {
      finalDistribution.push({ user_id: teamData[0].user_id, ratio: 1.0, applied_shares: teamData[0].default_shares });
    
    } else if (count === 3) {
      const hasLeader = teamData.some(t => t.tier === 'LEAD');
      const hasAssistant = teamData.some(t => t.tier === 'ASSISTANT');
      const hasTrainee = teamData.some(t => t.tier === 'TRAINEE');

      if (hasLeader && hasAssistant && hasTrainee) {
        finalDistribution = teamData.map(t => {
          let pct = 0;
          if (t.tier === 'LEAD') pct = 0.60;
          else if (t.tier === 'ASSISTANT') pct = 0.25;
          else if (t.tier === 'TRAINEE') pct = 0.15;
          return { user_id: t.user_id, ratio: pct, applied_shares: pct * 100 };
        });
      }
    }

    if (finalDistribution.length === 0) {
      
      if (count === 2) {
        const isT1Lead = teamData[0].tier === 'LEAD';
        const isT2Lead = teamData[1].tier === 'LEAD';

        if (isT1Lead && isT2Lead) {
          teamData[0].safe_share = 1;
          teamData[1].safe_share = 1;
        } else if (isT1Lead || isT2Lead) {
          teamData[0].safe_share = isT1Lead ? 2 : 1;
          teamData[1].safe_share = isT2Lead ? 2 : 1;
        } else {
          teamData[0].safe_share = teamData[0].default_shares;
          teamData[1].safe_share = teamData[1].default_shares;
        }
      } else {
        teamData.forEach(t => { t.safe_share = t.default_shares; });
      }

      const totalTeamShares = teamData.reduce((sum, t) => sum + t.safe_share, 0);
      
      if (totalTeamShares === 0) {
        throw new Error(`لا يمكن اعتماد المهمة: إجمالي الحصص للفريق صفر.`);
      }

      finalDistribution = teamData.map(t => ({
        user_id: t.user_id,
        ratio: t.safe_share / totalTeamShares,
        applied_shares: t.safe_share
      }));
    }

 
    const missingCommissions = [];

    for (const service of executedServices) {
      const poolQuery = await client.query(`
        SELECT commission_type, pool_value 
        FROM service_commission_pools 
        WHERE service_id = $1 AND is_active = TRUE
      `, [service.service_id]);

      if (poolQuery.rows.length === 0) {
        missingCommissions.push(service.service_name);
        continue;
      }

      const rule = poolQuery.rows[0];
      let totalPoolAmount = 0;

      // حساب إجمالي وعاء العمولة للخدمة
      if (rule.commission_type === 'FIXED_PER_UNIT') {
        totalPoolAmount = Number(rule.pool_value) * Number(service.quantity);
      } else if (rule.commission_type === 'PERCENTAGE') {
        totalPoolAmount = (Number(service.total_price) * Number(rule.pool_value)) / 100;
      } else if (rule.commission_type === 'FIXED_PER_JOB') {
        totalPoolAmount = Number(rule.pool_value);
      }

      if (totalPoolAmount > 0) {
        for (const dist of finalDistribution) {
          // حساب نصيب الفني بدقة قرشين
          const earnedAmount = Number((totalPoolAmount * dist.ratio).toFixed(2));

          await client.query(`
            INSERT INTO technician_earnings 
            (execution_id, user_id, service_id, total_pool_amount, user_shares, earned_amount, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
          `, [
            execution_id, 
            dist.user_id, 
            service.service_id, 
            totalPoolAmount, 
            dist.applied_shares, 
            earnedAmount
          ]);
        }
      }
    }

    if (missingCommissions.length > 0) {
      throw new Error(`لا يمكن اعتماد المهمة: الخدمات التالية لم يتم تحديد عمولة للفريق لها (يجب تسعيرها من صفحة الخدمات أولاً): ${missingCommissions.join('، ')}`);
    }
    
  } catch (error) {
    throw new Error(error.message);
  }
};



const approveAndCompleteExecution = async (req, res) => {
  const client = await db.connect();
  const created_by = req?.user.id; 
  
  try {
    const { 
      execution_id, 
      account_id,      
      invoice_amount, 
      discount, 
      collected_amount,
      supervisor_id,
      safe_id          
    } = req.body;

    if (!execution_id) throw new Error("معرف المهمة مفقود.");
    if (invoice_amount < 0 || discount < 0 || collected_amount < 0) {
      throw new Error("تنبيه أمني: غير مسموح بقيم مالية سالبة.");
    }
    if (!supervisor_id) throw new Error("تنبيه أمني: معرف المشرف مفقود.");

    await client.query('BEGIN');

    const execQuery = await client.query(`
      SELECT je.*, a.booking_id, a.assignment_ref 
      FROM job_executions je
      JOIN assignments a ON je.assignment_id = a.id
      WHERE je.id = $1 FOR UPDATE
    `, [execution_id]);

    if (execQuery.rows.length === 0) throw new Error("المهمة غير موجودة.");
    const execution = execQuery.rows[0];

    if (execution.status === 'APPROVED') throw new Error("تم اعتماد هذه المهمة مسبقاً.");

    const technician_id = supervisor_id; 

    const materialsQuery = await client.query(`
      SELECT material_id, quantity, unit_cost, unit_price 
      FROM job_execution_materials 
      WHERE execution_id = $1
    `, [execution_id]);

    for (const mat of materialsQuery.rows) {
      const invUpdate = await client.query(`
        UPDATE inventory 
        SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
        WHERE material_id = $2 AND warehouse_name = 'المخزن الرئيسي'
        RETURNING quantity
      `, [mat.quantity, mat.material_id]);

      if (invUpdate.rows.length === 0) {
        throw new Error(`الخامة غير موجودة في المخزن الرئيسي لمعرف: ${mat.material_id}`);
      }
      
      const balance_after = invUpdate.rows[0].quantity;

      await client.query(`
        INSERT INTO inventory_transactions 
        (material_id, transaction_type, source, source_id, quantity, balance_after, unit_cost, created_by, notes)
        VALUES ($1, 'OUT', 'JOB_EXECUTION', $2, $3, $4, $5, $6, $7)
      `, [
        mat.material_id, 
        execution_id, 
        mat.quantity, 
        balance_after, 
        mat.unit_cost, 
        technician_id,       
        `استهلاك خامات للمهمة رقم ${execution.assignment_ref} - تم الاعتماد بواسطة ${req?.user?.name || 'المدير'}`
      ]);
    }

    await client.query(`
      UPDATE material_serials 
      SET status = 'USED' 
      WHERE execution_id = $1 AND status = 'AVAILABLE'
    `, [execution_id]);

    
    let invoice_status = 'unpaid';
    if (collected_amount >= invoice_amount) invoice_status = 'paid';
    else if (collected_amount > 0) invoice_status = 'partially_paid';

    const subtotal = Number(invoice_amount) + Number(discount);

    const currentYear = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const invoice_ref = `INV-${currentYear}${randomDigits}`;

    const invoiceRes = await client.query(`
      INSERT INTO invoices (invoice_ref, assignment_id, subtotal, discount, total_amount, status, issued_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [
      invoice_ref,                
      execution.assignment_id,    
      subtotal,                    
      discount,                    
      invoice_amount,              
      invoice_status,              
      created_by                  
    ]);

    const invoice_id = invoiceRes.rows[0].id;

    if (collected_amount > 0) {
      let target_safe_id = null;
      let revenue_account_id = account_id; 

      if (!revenue_account_id) {
        throw new Error("تنبيه أمني: يجب تحديد البند المحاسبي (account_id) لتسجيل الإيراد.");
      }

      if (execution.payment_method === 'TRANSFER') {
        if (!safe_id) throw new Error("تنبيه أمني: يجب اختيار خزنة/محفظة الشركة (safe_id) في حالة التحويل.");
        target_safe_id = safe_id; 
      } else {
        const safeQuery = await client.query(`
          SELECT id FROM safes WHERE type = 'TECHNICIAN_WALLET' AND user_id = $1
        `, [technician_id]);
        
        if (safeQuery.rows.length === 0) {
          throw new Error("لا توجد خزنة عهدة (TECHNICIAN_WALLET) مسجلة لهذا الفني المشرف في النظام.");
        }
        target_safe_id = safeQuery.rows[0].id;

        await client.query(`
          INSERT INTO collections (execution_id, amount, collected_by, is_remitted)
          VALUES ($1, $2, $3, FALSE)
        `, [execution_id, collected_amount, technician_id]);
      }

      await client.query(`
        UPDATE safes SET balance = balance + $1 WHERE id = $2
      `, [collected_amount, target_safe_id]);

   
      await client.query(`
        INSERT INTO treasury_transactions 
        (safe_id, account_id, transaction_type, amount, reference_type, reference_id, notes, created_by)
        VALUES ($1, $2, 'IN', $3, 'JOB_EXECUTION', $4, $5, $6)
      `, [
        target_safe_id, 
        revenue_account_id, 
        collected_amount, 
        execution.assignment_id, 
        `تحصيل فاتورة صيانة - مهمة رقم ${execution.assignment_ref}`, 
        created_by
      ]);

      await client.query(`
        INSERT INTO invoice_payments 
        (invoice_id, amount, payment_method, technician_id, safe_id, recorded_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        invoice_id, 
        collected_amount, 
        execution.payment_method || 'CASH', 
        (execution.payment_method === 'CASH' ? technician_id : null),
        target_safe_id,
        created_by
      ]);
    }

    if (execution.additional_expenses > 0) {
      await client.query(`
        INSERT INTO expenses (execution_id, amount, reason, created_by)
        VALUES ($1, $2, $3, $4)
      `, [
        execution_id, 
        execution.additional_expenses, 
        execution.expenses_reason, 
        technician_id
      ]);
    }

    await client.query(`UPDATE job_executions SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [execution_id]);
    await client.query(`UPDATE assignments SET status = 'completed' WHERE id = $1`, [execution.assignment_id]);
    
 
    const bookingPaymentStatus = invoice_status === 'paid' ? 'paid' : (invoice_status === 'partially_paid' ? 'partial' : 'unpaid');
    
    await client.query(`
      UPDATE bookings 
      SET status = 'completed', payment_status = $1 
      WHERE id = $2
    `, [bookingPaymentStatus, execution.booking_id]);

    await distributeExecutionCommissions(client, execution_id);

    await client.query('COMMIT'); 

    res.status(200).json({ 
      success: true, 
      message: "تم اعتماد المهمة، وإصدار الفاتورة، وتسجيل المصروفات للمراجعة بنجاح." 
    });

  } catch (error) {
    await client.query('ROLLBACK'); 
    console.error("APPROVE_EXECUTION_ERROR:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message || "حدث خطأ أثناء عملية الاعتماد." 
    });
  } finally {
    client.release();
  }
};






























const rejectExecution = async (req, res) => {
  const client = await db.connect();
  const { id: execution_id } = req.params;
  const { rejection_reason } = req.body; 

  try {
    await client.query('BEGIN');

    const execQuery = await client.query(`
      SELECT je.id, je.status, je.assignment_id, je.tech_notes, a.booking_id, a.team_id, b.booking_ref 
      FROM job_executions je
      JOIN assignments a ON je.assignment_id = a.id
      JOIN bookings b ON a.booking_id = b.id
      WHERE je.id = $1 FOR UPDATE
    `, [execution_id]);

    if (execQuery.rows.length === 0) {
      throw new Error("المهمة غير موجودة.");
    }
    const execution = execQuery.rows[0];

    if (execution.status === 'APPROVED') {
      throw new Error("لا يمكن رفض مهمة تم اعتمادها مسبقاً.");
    }

    if (execution.status === 'REJECTED') {
      throw new Error("هذه المهمة مرفوضة بالفعل.");
    }

    const formattedReason = rejection_reason ? rejection_reason.trim() : 'تعديل مطلوب من الإدارة';
    const updatedNotes = execution.tech_notes 
      ? `${execution.tech_notes} | [سبب الرفض]: ${formattedReason}` 
      : `[سبب الرفض]: ${formattedReason}`;

    await client.query(`
      UPDATE job_executions 
      SET status = 'REJECTED', 
          tech_notes = $1, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [updatedNotes, execution_id]);

    await client.query(`
      UPDATE assignments 
      SET status = 'in_progress'
      WHERE id = $1
    `, [execution.assignment_id]);

    await client.query(`
      UPDATE bookings 
      SET status = 'in_progress', 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [execution.booking_id]);

    await client.query('COMMIT');

    try {
      const io = socket.getIo(); 
      
      io.to(`team-room-${execution.team_id}`).emit('notification:execution_rejected', {
        title: 'مهمة مرفوضة ',
        message: `تم رفض مسودة المهمة رقم (${execution.booking_ref}). يرجى مراجعة الملاحظات وتعديلها.`,
        execution_id: execution.id,
        booking_ref: execution.booking_ref,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.error("Socket emit failed in reject execution:", socketError);
    }

    return res.status(200).json({
      success: true,
      message: "تم رفض المهمة وإعادتها للفني لتعديل البيانات وإعادة الإرسال بنجاح."
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("REJECT_EXECUTION_ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "حدث خطأ أثناء رفض المهمة."
    });
  } finally {
    client.release();
  }
};












module.exports = {
  getAllJobExecutions ,
  approveAndCompleteExecution ,
  rejectExecution 

};