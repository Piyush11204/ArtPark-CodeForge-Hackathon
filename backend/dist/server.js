"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const cloudinary_1 = require("./config/cloudinary");
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
async function bootstrap() {
    (0, env_1.validateEnv)();
    (0, cloudinary_1.initCloudinary)();
    await (0, db_1.connectDB)();
    const server = app_1.default.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
        logger_1.logger.info(`Health check: http://localhost:${env_1.env.PORT}/health`);
    });
    const shutdown = async (signal) => {
        logger_1.logger.info(`Received ${signal} — shutting down gracefully`);
        server.close(() => {
            logger_1.logger.info('HTTP server closed');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled Promise Rejection:', reason);
        process.exit(1);
    });
    process.on('uncaughtException', (err) => {
        logger_1.logger.error('Uncaught Exception:', err);
        process.exit(1);
    });
}
bootstrap().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map