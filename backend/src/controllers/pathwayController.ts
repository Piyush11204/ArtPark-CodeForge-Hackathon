import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { GapReportModel } from '../models/GapReport';
import { PathwayModel } from '../models/Pathway';
import { ResumeModel } from '../models/Resume';
import { generatePathway } from '../services/adaptivePathing';

export const generatePathwayHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { gapReportId } = req.body;

  const gapReport = await GapReportModel.findOne({
    _id: gapReportId,
    userId: req.user!.id,
  });
  if (!gapReport) throw createError('Gap report not found', 404);

  const resume = await ResumeModel.findById(gapReport.resumeId).select('normalizedSkills');
  if (!resume) throw createError('Associated resume not found', 404);

  // Generate the adaptive pathway
  const { steps, totalEstimatedHours } = await generatePathway(
    gapReport.gapReport,
    resume.normalizedSkills
  );

  // Upsert — if pathway already exists for this gap report, replace it
  const existing = await PathwayModel.findOne({ gapReportId });
  let pathway;
  if (existing) {
    existing.steps = steps as typeof existing.steps;
    existing.totalEstimatedHours = totalEstimatedHours;
    existing.completedHours = 0;
    existing.progressPercent = 0;
    existing.generatedAt = new Date();
    pathway = await existing.save();
  } else {
    pathway = await PathwayModel.create({
      userId: req.user!.id,
      gapReportId: gapReport._id,
      jobId: gapReport.jobId,
      resumeId: gapReport.resumeId,
      steps,
      totalEstimatedHours,
    });
    // Link pathway back to gap report
    await GapReportModel.findByIdAndUpdate(gapReportId, { pathwayId: pathway._id });
  }

  res.status(201).json({
    success: true,
    message: 'Learning pathway generated',
    data: pathway,
  });
});

export const getPathway = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pathway = await PathwayModel.findOne({
    _id: req.params.id,
    userId: req.user!.id,
  })
    .populate('jobId', 'jobTitle companyName workType')
    .populate('resumeId', 'originalFilename parsedAt')
    .select('-__v')
    .lean();

  if (!pathway) throw createError('Pathway not found', 404);
  res.json({ success: true, data: pathway });
});

export const updateStepStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pathwayId, stepId } = req.params;
  const { status } = req.body;

  if (!['pending', 'in-progress', 'completed'].includes(status)) {
    throw createError('Invalid status value', 400);
  }

  const pathway = await PathwayModel.findOne({
    _id: pathwayId,
    userId: req.user!.id,
  });
  if (!pathway) throw createError('Pathway not found', 404);

  const step = pathway.steps.find((s) => String((s as typeof s & { _id: unknown })._id) === stepId);
  if (!step) throw createError('Step not found', 404);

  const wasCompleted = step.status === 'completed';
  step.status = status;
  if (status === 'completed' && !wasCompleted) {
    step.completedAt = new Date();
  } else if (status !== 'completed') {
    step.completedAt = undefined;
  }

  // Recalculate progress
  const completedSteps = pathway.steps.filter((s) => s.status === 'completed');
  const completedHours = completedSteps.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);
  pathway.completedHours = completedHours;
  pathway.progressPercent =
    pathway.totalEstimatedHours > 0
      ? Math.round((completedHours / pathway.totalEstimatedHours) * 100)
      : 0;

  await pathway.save();

  res.json({
    success: true,
    message: 'Step updated',
    data: {
      step,
      completedHours: pathway.completedHours,
      progressPercent: pathway.progressPercent,
    },
  });
});

export const getMyPathways = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pathways = await PathwayModel.find({ userId: req.user!.id })
    .populate('jobId', 'jobTitle companyName workType')
    .select('steps.length totalEstimatedHours completedHours progressPercent generatedAt jobId resumeId')
    .sort({ generatedAt: -1 })
    .lean();

  res.json({ success: true, data: pathways });
});
