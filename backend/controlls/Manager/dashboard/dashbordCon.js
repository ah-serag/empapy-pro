const pool = require("../../../config/condb");

const BookingDash = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = "";
        const params = [];

        if (startDate && endDate) {
            whereClause = "WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2";
            params.push(startDate, endDate);
        }

        const query = `
            WITH statusCounts AS (
                SELECT status, COUNT(*)::INT AS count 
                FROM bookings 
                ${whereClause}
                GROUP BY status
            )
            SELECT 
                COALESCE(SUM(count)::INT, 0) AS total,
                COALESCE(json_object_agg(status, count), '{}'::json) AS statuses
            FROM statusCounts;
        `;
        
        const result = await pool.query(query, params);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in BookingDash:", error.message);
        
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم" 
        });
    }
};

const UsersDash = async (req, res) => {
    try {
        const query = `
            WITH statusCounts AS (
                SELECT role, COUNT(*)::INT AS count 
                FROM users 
                GROUP BY role
            )
            SELECT 
                COALESCE(SUM(count)::INT, 0) AS total,
                COALESCE(json_object_agg(role, count), '{}'::json) AS roles
            FROM statusCounts;
        `;
        
        const result = await pool.query(query);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in UsersDash:", error.message);
        
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم أثناء جلب بيانات المستخدمين" 
        });
    }
};

const TeamDash = async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*)::INT FROM teams) AS total_teams,
                (SELECT COUNT(*)::INT FROM team_members) AS total_members,
                (SELECT COUNT(*)::INT 
                 FROM teams t 
                 WHERE NOT EXISTS (
                     SELECT 1 
                     FROM assignments a 
                     WHERE a.team_id = t.id 
                     AND a.status = 'in_progress'
                 )
                ) AS available_teams;
        `;
        
        const result = await pool.query(query);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in TeamDash:", error.message);
        
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي أثناء جلب إحصائيات الفرق" 
        });
    }
};

const AssignmentsDash = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = "";
        const params = [];

        if (startDate && endDate) {
            // استخدمنا assigned_at بناءً على الكود الخاص بك في TodayDash
            whereClause = "WHERE DATE(assigned_at) >= $1 AND DATE(assigned_at) <= $2";
            params.push(startDate, endDate);
        }

        const query = `
            WITH statusCounts AS (
                SELECT status, COUNT(*)::INT AS count 
                FROM assignments 
                ${whereClause}
                GROUP BY status
            )
            SELECT 
                COALESCE(SUM(count)::INT, 0) AS total,
                COALESCE(json_object_agg(status, count), '{}'::json) AS statuses
            FROM statusCounts;
        `;
        
        const result = await pool.query(query, params);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in AssignmentsDash :", error.message);
        
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم" 
        });
    }
};

const InvoicesDash = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = "";
        const params = [];

        if (startDate && endDate) {
            whereClause = "WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2";
            params.push(startDate, endDate);
        }

        const query = `
            WITH statusCounts AS (
                SELECT status, COUNT(*)::INT AS count 
                FROM invoices 
                ${whereClause}
                GROUP BY status
            )
            SELECT 
                COALESCE(SUM(count)::INT, 0) AS total,
                COALESCE(json_object_agg(status, count), '{}'::json) AS statuses
            FROM statusCounts;
        `;
        
        const result = await pool.query(query, params);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in InvoicesDash :", error.message);
        
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم" 
        });
    }
};

const FinanciaAmountlDash = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = "";
        const params = [];

        if (startDate && endDate) {
            whereClause = "WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2";
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                COALESCE(SUM(total_amount), 0) AS total_revenue,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS collected_revenue,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'draft'), 0) AS pending_revenue
            FROM invoices
            ${whereClause};
        `;
        
        const result = await pool.query(query, params);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in FinancialDash:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم أثناء جلب الإحصائيات المالية" 
        });
    }
};

const TodayDash = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereCreated = "";
        let whereAssigned = "";
        const params = [];

        if (startDate && endDate) {
            whereCreated = "WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2";
            whereAssigned = "WHERE DATE(assigned_at) >= $1 AND DATE(assigned_at) <= $2";
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                (SELECT COUNT(*)::INT FROM bookings ${whereCreated}) AS today_new_bookings,
                (SELECT COUNT(*)::INT FROM assignments ${whereAssigned}) AS today_assignments,
                (SELECT COUNT(*)::INT FROM invoices ${whereCreated}) AS today_invoices;
        `;
        
        const result = await pool.query(query, params);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in TodayDash:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم أثناء جلب إحصائيات الملخص" 
        });
    }
};



const ExpensesDash = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = "";
        const params = [];

        if (startDate && endDate) {
            whereClause = "WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2";
            params.push(startDate, endDate);
        }

        const query = `
            WITH statusCounts AS (
                SELECT status, COUNT(*)::INT AS count 
                FROM expenses 
                ${whereClause}
                GROUP BY status
            )
            SELECT 
                COALESCE(SUM(count)::INT, 0) AS total,
                COALESCE(json_object_agg(status, count), '{}'::json) AS statuses
            FROM statusCounts;
        `;
        
        const result = await pool.query(query, params);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in ExpensesDash :", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم" 
        });
    }
};

const CollectionsDash = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = "";
        const params = [];

        if (startDate && endDate) {
            whereClause = "WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2";
            params.push(startDate, endDate);
        }

        const query = `
            WITH statusCounts AS (
                SELECT 
                    CASE WHEN is_remitted = true THEN 'REMITTED' ELSE 'PENDING' END AS status, 
                    COUNT(*)::INT AS count 
                FROM collections 
                ${whereClause}
                GROUP BY CASE WHEN is_remitted = true THEN 'REMITTED' ELSE 'PENDING' END
            )
            SELECT 
                COALESCE(SUM(count)::INT, 0) AS total,
                COALESCE(json_object_agg(status, count), '{}'::json) AS statuses
            FROM statusCounts;
        `;
        
        const result = await pool.query(query, params);
        
        return res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Error in CollectionsDash :", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم" 
        });
    }
};


module.exports = {
    BookingDash,
    UsersDash,
    TeamDash,
    AssignmentsDash,
    InvoicesDash,
    FinanciaAmountlDash,
    TodayDash ,
        ExpensesDash,
    CollectionsDash
};