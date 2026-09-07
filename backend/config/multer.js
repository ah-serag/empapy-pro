const multer = require("multer");

const storage = multer.memoryStorage();


const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only type : JPG, PNG, WEBP and SVG are allowed."), false);
  }
};


const handleMulterError = (err, res, next, maxCount, type = "IMAGES") => {
  if (err) {
    let errorMessage = "An error occurred while uploading.";

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        errorMessage = `allowed limit : ${maxCount} ${type}`;
      } else if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage = type === "VIDEOS" ? "Max Size : 50MB" : "Max Size : 5MB";
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    return res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
  next();
};

const handleImageUpload = (name, maxCount) => {
  const upload = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
  }).array(name, maxCount);

  return (req, res, next) => {
    upload(req, res, (err) => handleMulterError(err, res, next, maxCount));
  };
};


module.exports = {
  handleImageUpload,
 
};