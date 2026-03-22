import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth';
import {
  getStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createJob,
  updateJob,
  deleteJob,
  toggleJobActive,
  getAllJobs,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleCourseActive,
  getAllCourses,
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin'));

// Analytics
router.get('/stats', getStats);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Job Management
router.get('/jobs', getAllJobs);
router.post('/jobs', createJob);
router.patch('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);
router.patch('/jobs/:id/toggle', toggleJobActive);

// Course Management
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.patch('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.patch('/courses/:id/toggle', toggleCourseActive);

export default router;
