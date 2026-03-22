"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            await mongoose_1.default.connect(uri, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            });
            logger_1.logger.info(`MongoDB connected: ${mongoose_1.default.connection.host}`);
            return;
        }
        catch (err) {
            attempt++;
            logger_1.logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
            if (attempt < MAX_RETRIES) {
                await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
            }
            else {
                throw new Error('Could not connect to MongoDB after maximum retries');
            }
        }
    }
}
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('MongoDB disconnected');
});
mongoose_1.default.connection.on('reconnected', () => {
    logger_1.logger.info('MongoDB reconnected');
});
//# sourceMappingURL=db.js.map