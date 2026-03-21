import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refresh, getMe, logout } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain a number'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('refreshToken is required')],
  validate,
  refresh
);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
