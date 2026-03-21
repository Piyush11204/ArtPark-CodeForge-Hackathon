import { Router } from 'express';
import { getJobs, searchJobs, getJobById, getJobCategories } from '../controllers/jobController';

const router = Router();

router.get('/', getJobs);
router.get('/search', searchJobs);
router.get('/categories', getJobCategories);
router.get('/:id', getJobById);

export default router;
