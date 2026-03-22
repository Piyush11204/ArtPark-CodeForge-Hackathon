"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGapHistory = exports.getGapReport = exports.analyzeGap = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const Resume_1 = require("../models/Resume");
const Job_1 = require("../models/Job");
const GapReport_1 = require("../models/GapReport");
const gapEngine_1 = require("../services/gapEngine");
exports.analyzeGap = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { resumeId, jobId } = req.body;
    const resume = await Resume_1.ResumeModel.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume)
        throw (0, errorHandler_1.createError)('Resume not found', 404);
    const job = await Job_1.JobModel.findById(jobId);
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    const gapDetail = await (0, gapEngine_1.computeGap)(resume.normalizedSkills, job);
    const gapReport = await GapReport_1.GapReportModel.create({
        userId: req.user.id,
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
exports.getGapReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const report = await GapReport_1.GapReportModel.findOne({
        _id: req.params.id,
        userId: req.user.id,
    })
        .populate('jobId', 'jobTitle companyName workType jobType')
        .populate('resumeId', 'originalFilename parsedAt')
        .select('-__v')
        .lean();
    if (!report)
        throw (0, errorHandler_1.createError)('Gap report not found', 404);
    res.json({ success: true, data: report });
});
exports.getGapHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
        GapReport_1.GapReportModel.find({ userId: req.user.id })
            .populate('jobId', 'jobTitle companyName workType')
            .populate('resumeId', 'originalFilename parsedAt')
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        GapReport_1.GapReportModel.countDocuments({ userId: req.user.id }),
    ]);
    res.json({
        success: true,
        data: { reports, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
    });
});
//# sourceMappingURL=gapController.js.map