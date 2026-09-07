const db = require('../../config/condb'); 
const socket = require('../../config/socket');
const crypto = require('crypto'); 

const generateAssignmentRef = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase(); 
    return `ASN-${dateStr}-${randomPart}`;
};

const assignmentController = {



async create(req, res) {
    const client = await db.connect();

    try {
        const { booking_id, team_id, notes } = req.body;

        const parsedBookingId = parseInt(booking_id, 10);
        const parsedTeamId = parseInt(team_id, 10);

        if (!parsedBookingId || isNaN(parsedBookingId) || parsedBookingId <= 0 ||
            !parsedTeamId || isNaN(parsedTeamId) || parsedTeamId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid Booking ID and Team ID are required.",
            });
        }

        const sanitizedNotes = typeof notes === "string" ? notes.trim() : null;

        await client.query("BEGIN");

        const teamResult = await client.query(
            `
            SELECT id, is_active
            FROM teams
            WHERE id = $1
            LIMIT 1
            `,
            [parsedTeamId]
        );

        if (teamResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Team not found.",
            });
        }

        const team = teamResult.rows[0];

        if (!team.is_active) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Cannot assign an inactive team. Please select an active team.",
            });
        }

        const bookingResult = await client.query(
            `
            SELECT id, status, booking_ref
            FROM bookings
            WHERE id = $1
            FOR UPDATE
            `,
            [parsedBookingId]
        );

        if (bookingResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Booking not found.",
            });
        }

        const booking = bookingResult.rows[0];

        const invalidStatuses = ["cancelled", "rejected", "completed"];
        if (invalidStatuses.includes(booking.status)) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: `Cannot assign booking with current status: '${booking.status}'.`,
            });
        }

        const assignmentResult = await client.query(
            `
            SELECT 1
            FROM assignments
            WHERE booking_id = $1 
            AND status != 'cancelled' 
            LIMIT 1
            `,
            [parsedBookingId]
        );

        if (assignmentResult.rowCount > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "Booking already has an active assignment.",
            });
        }

       
        let isAssignedInserted = false;
        let newAssignmentRow = null;
        let assignment_ref = generateAssignmentRef();

        while (!isAssignedInserted) {
            await client.query("SAVEPOINT assignment_insert_point");

            try {
                const newAssignment = await client.query(
                    `
                    INSERT INTO assignments
                    (
                        assignment_ref, 
                        booking_id,
                        team_id,
                        notes,
                        status,
                        assigned_at 
                    )
                    VALUES
                    (
                        $1, $2, $3, $4, 'pending', NOW()
                    )
                    RETURNING *
                    `,
                    [
                        assignment_ref,
                        parsedBookingId,
                        parsedTeamId,
                        sanitizedNotes,
                    ]
                );
                
                newAssignmentRow = newAssignment.rows[0];
                isAssignedInserted = true;
            } catch (err) {
                if (err.code === '23505' && err.constraint === 'assignments_assignment_ref_key') {
                    await client.query("ROLLBACK TO SAVEPOINT assignment_insert_point");
                    assignment_ref = generateAssignmentRef();
                } else {
                    throw err;
                }
            }
        }

        await client.query(
            `
            UPDATE bookings
            SET status = 'assigned', updated_at = NOW()
            WHERE id = $1
            `,
            [parsedBookingId]
        );

        await client.query("COMMIT");

        try {
           const io = socket.getIo();
            
            io.to(`team-room-${parsedTeamId}`).emit('notification:new_assignment', {
                title: 'تكليف مهمة جديدة ',
                message: `تم تكليفك بمهمة ميدانية جديدة رقم (${booking.booking_ref}). يرجى مراجعة التطبيق.`,
                assignment_id: newAssignmentRow.id,
                assignment_ref: newAssignmentRow.assignment_ref, 
                booking_ref: booking.booking_ref,
                timestamp: new Date()
            });
        } catch (socketError) {
            console.error("Socket emit failed in create assignment:", socketError);
        }

        return res.status(201).json({
            success: true,
            message: "Assignment created successfully.",
            data: newAssignmentRow, 
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error creating assignment:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });

    } finally {
        if (client) {
            client.release();
        }
    }
},

