import { Router } from 'express';
import {
  getCourses,
  getCoursesBySkill,
  getCourseCategories,
  getCourseById,
} from '../controllers/courseController';

const router = Router();

// GET /api/courses              - list with filters + pagination
router.get('/', getCourses);

// GET /api/courses/categories   - category breakdown counts (must be before /:id)
router.get('/categories', getCourseCategories);

// GET /api/courses/skill/:skill - all courses for a specific skill
router.get('/skill/:skill', getCoursesBySkill);

// GET /api/courses/:id          - single course
router.get('/:id', getCourseById);

export default router;
