import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  original_filename: string;
}

/**
 * Uploads a buffer to Cloudinary under the given folder.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'resumes'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        public_id: `${Date.now()}_${filename.replace(/\.[^.]+$/, '')}`,
        overwrite: false,
        tags: ['resume'],
      },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload error:', error);
          reject(error || new Error('Cloudinary upload returned no result'));
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            original_filename: result.original_filename,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Deletes a resource from Cloudinary by public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    logger.info(`Cloudinary resource deleted: ${publicId}`);
  } catch (err) {
    logger.error(`Cloudinary delete failed for ${publicId}:`, err);
  }
}
