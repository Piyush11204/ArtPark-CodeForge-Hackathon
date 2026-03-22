import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth';
import {
  sendMessage,
  getChatHistory,
  getChatSession,
  deleteChatSession,
} from '../controllers/chatController';

const router = Router();

// All chat routes require authentication
router.use(protect);

// Rate limit: 60 messages per user per hour
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req as { user?: { id: string } }).user?.id || req.ip || 'unknown',
  message: { success: false, message: 'Chat rate limit reached — max 60 messages per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/message', chatLimiter, sendMessage);
router.get('/history', getChatHistory);
router.get('/history/:sessionId', getChatSession);
router.delete('/history/:sessionId', deleteChatSession);

export default router;
