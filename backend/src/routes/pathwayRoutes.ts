import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  generatePathwayHandler,
  getPathway,
  updateStepStatus,
  getMyPathways,
} from '../controllers/pathwayController';

const router = Router();

router.use(protect);

router.post(
  '/generate',
  [body('gapReportId').notEmpty().withMessage('gapReportId is required')],
  validate,
  generatePathwayHandler
);

router.get('/me', getMyPathways);
router.get('/:id', getPathway);

router.patch(
  '/:pathwayId/step/:stepId',
  [
    param('pathwayId').notEmpty(),
    param('stepId').notEmpty(),
    body('status')
      .isIn(['pending', 'in-progress', 'completed'])
      .withMessage('status must be pending, in-progress, or completed'),
  ],
  validate,
  updateStepStatus
);

export default router;
