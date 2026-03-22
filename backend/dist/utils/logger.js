"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const { combine, timestamp, colorize, printf, json } = winston_1.default.format;
const devFormat = combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
}));
const prodFormat = combine(timestamp(), json());
exports.logger = winston_1.default.createLogger({
    level: env_1.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: env_1.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    transports: [new winston_1.default.transports.Console()],
});
//# sourceMappingURL=logger.js.map