async getAll(req, res) {
    try {
        const { search, status, start_date, end_date, limit = 10, page = 1 } = req.query;

        const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const offset = (parsedPage - 1) * parsedLimit;
   

const allowedStatuses = [
    'pending', 
    'in_progress', 
    'completion_pending', 
    'completed', 
    'cancelled', 
    'NEEDS_REVIEW' ,
    'all'
];

if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ 
        success: false, 
        message: "حالة المهمة غير صالحة، يرجى تقديم حالة صحيحة." 
    });
}


        let queryText = `
            SELECT 
                a.id AS assignment_id,
                a.assigned_at,
                a.assignment_ref , 
                a.status AS assignment_status,
                a.cancel_reason ,
                b.id AS booking_id,
                b.booking_ref,
                b.contact_name,
                b.address,
                b.preferred_date,
                t.id AS team_id,
                t.name AS team_name,
                t.supervisor_id,
                CASE WHEN i.assignment_id IS NOT NULL THEN true ELSE false END AS is_anvoiced,
                COUNT(*) OVER() AS total_count
            FROM assignments a
            JOIN bookings b ON a.booking_id = b.id
            JOIN teams t ON a.team_id = t.id
            LEFT JOIN invoices i ON i.assignment_id = a.id
            WHERE 1=1
        `;
        
        const values = [];
        let counter = 1;

        // 1. فلتر البحث النصي (مؤمن بالكامل ضد حقن البيانات)
   if (search && typeof search === "string" && search.trim() !== "") {
            queryText += ` AND (
                t.name ILIKE $${counter} OR 
                a.assignment_ref ILIKE $${counter} OR 
                b.contact_name ILIKE $${counter} OR 
                b.booking_ref ILIKE $${counter} OR 
                CAST(b.id AS TEXT) ILIKE $${counter} OR 
                CAST(a.id AS TEXT) ILIKE $${counter}
            )`;
            values.push(`%${search.trim()}%`);
            counter++;
        }

        // 2. فلتر الحالة مع التحقق الصارم من القيم المسموحة فقط
        if (status && typeof status === "string" && status.trim() !== "" && status !== "all") {
            const validStatuses = ['pending',  'in_progress', 'completion_pending', 'completed' ,'NEEDS_REVIEW', 'cancelled'];
            if (validStatuses.includes(status.trim())) {
                queryText += ` AND a.status = $${counter}`;
                values.push(status.trim());
                counter++;
            }
        }

        // 3. فلتر التواريخ (مع معالجة الفارق الزمني لتوقيت مصر بدقة)
        if (start_date && end_date && typeof start_date === "string" && typeof end_date === "string") {
            queryText += ` AND DATE(a.assigned_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Cairo') BETWEEN $${counter} AND $${counter + 1}`;
            values.push(start_date.trim(), end_date.trim());
            counter += 2;
        }

        queryText += `
            ORDER BY a.assigned_at DESC
            LIMIT $${counter}
            OFFSET $${counter + 1}
        `;

        values.push(parsedLimit, offset);
        const result = await db.query(queryText, values);

        // حساب بيانات الـ Pagination بأمان
        const totalRecords = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
        const totalPages = Math.ceil(totalRecords / parsedLimit);

        const data = result.rows.map(row => {
            const { total_count, ...rest } = row;
            return rest;
        });

        return res.status(200).json({
            success: true,
            page: parsedPage,
            limit: parsedLimit,
            total: totalRecords,
            total_pages: totalPages,
            data: data
        });

    } catch (error) {
        console.error("Error in Manager assignment getAll:", error);
        return res.status(500).json({
            success: false,
            message: "فشل في جلب البيانات، يرجى المحاولة لاحقاً."
        });
    }
} ,

