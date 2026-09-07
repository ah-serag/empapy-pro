const pool = require("./../config/condb");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");

const REFRESH_TOKEN_EXPIRY_MS = 60 * 24 * 60 * 60 * 1000; 


const register = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    // Strict Validation
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: "Full name, email, phone, and password are required." });
    }

    // Check if email already exists
    const userCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Insert user with default role 'client' as per PostgreSQL schema constraint
    const insertResult = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'client', true) 
       RETURNING id, full_name, email, role`,
      [full_name, email, phone, password_hash]
    );
    const user = insertResult.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Calculate database expiry time for the session
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    // Store session details in user_sessions table instead of users table
    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, refreshToken, req.ip || null, req.headers["user-agent"] || null, expiresAt]
    );

    // Set Cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 1000, // 15 mins
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_EXPIRY_MS, // 60 Days
      path: "/",
    });

    return res.status(201).json({
      message: `${user.full_name}, your account was created successfully.`,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const sign_in = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email and password are required." });
    }

    const getUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

    if (!getUser.rows.length) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const user = getUser.rows[0];

    if (user.is_active !== true) {
      return res.status(403).json({ ok: false, message: "عفواً، هذا الحساب معطل." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ ok: false, message: "Incorrect password" });
    }

    await pool.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    // Save session metadata
    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, refreshToken, req.ip || null, req.headers["user-agent"] || null, expiresAt]
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_EXPIRY_MS, 
      path: "/",
    });

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      user: { id: user.id, full_name: user.full_name, role: user.role }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const sessionCheck = await pool.query(
      `SELECT us.user_id, u.role, u.is_active FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       WHERE us.token_hash = $1 AND us.user_id = $2 AND us.expires_at > CURRENT_TIMESTAMP`,
      [refreshToken, decoded.id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({ message: "Invalid or expired session" });
    }

    const user = sessionCheck.rows[0];

    if (user.is_active !== true) {
      // تعديل هنا: إضافة نفس الخصائص
      res.clearCookie("accessToken", { path: "/", httpOnly: true, secure: true, sameSite: "none" });
      res.clearCookie("refreshToken", { path: "/", httpOnly: true, secure: true, sameSite: "none" });
      
      return res.status(403).json({ message: "عفواً، هذا الحساب معطل." });
    }

    // Create new access token
    const accessToken = generateAccessToken(user.user_id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

const logOut = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      await pool.query(`DELETE FROM user_sessions WHERE token_hash = $1`, [refreshToken]);
    }

    res.clearCookie("accessToken", { 
      path: "/", 
      httpOnly: true, 
      secure: true, 
      sameSite: "none" 
    });
    
    res.clearCookie("refreshToken", { 
      path: "/", 
      httpOnly: true, 
      secure: true, 
      sameSite: "none" 
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error during logout" });
  }
};


const createTeamMember = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: "All fields including role are required." });
    }

    const allowedRoles = [ "admin", "supervisor", "technician", "client"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid target role specified." });
    }

    // Check availability
    const userCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email is already assigned to another user." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const insertResult = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, phone, password_hash, role]
    );

    return res.status(201).json({
      message: `Account for ${role} (${full_name}) created successfully by manager.`,
      user: insertResult.rows[0]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUsers = async (req, res) => {
  try {
    const { 
      search, 
      role, 
      is_active, 
      page = 1, 
      limit = 10, 
      sort_by = "created_at", 
      order = "DESC" 
    } = req.query;

    let query = `
      SELECT 
        id, full_name, email, phone, role, is_active, created_at, last_login_at,
        COUNT(*) OVER() as total_count
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // 1. البحث الشامل (بالاسم، الإيميل، أو رقم التليفون)
    if (search) {
      query += ` AND (
        full_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        phone ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 2. الفلترة بالدور (Role)
    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // 3. الفلترة بالحالة (is_active)
    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === "true");
      paramIndex++;
    }

    // 4. الحماية من الـ SQL Injection في الترتيب (Sorting)
    const allowedSortColumns = ["full_name", "email", "created_at", "last_login_at", "role", "is_active"];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : "created_at";
    const safeOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    
    query += ` ORDER BY ${safeSortBy} ${safeOrder}`;

    // 5. التقسيم لصفحات (Pagination)
    const limitNum = parseInt(limit, 10);
    const offsetNum = (parseInt(page, 10) - 1) * limitNum;
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offsetNum);

    // تنفيذ الاستعلام
    const result = await pool.query(query, params);

    // حساب إجمالي الصفحات
    const totalRecords = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const totalPages = Math.ceil(totalRecords / limitNum);

    // إزالة حقل total_count من النتيجة النهائية عشان شكل الداتا يبقى نظيف
    const users = result.rows.map(user => {
      const { total_count, ...userData } = user;
      return userData;
    });

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total_records: totalRecords,
          total_pages: totalPages,
          current_page: parseInt(page, 10),
          limit: limitNum
        }
      }
    });

  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error while fetching users." });
  }
};

// 1. تغيير حالة الحساب (نشط / غير نشط)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ success: false, message: "is_active status is required." });
    }

    const result = await pool.query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, is_active`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Status of ${result.rows[0].full_name} updated successfully.`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Error toggling user status:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userCheck = await pool.query(`SELECT id, role, full_name FROM users WHERE id = $1`, [id]);
    
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = userCheck.rows[0];
    const userRole = user.role?.toLowerCase() || '';

    const excludedRoles = ['admin', 'superadmin', 'client'];

    if (!excludedRoles.includes(userRole)) {

      // فحص 1: هل المستخدم (من خلال عضويته في الـ team_members) مرتبط بأي مهمة تنفيذية في job_execution_members؟
      const assignmentCheck = await pool.query(`
        SELECT 1 
        FROM job_execution_members jem
        JOIN team_members tm ON jem.member_id = tm.id
        WHERE tm.user_id = $1 
        LIMIT 1
      `, [id]);

      if (assignmentCheck.rowCount > 0) {
        return res.status(409).json({ 
          success: false, 
          message: "لا يمكن حذف هذا المستخدم لارتباطه بمهام (Assignments) حالية. يرجى إزالته من المهام أولاً." 
        });
      }

      // فحص 2: هل المستخدم عضو في فريق؟
      const teamMemberCheck = await pool.query(`SELECT 1 FROM team_members WHERE user_id = $1 LIMIT 1`, [id]);
      if (teamMemberCheck.rowCount > 0) {
        return res.status(409).json({ 
          success: false, 
          message: "لا يمكن حذف هذا المستخدم لأنه عضو في فريق (Team). يرجى إزالته من فريقه أولاً." 
        });
      }

      // فحص 3: هل المستخدم مشرف على فريق؟
      const supervisorCheck = await pool.query(`SELECT 1 FROM teams WHERE supervisor_id = $1 LIMIT 1`, [id]);
      if (supervisorCheck.rowCount > 0) {
        return res.status(409).json({ 
          success: false, 
          message: "لا يمكن حذف هذا المستخدم لأنه مشرف (Supervisor) على فريق. يرجى تعيين مشرف آخر للفريق أولاً." 
        });
      }
    }

    await pool.query(`DELETE FROM user_sessions WHERE user_id = $1`, [id]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    return res.status(200).json({
      success: true,
      message: `Account of ${user.full_name} has been permanently deleted.`
    });

  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




const getUsersForDropdown = async (req, res) => {
    try {
        const { role } = req.query;
        let query = `SELECT id, full_name, email FROM users WHERE is_active = TRUE`;
        const params = [];

        if (role) {
            const rolesArray = role.split(',').map(r => r.trim());
            const allowedRoles = ['superadmin', 'admin', 'supervisor', 'technician', 'client'];
            
            const isValid = rolesArray.every(r => allowedRoles.includes(r));
            
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: "تم إرسال صلاحيات غير صالحة."
                });
            }

            const placeholders = rolesArray.map((_, i) => `$${i + 1}`).join(',');
            query += ` AND role IN (${placeholders})`;
            params.push(...rolesArray);
        }
        query += ` ORDER BY full_name ASC`;
        const result = await pool.query(query, params);

        return res.status(200).json({ 
            success: true, 
            data: result.rows 
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ 
            success: false, 
            message: "حدث خطأ داخلي في الخادم." 
        });
    }
};





module.exports = { 
  register, 
  sign_in, 
  refresh, 
  logOut, 
  createTeamMember, 
  getUsers, 
  toggleUserStatus,
  getUsersForDropdown , 
  deleteUser     
};



