import { Request, Response } from 'express';
import { JobModel } from '../models/Job';
import { asyncHandler, createError } from '../middleware/errorHandler';

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  if (req.query.workType) filter.workType = req.query.workType;
  if (req.query.jobType) filter.jobType = req.query.jobType;
  if (req.query.company) filter.companySlug = req.query.company;

  const [jobs, total] = await Promise.all([
    JobModel.find(filter)
      .select('-jobDescriptionRaw -__v')
      .sort({ postedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobModel.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const searchJobs = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  if (!q) {
    throw createError('Search query "q" is required', 400);
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    isActive: true,
    $text: { $search: q },
  };

  const [jobs, total] = await Promise.all([
    JobModel.find(filter, { score: { $meta: 'textScore' } })
      .select('-jobDescriptionRaw -__v')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobModel.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      jobs,
      query: q,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const job = await JobModel.findById(req.params.id).select('-jobDescriptionRaw -__v').lean();
  if (!job) throw createError('Job not found', 404);

  // Increment view count in background
  JobModel.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

  res.json({ success: true, data: job });
});

export const getJobCategories = asyncHandler(async (_req: Request, res: Response) => {
  const [companies, jobTypes, workTypes, locations] = await Promise.all([
    JobModel.distinct('companyName', { isActive: true }),
    JobModel.distinct('jobType', { isActive: true }),
    JobModel.distinct('workType', { isActive: true }),
    JobModel.distinct('jobLocation', { isActive: true }),
  ]);

  res.json({
    success: true,
    data: { companies: companies.slice(0, 100), jobTypes, workTypes, locations: locations.slice(0, 100) },
  });
});
