import { validateEnv, env } from './config/env';
import { connectDB } from './config/db';
import { initCloudinary } from './config/cloudinary';
import app from './app';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  // 1. Validate all required environment variables
  validateEnv();

  // 2. Init Cloudinary
  initCloudinary();

  // 3. Connect to MongoDB
  await connectDB();

  // 4. Start HTTP server
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health check: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
