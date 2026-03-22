"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.getFileExtension = getFileExtension;
const multer_1 = __importDefault(require("multer"));
const env_1 = require("../config/env");
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];
const MAX_SIZE_BYTES = env_1.env.MAX_FILE_SIZE_MB * 1024 * 1024;
const storage = multer_1.default.memoryStorage();
function fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
}
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_SIZE_BYTES,
        files: 1,
    },
});
function getFileExtension(mimetype) {
    const map = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'text/plain': '.txt',
    };
    return map[mimetype] || '';
}
//# sourceMappingURL=upload.js.map