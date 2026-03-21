import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { env } from '../config/env';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const MAX_SIZE_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 1,
  },
});

export function getFileExtension(mimetype: string): string {
  const map: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
  };
  return map[mimetype] || '';
}
