const jwt = require("jsonwebtoken");

function generateAccessToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }  
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } 
  );
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, id: decoded.id };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return { valid: true, id: decoded.id };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

function generateEmailToken(userId) {
  return jwt.sign(
    { id: userId },
     process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}

function verifyEmailToken(token) {
  try {
    const decoded = jwt.verify(token , process.env.JWT_SECRET);
    return { valid: true, id: decoded.id };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateEmailToken,
  verifyEmailToken
};
