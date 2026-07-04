import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import { diskStorage } from "multer";
import path from "path";
import fs from "fs";

// Determine if Cloudinary is fully configured with real keys
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  !process.env.CLOUDINARY_CLOUD_NAME.includes("placeholder");

let storage;

if (isCloudinaryConfigured) {
  // Configure Cloudinary Storage engine for Multer
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "urbasi_enterprise",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 500, height: 500, crop: "fill" }],
    },
  });
} else {
  // Fallback to local storage in src/uploads folder
  const uploadDir = "src/uploads";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
}

// Configure Multer upload middleware
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum size limit
  },
  fileFilter: (req, file, cb) => {
    // Restrict uploads to images only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("File upload failed. Only image uploads are allowed!"), false);
    }
  },
});

export default upload;
