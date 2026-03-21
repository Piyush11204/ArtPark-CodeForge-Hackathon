import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ResumeModel } from '../models/Resume';
import { parseResumeFromBuffer } from '../services/resumeParser';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService';
import { extractSkillsFromParsedData } from '../services/gapEngine';

export const uploadResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  const { buffer, originalname, mimetype } = req.file;

  // 1. Upload to Cloudinary
  const cloudinaryResult = await uploadToCloudinary(buffer, originalname);

  // 2. Parse resume via live API
  const parsedData = await parseResumeFromBuffer(buffer, originalname, mimetype);

  // 3. Extract normalized skills
  const normalizedSkills = extractSkillsFromParsedData(parsedData);

  // 4. Save to DB
  const resume = await ResumeModel.create({
    userId: req.user!.id,
    cloudinaryUrl: cloudinaryResult.secure_url,
    cloudinaryPublicId: cloudinaryResult.public_id,
    originalFilename: originalname,
    parsedData,
    normalizedSkills,
    parserVersion: parsedData.metadata?.parser_version || '',
    parsedAt: new Date(),
  });

  res.status(201).json({
    success: true,
    message: 'Resume uploaded and parsed',
    data: {
      resumeId: resume._id,
      normalizedSkills,
      parsedData,
    },
  });
});

export const getMyResumes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resumes = await ResumeModel.find({ userId: req.user!.id })
    .select('-parsedData.metadata -__v')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: resumes });
});

export const getResumeById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resume = await ResumeModel.findOne({
    _id: req.params.id,
    userId: req.user!.id,
  }).select('-__v').lean();

  if (!resume) throw createError('Resume not found', 404);
  res.json({ success: true, data: resume });
});

export const deleteResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resume = await ResumeModel.findOne({
    _id: req.params.id,
    userId: req.user!.id,
  });

  if (!resume) throw createError('Resume not found', 404);

  // Delete from Cloudinary
  await deleteFromCloudinary(resume.cloudinaryPublicId);

  await resume.deleteOne();

  res.json({ success: true, message: 'Resume deleted' });
});
