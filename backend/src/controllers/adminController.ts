import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { UserModel } from '../models/User';
import { JobModel } from '../models/Job';
import { CourseModel } from '../models/Course';
import { ResumeModel } from '../models/Resume';
import { GapReportModel } from '../models/GapReport';
import { PathwayModel } from '../models/Pathway';
import mongoose from 'mongoose';

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    activeUsers,
    totalJobs,
    activeJobs,
    totalCourses,
    totalResumes,
    totalGapReports,
    totalPathways,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ isActive: true }),
    JobModel.countDocuments(),
    JobModel.countDocuments({ isActive: true }),
    CourseModel.countDocuments({ isActive: true }),
    ResumeModel.countDocuments(),
    GapReportModel.countDocuments(),
    PathwayModel.countDocuments(),
  ]);

  // Signups in last 30 days grouped by date
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const signupTrend = await UserModel.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } },
  ]);

  // Role distribution
  const roleDistribution = await UserModel.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $project: { role: '$_id', count: 1, _id: 0 } },
  ]);

  // Top required skills (from jobs)
  const topSkills = await JobModel.aggregate([
    { $match: { isActive: true } },
    { $unwind: '$requiredSkills' },
    { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { skill: '$_id', count: 1, _id: 0 } },
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        activeUsers,
        totalJobs,
        activeJobs,
        totalCourses,
        totalResumes,
        totalGapReports,
        totalPathways,
      },
      signupTrend,
      roleDistribution,
      topSkills,
    },
  });
});

// ─── User Management ──────────────────────────────────────────────────────────

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.q) {
    const q = req.query.q as string;
    filter['$or'] = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserModel.findById(req.params.id)
    .select('-passwordHash -refreshToken')
    .lean();
  if (!user) throw createError('User not found', 404);

  // Get user stats
  const [resumes, gapReports, pathways] = await Promise.all([
    ResumeModel.countDocuments({ userId: req.params.id }),
    GapReportModel.countDocuments({ userId: req.params.id }),
    PathwayModel.countDocuments({ userId: req.params.id }),
  ]);

  res.json({
    success: true,
    data: { user, stats: { resumes, gapReports, pathways } },
  });
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role, isActive, name } = req.body;
  const allowedUpdates: Record<string, unknown> = {};

  if (role !== undefined) {
    if (!['candidate', 'admin'].includes(role)) throw createError('Invalid role', 400);
    allowedUpdates.role = role;
  }
  if (isActive !== undefined) allowedUpdates.isActive = Boolean(isActive);
  if (name !== undefined) allowedUpdates.name = name;

  if (Object.keys(allowedUpdates).length === 0) {
    throw createError('No valid fields to update', 400);
  }

  // Prevent admin from removing their own admin role
  if (req.user?.id === req.params.id && allowedUpdates.role === 'candidate') {
    throw createError('Cannot remove your own admin role', 400);
  }

  const user = await UserModel.findByIdAndUpdate(
    req.params.id,
    { $set: allowedUpdates },
    { new: true, select: '-passwordHash -refreshToken' }
  );
  if (!user) throw createError('User not found', 404);

  res.json({ success: true, data: { user } });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Prevent self-deletion
  if (req.user?.id === req.params.id) {
    throw createError('Cannot delete your own account via admin panel', 400);
  }

  const user = await UserModel.findByIdAndDelete(req.params.id);
  if (!user) throw createError('User not found', 404);

  res.json({ success: true, message: 'User deleted successfully' });
});

// ─── Job Management ───────────────────────────────────────────────────────────

