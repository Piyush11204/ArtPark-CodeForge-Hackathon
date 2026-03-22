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
import adminRoutes from './routes/adminRoutes';
import chatRoutes from './routes/chatRoutes';

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
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Serve React frontend build (works in both dev and production)
// FRONTEND_DIST_PATH env var overrides the default (useful for Docker builds)
const frontendDist = process.env.FRONTEND_DIST_PATH
  ? path.resolve(process.env.FRONTEND_DIST_PATH)
  : path.join(__dirname, '../../frontend/dist');

app.use(
  express.static(frontendDist, {
    setHeaders(res, filePath) {
      // Correct MIME type for Web App Manifest (.webmanifest)
      if (filePath.endsWith('.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json');
      }
      // Service worker must never be cached — browsers must always fetch fresh
      if (filePath.endsWith('sw.js') || /workbox-[^/]+\.js$/.test(filePath) || filePath.endsWith('registerSW.js')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Service-Worker-Allowed', '/');
      }
    },
  })
);

// SPA catch-all: serve index.html for navigation requests only.
// Paths with a file extension (e.g. .js, .css, .png, .webmanifest) are NOT
// served as index.html — if express.static didn't find them, return 404.
// This prevents the browser receiving HTML with the wrong MIME type for
// missing static assets (e.g. registerSW.js, manifest.webmanifest).
app.get(/^(?!\/api)/, (req, res) => {
  if (path.extname(req.path)) {
    // Known static file that doesn't exist in dist — proper 404
    res.status(404).send('Not found');
    return;
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// 404 only for unmatched /api routes
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
