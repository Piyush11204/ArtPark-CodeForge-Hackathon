export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    bytes: number;
    original_filename: string;
}
export declare function uploadToCloudinary(buffer: Buffer, filename: string, folder?: string): Promise<CloudinaryUploadResult>;
export declare function deleteFromCloudinary(publicId: string): Promise<void>;
//# sourceMappingURL=cloudinaryService.d.ts.map