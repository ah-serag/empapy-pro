const { verifyAccessToken } = require("../../utils/jwt");

const authenticate = (req, res, next) => {

  const token = req.cookies?.accessToken;
   
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {

  const decoded = verifyAccessToken(token);
    

    req.userId = decoded.id ;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticate;
