import { Router } from 'express';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
  updateParsedData,
} from '../controllers/resumeController';

const router = Router();

router.use(protect);

router.post('/upload', upload.single('file'), uploadResume);
router.get('/me', getMyResumes);
router.get('/:id', getResumeById);
router.patch('/:id', updateParsedData);
router.delete('/:id', deleteResume);

export default router;
