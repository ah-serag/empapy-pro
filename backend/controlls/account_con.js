const pool = require("./../config/condb");



const getUserAccountInfo = async (req, res) => {
  try {
    const userId = req.userId; 

    const query = `
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.phone, 
        u.role, 
        u.last_login_at,
        t.id AS team_id
      FROM users u
      LEFT JOIN teams t ON u.id = t.supervisor_id
      WHERE u.id = $1
    `;
    
    const params = [userId];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    return res.status(200).json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error("getUserAccountInfo Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


module.exports = {
     getUserAccountInfo
}