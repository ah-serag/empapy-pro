const hosts = process.env.ALLOWED_ORIGIN;

module.exports = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (hosts.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, 
  optionsSuccessStatus: 200 
};