async getById(req, res) {
        try {
            const { id } = req.params;
            if (isNaN(Number(id))) {
                return res.status(400).json({ success: false, message: 'رقم التعريف (ID) غير صالح.' });
            }
            
            const queryText = `SELECT * FROM assignments WHERE id = $1`;
            const result = await db.query(queryText, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'لم يتم العثور على هذا التعيين.' });
            }

            return res.status(200).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error("Error in assignment getById:", error);
            return res.status(500).json({ success: false, message: "حدث خطأ في الخادم أثناء جلب البيانات." });
        }
 },



async cancelAssignment(req, res) {
    const { id, cancel_reason, cancel_booking } = req.body;

    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: "رقم التكليف مطلوب." 
        });
    }

    if (!cancel_reason || typeof cancel_reason !== 'string' || cancel_reason.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "يجب كتابة سبب الإلغاء بوضوح لأغراض الرقابة."
        });
    }

    const client = await db.connect();
    
    try {
        await client.query('BEGIN');

        const checkAssignmentQuery = `SELECT status, booking_id FROM assignments WHERE id = $1 FOR UPDATE`;
        const checkResult = await client.query(checkAssignmentQuery, [id]);

        if (checkResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "التكليف غير موجود." });
        }

        const assignment = checkResult.rows[0];

        // 4. طبقات الحماية المنطقية (Business Logic Security)
        if (assignment.status === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: "هذا التكليف ملغي بالفعل." });
        }

        if (assignment.status === 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: "لا يمكن إلغاء تكليف تم اكتماله بالفعل." });
        }

        const invoiceCheckQuery = `SELECT id FROM invoices WHERE assignment_id = $1 AND status != 'cancelled' LIMIT 1`;
        const invoiceCheck = await client.query(invoiceCheckQuery, [id]);

        if (invoiceCheck.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                success: false, 
                message: "عملية مرفوضة: يوجد فاتورة نشطة مرتبطة بهذا التكليف. الرجاء إلغاء الفاتورة أولاً." 
            });
        }

        // 6. تنفيذ الإلغاء بأمان تام
        const updateAssignmentQuery = `
            UPDATE assignments 
            SET status = 'cancelled', 
                cancel_reason = $1 
            WHERE id = $2 
            RETURNING *
        `;
        const assignmentResult = await client.query(updateAssignmentQuery, [cancel_reason.trim(), id]);

        if (assignment.booking_id) {
            const newBookingStatus = cancel_booking === true ? 'cancelled' : 'confirmed';
            
            await client.query(
                `UPDATE bookings SET status = $1 WHERE id = $2`,
                [newBookingStatus, assignment.booking_id]
            );
        }

        await client.query('COMMIT');
        
        return res.status(200).json({
            success: true,
            message: "تم إلغاء التكليف بنجاح وحفظ السبب.",
            data: assignmentResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Critical Error during assignment cancellation:", err);
        return res.status(500).json({ success: false, message: "حدث خطأ داخلي في الخادم أثناء محاولة الإلغاء." });
    } finally {
        if (client) {
            client.release();
        }
    }
} ,




// assignments members ---------------

 async getMembersAssignments   (req, res)  {
    try {
        const { bookingRef } = req.params; 
        
          console.log("booking-ref : " , bookingRef)
        if (!bookingRef || typeof bookingRef !== 'string' || bookingRef.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: "يرجى توفير رقم الحجز (Booking Reference) صحيح." 
            });
        }

        const queryText = `
            SELECT 
                am.id AS assignment_member_id,
                u.id AS user_id,
                u.full_name AS worker_name,
                u.phone, 
                am.created_at
            FROM bookings b
            INNER JOIN assignments a ON a.booking_id = b.id
            INNER JOIN assignment_members am ON am.assignment_id = a.id
            INNER JOIN users u ON am.user_id = u.id
            WHERE b.booking_ref = $1;
        `;

        const result = await db.query(queryText, [bookingRef.trim()]);

        return res.status(200).json({
            success: true,
            message: "تم جلب فريق العمل بنجاح",
            count: result.rowCount,
            data: result.rows
        });

    } catch (error) {
        console.error("Error in getMembersByBookingRef:", error);
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي أثناء جلب بيانات العمال." 
        });
    }
} 







};

module.exports = assignmentController;