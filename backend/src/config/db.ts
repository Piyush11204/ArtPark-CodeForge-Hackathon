import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      logger.info(`MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      attempt++;
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${(err as Error).message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      } else {
        throw new Error('Could not connect to MongoDB after maximum retries');
      }
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});
