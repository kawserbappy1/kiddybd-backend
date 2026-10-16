"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleImage = void 0;
exports.uploadToCloudinary = uploadToCloudinary;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const env_1 = require("../config/env");
const errors_1 = require("../common/errors");
// 1. Configure Cloudinary
if (env_1.env.CLOUDINARY_CLOUD_NAME && env_1.env.CLOUDINARY_API_KEY && env_1.env.CLOUDINARY_API_SECRET) {
    cloudinary_1.v2.config({
        cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
        api_key: env_1.env.CLOUDINARY_API_KEY,
        api_secret: env_1.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}
// 2. Multer Memory Storage Configuration
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new errors_1.AppError('Only image files (JPEG, PNG, WEBP) are supported.', 400, 'INVALID_FILE_TYPE'));
        }
    },
});
const uploadSingleImage = (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err)
            return next(err);
        if (req.files && req.files.length > 0) {
            req.file = req.files[0];
        }
        next();
    });
};
exports.uploadSingleImage = uploadSingleImage;
/**
 * Uploads an image buffer directly to Cloudinary.
 * If Cloudinary credentials are not configured in .env,
 * provides a seamless fallback using base64 data-URI so the user's uploaded image
 * immediately works on UI without breaking.
 */
async function uploadToCloudinary(fileBuffer, folder = 'products', originalMimetype = 'image/jpeg') {
    // If Cloudinary credentials are set up
    if (env_1.env.CLOUDINARY_CLOUD_NAME && env_1.env.CLOUDINARY_API_KEY && env_1.env.CLOUDINARY_API_SECRET) {
        try {
            const uploadPromise = new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder: `kiddybd/${folder}`,
                    resource_type: 'image',
                    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                }, (error, result) => {
                    if (error || !result) {
                        reject(error || new Error('Upload failed'));
                    }
                    else {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    }
                });
                uploadStream.end(fileBuffer);
            });
            return await uploadPromise;
        }
        catch {
            // If Cloudinary network error occurs, seamlessly fall through to base64 data-URL
        }
    }
    // Graceful fallback if Cloudinary credentials not yet entered in .env
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${originalMimetype};base64,${base64}`;
    return {
        url: dataUrl,
        publicId: `local-${Date.now()}`,
    };
}
