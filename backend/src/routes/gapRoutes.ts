import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { analyzeGap, getGapReport, getGapHistory } from '../controllers/gapController';

const router = Router();

router.use(protect);

router.post(
  '/analyze',
  [
    body('resumeId').notEmpty().withMessage('resumeId is required'),
    body('jobId').notEmpty().withMessage('jobId is required'),
  ],
  validate,
  analyzeGap
);

router.get('/history', getGapHistory);
router.get('/:id', getGapReport);

export default router;
