const pool = require("../../config/condb");



const getUnreadNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications WHERE is_read = false ORDER BY created_at DESC`
        );
        
        return res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, is_read = "all" } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM notifications`;
        let countQuery = `SELECT COUNT(*) FROM notifications`;
        
        const queryParams = [];
        let whereClause = "";

        if (is_read !== "all") {
            whereClause = ` WHERE is_read = $1`;
            queryParams.push(is_read === "true");
        }

        query += whereClause + ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        countQuery += whereClause;

        const result = await pool.query(query, [...queryParams, limit, offset]);
        const countResult = await pool.query(countQuery, queryParams);

        const totalRecords = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                total_records: totalRecords,
                total_pages: totalPages,
                current_page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.body; 

        if (id) {
            await pool.query(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
        } else {
            await pool.query(`UPDATE notifications SET is_read = true WHERE is_read = false`);
        }

        return res.status(200).json({
            success: true,
            message: id ? "Notification marked as read." : "All notifications marked as read."
        });
    } catch (err) {
        console.error("Error updating notifications:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`DELETE FROM notifications WHERE id = $1 RETURNING *`, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }

        return res.status(200).json({ success: true, message: "Notification deleted successfully." });
    } catch (err) {
        console.error("Error deleting notification:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deleteAllNotifications = async (req, res) => {
    try {
        await pool.query(`DELETE FROM notifications`);
        return res.status(200).json({ success: true, message: "All notifications deleted successfully." });
    } catch (err) {
        console.error("Error deleting all notifications:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = { 
    getUnreadNotifications, 
    getAllNotifications, 
    markAsRead,
    deleteNotification,
    deleteAllNotifications
};