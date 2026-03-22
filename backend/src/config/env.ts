import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// Always required regardless of environment
const ALWAYS_REQUIRED = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

// Required only in production (ML service is external on Render)
const PROD_REQUIRED = ['RESUME_PARSER_URL', 'ML_SERVICE_URL', 'FRONTEND_URL'];

export function validateEnv(): void {
  const required = isProd ? [...ALWAYS_REQUIRED, ...PROD_REQUIRED] : ALWAYS_REQUIRED;
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProd,

  MONGODB_URI: process.env.MONGODB_URI as string,

  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || (isProd ? '15m' : '1h'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,

  // On Render: set RESUME_PARSER_URL to your ml-service Render URL, e.g. https://artpark-ml.onrender.com
  RESUME_PARSER_URL: process.env.RESUME_PARSER_URL || 'http://localhost:6000',
  // On Render: set ML_SERVICE_URL to your ml-service Render URL
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:6000',

  // On Render: set FRONTEND_URL to your backend Render URL (same origin, frontend is served by backend)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),

  // Chatbot
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  CHAT_MAX_HISTORY: parseInt(process.env.CHAT_MAX_HISTORY || '20', 10),
};
