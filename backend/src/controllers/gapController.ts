import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ResumeModel } from '../models/Resume';
import { JobModel } from '../models/Job';
import { GapReportModel } from '../models/GapReport';
import { computeGap } from '../services/gapEngine';

export const analyzeGap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { resumeId, jobId } = req.body;

  // Fetch resume — must belong to this user
  const resume = await ResumeModel.findOne({ _id: resumeId, userId: req.user!.id });
  if (!resume) throw createError('Resume not found', 404);

  // Fetch job
  const job = await JobModel.findById(jobId);
  if (!job) throw createError('Job not found', 404);

  // If job has no required skills yet, ML service will extract from description
  // (computeGap handles this internally — no need to early-return)

  // Compute gap (async — may call ML service for JD skill extraction)
  const gapDetail = await computeGap(resume.normalizedSkills, job);

  // Save gap report
  const gapReport = await GapReportModel.create({
    userId: req.user!.id,
    resumeId: resume._id,
    jobId: job._id,
    gapReport: gapDetail,
  });

  res.status(201).json({
    success: true,
    message: 'Gap analysis complete',
    data: {
      gapReportId: gapReport._id,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      ...gapDetail,
    },
  });
});

export const getGapReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await GapReportModel.findOne({
    _id: req.params.id,
    userId: req.user!.id,
  })
    .populate('jobId', 'jobTitle companyName workType jobType')
    .populate('resumeId', 'originalFilename parsedAt')
    .select('-__v')
    .lean();

  if (!report) throw createError('Gap report not found', 404);
  res.json({ success: true, data: report });
});

export const getGapHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    GapReportModel.find({ userId: req.user!.id })
      .populate('jobId', 'jobTitle companyName workType')
      .populate('resumeId', 'originalFilename parsedAt')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    GapReportModel.countDocuments({ userId: req.user!.id }),
  ]);

  res.json({
    success: true,
    data: { reports, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
  });
});
