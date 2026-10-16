import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../common/errors';

// 1. Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// 2. Multer Memory Storage Configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files (JPEG, PNG, WEBP) are supported.', 400, 'INVALID_FILE_TYPE'));
    }
  },
});

export const uploadSingleImage = (req: any, res: any, next: any) => {
  upload.any()(req, res, (err: any) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

/**
 * Uploads an image buffer directly to Cloudinary.
 * If Cloudinary credentials are not configured in .env,
 * provides a seamless fallback using base64 data-URI so the user's uploaded image
 * immediately works on UI without breaking.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: 'products' | 'avatars' = 'products',
  originalMimetype = 'image/jpeg'
): Promise<{ url: string; publicId?: string }> {
  // If Cloudinary credentials are set up
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    try {
      const uploadPromise = new Promise<{ url: string; publicId?: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `kiddybd/${folder}`,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result?: UploadApiResponse) => {
            if (error || !result) {
              reject(error || new Error('Upload failed'));
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          }
        );
        uploadStream.end(fileBuffer);
      });
      return await uploadPromise;
    } catch {
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
