const pool = require("../../config/condb");

const attachUser = async (req, res, next) => {

  try {
     
    const { rows } = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = attachUser;
