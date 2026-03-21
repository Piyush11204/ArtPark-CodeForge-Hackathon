import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import resumeRoutes from './routes/resumeRoutes';
import gapRoutes from './routes/gapRoutes';
import pathwayRoutes from './routes/pathwayRoutes';
import courseRoutes from './routes/courseRoutes';

const app = express();

// Security
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Vite-built assets to load
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      const allowed = [
        env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean);
      if (allowed.includes(origin)) return callback(null, true);
      // In production, also allow same-origin Render deployments
      if (env.NODE_ENV === 'production') return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
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
app.use('/api/courses', courseRoutes);

// Serve React frontend in production
if (env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  // SPA catch-all: serve index.html for non-API routes
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 for unmatched API routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
