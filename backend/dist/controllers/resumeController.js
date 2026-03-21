"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResume = exports.updateParsedData = exports.getResumeById = exports.getMyResumes = exports.uploadResume = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const Resume_1 = require("../models/Resume");
const resumeParser_1 = require("../services/resumeParser");
const cloudinaryService_1 = require("../services/cloudinaryService");
const gapEngine_1 = require("../services/gapEngine");
exports.uploadResume = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        throw (0, errorHandler_1.createError)('No file uploaded', 400);
    }
    const { buffer, originalname, mimetype } = req.file;
    const cloudinaryResult = await (0, cloudinaryService_1.uploadToCloudinary)(buffer, originalname);
    const parsedData = await (0, resumeParser_1.parseResumeFromBuffer)(buffer, originalname, mimetype);
    const normalizedSkills = (0, gapEngine_1.extractSkillsFromParsedData)(parsedData);
    const resume = await Resume_1.ResumeModel.create({
        userId: req.user.id,
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
exports.getMyResumes = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const resumes = await Resume_1.ResumeModel.find({ userId: req.user.id })
        .select('-parsedData.metadata -__v')
        .sort({ createdAt: -1 })
        .lean();
    res.json({ success: true, data: resumes });
});
exports.getResumeById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const resume = await Resume_1.ResumeModel.findOne({
        _id: req.params.id,
        userId: req.user.id,
    }).select('-__v').lean();
    if (!resume)
        throw (0, errorHandler_1.createError)('Resume not found', 404);
    res.json({ success: true, data: resume });
});
exports.updateParsedData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const resume = await Resume_1.ResumeModel.findOne({
        _id: req.params.id,
        userId: req.user.id,
    });
    if (!resume)
        throw (0, errorHandler_1.createError)('Resume not found', 404);
    const { parsedData } = req.body;
    if (!parsedData)
        throw (0, errorHandler_1.createError)('parsedData is required', 400);
    const normalizedSkills = (0, gapEngine_1.extractSkillsFromParsedData)(parsedData);
    resume.parsedData = parsedData;
    resume.normalizedSkills = normalizedSkills;
    await resume.save();
    res.json({
        success: true,
        data: {
            resumeId: resume._id,
            normalizedSkills,
            parsedData: resume.parsedData,
        },
    });
});
exports.deleteResume = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const resume = await Resume_1.ResumeModel.findOne({
        _id: req.params.id,
        userId: req.user.id,
    });
    if (!resume)
        throw (0, errorHandler_1.createError)('Resume not found', 404);
    await (0, cloudinaryService_1.deleteFromCloudinary)(resume.cloudinaryPublicId);
    await resume.deleteOne();
    res.json({ success: true, message: 'Resume deleted' });
});
//# sourceMappingURL=resumeController.js.map