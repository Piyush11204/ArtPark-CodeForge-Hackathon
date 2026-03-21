"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobCategories = exports.getJobById = exports.searchJobs = exports.getJobs = void 0;
const Job_1 = require("../models/Job");
const errorHandler_1 = require("../middleware/errorHandler");
exports.getJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = { isActive: true };
    if (req.query.workType)
        filter.workType = req.query.workType;
    if (req.query.jobType)
        filter.jobType = req.query.jobType;
    if (req.query.company)
        filter.companySlug = req.query.company;
    const [jobs, total] = await Promise.all([
        Job_1.JobModel.find(filter)
            .select('-jobDescriptionRaw -__v')
            .sort({ postedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Job_1.JobModel.countDocuments(filter),
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
exports.searchJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const q = req.query.q?.trim();
    if (!q) {
        throw (0, errorHandler_1.createError)('Search query "q" is required', 400);
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = {
        isActive: true,
        $text: { $search: q },
    };
    const [jobs, total] = await Promise.all([
        Job_1.JobModel.find(filter, { score: { $meta: 'textScore' } })
            .select('-jobDescriptionRaw -__v')
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .lean(),
        Job_1.JobModel.countDocuments(filter),
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
exports.getJobById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await Job_1.JobModel.findById(req.params.id).select('-jobDescriptionRaw -__v').lean();
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    Job_1.JobModel.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();
    res.json({ success: true, data: job });
});
exports.getJobCategories = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const [companies, jobTypes, workTypes, locations] = await Promise.all([
        Job_1.JobModel.distinct('companyName', { isActive: true }),
        Job_1.JobModel.distinct('jobType', { isActive: true }),
        Job_1.JobModel.distinct('workType', { isActive: true }),
        Job_1.JobModel.distinct('jobLocation', { isActive: true }),
    ]);
    res.json({
        success: true,
        data: { companies: companies.slice(0, 100), jobTypes, workTypes, locations: locations.slice(0, 100) },
    });
});
//# sourceMappingURL=jobController.js.map