import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import resumeRoutes from './routes/resumeRoutes';
import gapRoutes from './routes/gapRoutes';
import pathwayRoutes from './routes/pathwayRoutes';

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts — please try again later.' },
});

app.use(globalLimiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'AI-Adaptive Onboarding Engine API is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/gap', gapRoutes);
app.use('/api/pathway', pathwayRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