export const createJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    jobTitle, companyName, companySlug, jobDescription, jobType, workType,
    locationType, jobLocation, jobLink, requiredSkills, preferredSkills,
    requiredExperience, salaryRange, jobCategory,
  } = req.body;

  if (!jobTitle || !companyName || !jobDescription || !jobLink) {
    throw createError('jobTitle, companyName, jobDescription, and jobLink are required', 400);
  }

  // Generate a unique externalId for manually added jobs
  const externalId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const job = await JobModel.create({
    externalId,
    jobTitle,
    companyName,
    companySlug: companySlug || companyName.toLowerCase().replace(/\s+/g, '-'),
    jobDescription,
    jobDescriptionRaw: jobDescription,
    jobType: jobType || 'FULL_TIME',
    workType: workType || 'onsite',
    locationType: locationType || 'onsite',
    jobLocation: jobLocation || '',
    jobLink,
    requiredSkills: requiredSkills || [],
    preferredSkills: preferredSkills || [],
    requiredExperience: requiredExperience ?? null,
    salaryRange: salaryRange || { min: null, max: null, currency: 'USD' },
    jobCategory: jobCategory || '',
    isActive: true,
    skillsExtracted: false,
    postedAt: new Date(),
  });

  res.status(201).json({ success: true, data: { job } });
});

export const updateJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const allowed = [
    'jobTitle', 'companyName', 'companySlug', 'jobDescription', 'jobType',
    'workType', 'locationType', 'jobLocation', 'jobLink', 'requiredSkills',
    'preferredSkills', 'requiredExperience', 'salaryRange', 'jobCategory',
    'isActive', 'closingDate',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) throw createError('No valid fields to update', 400);

  const job = await JobModel.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true }
  );
  if (!job) throw createError('Job not found', 404);

  res.json({ success: true, data: { job } });
});

export const deleteJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await JobModel.findByIdAndDelete(req.params.id);
  if (!job) throw createError('Job not found', 404);
  res.json({ success: true, message: 'Job deleted successfully' });
});

export const toggleJobActive = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await JobModel.findById(req.params.id);
  if (!job) throw createError('Job not found', 404);
  job.isActive = !job.isActive;
  await job.save();
  res.json({ success: true, data: { job, isActive: job.isActive } });
});

export const getAllJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.q) {
    const q = req.query.q as string;
    filter['$or'] = [
      { jobTitle: { $regex: q, $options: 'i' } },
      { companyName: { $regex: q, $options: 'i' } },
    ];
  }

  const [jobs, total] = await Promise.all([
    JobModel.find(filter)
      .select('-jobDescriptionRaw -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobModel.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { jobs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
  });
});

// ─── Course Management ────────────────────────────────────────────────────────

export const createCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, skill, skillCategory, prerequisites, estimatedHours, level, resourceUrl, provider, tags } = req.body;

  if (!title || !skill || !resourceUrl || !provider) {
    throw createError('title, skill, resourceUrl, and provider are required', 400);
  }

  const course = await CourseModel.create({
    title,
    skill: skill.toLowerCase(),
    skillCategory: skillCategory || 'other',
    prerequisites: prerequisites || [],
    estimatedHours: estimatedHours || 5,
    level: level || 'beginner',
    resourceUrl,
    provider,
    tags: tags || [],
    isActive: true,
  });

  res.status(201).json({ success: true, data: { course } });
});

export const updateCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const allowed = [
    'title', 'skill', 'skillCategory', 'prerequisites', 'estimatedHours',
    'level', 'resourceUrl', 'provider', 'tags', 'isActive',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.skill) updates.skill = (updates.skill as string).toLowerCase();
  if (Object.keys(updates).length === 0) throw createError('No valid fields to update', 400);

  const course = await CourseModel.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true }
  );
  if (!course) throw createError('Course not found', 404);

  res.json({ success: true, data: { course } });
});

export const deleteCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await CourseModel.findByIdAndDelete(req.params.id);
  if (!course) throw createError('Course not found', 404);
  res.json({ success: true, message: 'Course deleted successfully' });
});

export const toggleCourseActive = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await CourseModel.findById(req.params.id);
  if (!course) throw createError('Course not found', 404);
  course.isActive = !course.isActive;
  await course.save();
  res.json({ success: true, data: { course, isActive: course.isActive } });
});

export const getAllCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.q) {
    const q = req.query.q as string;
    filter['$or'] = [
      { title: { $regex: q, $options: 'i' } },
      { skill: { $regex: q, $options: 'i' } },
      { provider: { $regex: q, $options: 'i' } },
    ];
  }

  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseModel.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { courses, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
  });
});
