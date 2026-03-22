"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = uploadToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
const cloudinary_1 = require("cloudinary");
const logger_1 = require("../utils/logger");
async function uploadToCloudinary(buffer, filename, folder = 'resumes') {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: 'raw',
            public_id: `${Date.now()}_${filename.replace(/\.[^.]+$/, '')}`,
            overwrite: false,
            tags: ['resume'],
        }, (error, result) => {
            if (error || !result) {
                logger_1.logger.error('Cloudinary upload error:', error);
                reject(error || new Error('Cloudinary upload returned no result'));
            }
            else {
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    format: result.format,
                    bytes: result.bytes,
                    original_filename: result.original_filename,
                });
            }
        });
        uploadStream.end(buffer);
    });
}
async function deleteFromCloudinary(publicId) {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: 'raw' });
        logger_1.logger.info(`Cloudinary resource deleted: ${publicId}`);
    }
    catch (err) {
        logger_1.logger.error(`Cloudinary delete failed for ${publicId}:`, err);
    }
}
//# sourceMappingURL=cloudinaryService.js.map