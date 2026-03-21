"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPathways = exports.updateStepStatus = exports.getPathway = exports.generatePathwayHandler = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const GapReport_1 = require("../models/GapReport");
const Pathway_1 = require("../models/Pathway");
const Resume_1 = require("../models/Resume");
const adaptivePathing_1 = require("../services/adaptivePathing");
exports.generatePathwayHandler = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { gapReportId } = req.body;
    const gapReport = await GapReport_1.GapReportModel.findOne({
        _id: gapReportId,
        userId: req.user.id,
    });
    if (!gapReport)
        throw (0, errorHandler_1.createError)('Gap report not found', 404);
    const resume = await Resume_1.ResumeModel.findById(gapReport.resumeId).select('normalizedSkills');
    if (!resume)
        throw (0, errorHandler_1.createError)('Associated resume not found', 404);
    const { steps, totalEstimatedHours } = await (0, adaptivePathing_1.generatePathway)(gapReport.gapReport, resume.normalizedSkills);
    const existing = await Pathway_1.PathwayModel.findOne({ gapReportId });
    let pathway;
    if (existing) {
        existing.steps = steps;
        existing.totalEstimatedHours = totalEstimatedHours;
        existing.completedHours = 0;
        existing.progressPercent = 0;
        existing.generatedAt = new Date();
        pathway = await existing.save();
    }
    else {
        pathway = await Pathway_1.PathwayModel.create({
            userId: req.user.id,
            gapReportId: gapReport._id,
            jobId: gapReport.jobId,
            resumeId: gapReport.resumeId,
            steps,
            totalEstimatedHours,
        });
        await GapReport_1.GapReportModel.findByIdAndUpdate(gapReportId, { pathwayId: pathway._id });
    }
    res.status(201).json({
        success: true,
        message: 'Learning pathway generated',
        data: pathway,
    });
});
exports.getPathway = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const pathway = await Pathway_1.PathwayModel.findOne({
        _id: req.params.id,
        userId: req.user.id,
    })
        .populate('jobId', 'jobTitle companyName workType')
        .populate('resumeId', 'originalFilename parsedAt')
        .select('-__v')
        .lean();
    if (!pathway)
        throw (0, errorHandler_1.createError)('Pathway not found', 404);
    res.json({ success: true, data: pathway });
});
exports.updateStepStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { pathwayId, stepId } = req.params;
    const { status } = req.body;
    if (!['pending', 'in-progress', 'completed'].includes(status)) {
        throw (0, errorHandler_1.createError)('Invalid status value', 400);
    }
    const pathway = await Pathway_1.PathwayModel.findOne({
        _id: pathwayId,
        userId: req.user.id,
    });
    if (!pathway)
        throw (0, errorHandler_1.createError)('Pathway not found', 404);
    const step = pathway.steps.find((s) => String(s._id) === stepId);
    if (!step)
        throw (0, errorHandler_1.createError)('Step not found', 404);
    const wasCompleted = step.status === 'completed';
    step.status = status;
    if (status === 'completed' && !wasCompleted) {
        step.completedAt = new Date();
    }
    else if (status !== 'completed') {
        step.completedAt = undefined;
    }
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
exports.getMyPathways = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const pathways = await Pathway_1.PathwayModel.find({ userId: req.user.id })
        .populate('jobId', 'jobTitle companyName workType')
        .select('steps.length totalEstimatedHours completedHours progressPercent generatedAt jobId resumeId')
        .sort({ generatedAt: -1 })
        .lean();
    res.json({ success: true, data: pathways });
});
//# sourceMappingURL=pathwayController.js.map