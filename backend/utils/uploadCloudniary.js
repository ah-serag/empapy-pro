const cloudinary = require("../config/cloudniary");
const streamifier = require("streamifier");



const uploadToCloudinary = (fileBuffer, folder, type = "image", publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: type,
        public_id: publicId || `${Date.now()}_${Math.random()}`,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};


















module.exports = {uploadToCloudinary , cloudinary} ;
 