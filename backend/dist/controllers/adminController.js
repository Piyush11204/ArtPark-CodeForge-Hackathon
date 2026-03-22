"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCourses = exports.toggleCourseActive = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getAllJobs = exports.toggleJobActive = exports.deleteJob = exports.updateJob = exports.createJob = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.getStats = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const User_1 = require("../models/User");
const Job_1 = require("../models/Job");
const Course_1 = require("../models/Course");
const Resume_1 = require("../models/Resume");
const GapReport_1 = require("../models/GapReport");
const Pathway_1 = require("../models/Pathway");
exports.getStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const [totalUsers, activeUsers, totalJobs, activeJobs, totalCourses, totalResumes, totalGapReports, totalPathways,] = await Promise.all([
        User_1.UserModel.countDocuments(),
        User_1.UserModel.countDocuments({ isActive: true }),
        Job_1.JobModel.countDocuments(),
        Job_1.JobModel.countDocuments({ isActive: true }),
        Course_1.CourseModel.countDocuments({ isActive: true }),
        Resume_1.ResumeModel.countDocuments(),
        GapReport_1.GapReportModel.countDocuments(),
        Pathway_1.PathwayModel.countDocuments(),
    ]);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const signupTrend = await User_1.UserModel.aggregate([
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
    const roleDistribution = await User_1.UserModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $project: { role: '$_id', count: 1, _id: 0 } },
    ]);
    const topSkills = await Job_1.JobModel.aggregate([
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
exports.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.role)
        filter.role = req.query.role;
    if (req.query.isActive !== undefined)
        filter.isActive = req.query.isActive === 'true';
    if (req.query.q) {
        const q = req.query.q;
        filter['$or'] = [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
        ];
    }
    const [users, total] = await Promise.all([
        User_1.UserModel.find(filter)
            .select('-passwordHash -refreshToken')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User_1.UserModel.countDocuments(filter),
    ]);
    res.json({
        success: true,
        data: {
            users,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        },
    });
});
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await User_1.UserModel.findById(req.params.id)
        .select('-passwordHash -refreshToken')
        .lean();
    if (!user)
        throw (0, errorHandler_1.createError)('User not found', 404);
    const [resumes, gapReports, pathways] = await Promise.all([
        Resume_1.ResumeModel.countDocuments({ userId: req.params.id }),
        GapReport_1.GapReportModel.countDocuments({ userId: req.params.id }),
        Pathway_1.PathwayModel.countDocuments({ userId: req.params.id }),
    ]);
    res.json({
        success: true,
        data: { user, stats: { resumes, gapReports, pathways } },
    });
});
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { role, isActive, name } = req.body;
    const allowedUpdates = {};
    if (role !== undefined) {
        if (!['candidate', 'admin'].includes(role))
            throw (0, errorHandler_1.createError)('Invalid role', 400);
        allowedUpdates.role = role;
    }
    if (isActive !== undefined)
        allowedUpdates.isActive = Boolean(isActive);
    if (name !== undefined)
        allowedUpdates.name = name;
    if (Object.keys(allowedUpdates).length === 0) {
        throw (0, errorHandler_1.createError)('No valid fields to update', 400);
    }
    if (req.user?.id === req.params.id && allowedUpdates.role === 'candidate') {
        throw (0, errorHandler_1.createError)('Cannot remove your own admin role', 400);
    }
    const user = await User_1.UserModel.findByIdAndUpdate(req.params.id, { $set: allowedUpdates }, { new: true, select: '-passwordHash -refreshToken' });
    if (!user)
        throw (0, errorHandler_1.createError)('User not found', 404);
    res.json({ success: true, data: { user } });
});
exports.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.id === req.params.id) {
        throw (0, errorHandler_1.createError)('Cannot delete your own account via admin panel', 400);
    }
    const user = await User_1.UserModel.findByIdAndDelete(req.params.id);
    if (!user)
        throw (0, errorHandler_1.createError)('User not found', 404);
    res.json({ success: true, message: 'User deleted successfully' });
});
exports.createJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { jobTitle, companyName, companySlug, jobDescription, jobType, workType, locationType, jobLocation, jobLink, requiredSkills, preferredSkills, requiredExperience, salaryRange, jobCategory, } = req.body;
    if (!jobTitle || !companyName || !jobDescription || !jobLink) {
        throw (0, errorHandler_1.createError)('jobTitle, companyName, jobDescription, and jobLink are required', 400);
    }
    const externalId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job = await Job_1.JobModel.create({
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
exports.updateJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const allowed = [
        'jobTitle', 'companyName', 'companySlug', 'jobDescription', 'jobType',
        'workType', 'locationType', 'jobLocation', 'jobLink', 'requiredSkills',
        'preferredSkills', 'requiredExperience', 'salaryRange', 'jobCategory',
        'isActive', 'closingDate',
    ];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined)
            updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0)
        throw (0, errorHandler_1.createError)('No valid fields to update', 400);
    const job = await Job_1.JobModel.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    res.json({ success: true, data: { job } });
});
exports.deleteJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await Job_1.JobModel.findByIdAndDelete(req.params.id);
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    res.json({ success: true, message: 'Job deleted successfully' });
});
exports.toggleJobActive = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await Job_1.JobModel.findById(req.params.id);
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    job.isActive = !job.isActive;
    await job.save();
    res.json({ success: true, data: { job, isActive: job.isActive } });
});
exports.getAllJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.isActive !== undefined)
        filter.isActive = req.query.isActive === 'true';
    if (req.query.q) {
        const q = req.query.q;
        filter['$or'] = [
            { jobTitle: { $regex: q, $options: 'i' } },
            { companyName: { $regex: q, $options: 'i' } },
        ];
    }
    const [jobs, total] = await Promise.all([
        Job_1.JobModel.find(filter)
            .select('-jobDescriptionRaw -__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Job_1.JobModel.countDocuments(filter),
    ]);
    res.json({
        success: true,
        data: { jobs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
    });
});
exports.createCourse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { title, skill, skillCategory, prerequisites, estimatedHours, level, resourceUrl, provider, tags } = req.body;
    if (!title || !skill || !resourceUrl || !provider) {
        throw (0, errorHandler_1.createError)('title, skill, resourceUrl, and provider are required', 400);
    }
    const course = await Course_1.CourseModel.create({
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
exports.updateCourse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const allowed = [
        'title', 'skill', 'skillCategory', 'prerequisites', 'estimatedHours',
        'level', 'resourceUrl', 'provider', 'tags', 'isActive',
    ];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined)
            updates[key] = req.body[key];
    }
    if (updates.skill)
        updates.skill = updates.skill.toLowerCase();
    if (Object.keys(updates).length === 0)
        throw (0, errorHandler_1.createError)('No valid fields to update', 400);
    const course = await Course_1.CourseModel.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!course)
        throw (0, errorHandler_1.createError)('Course not found', 404);
    res.json({ success: true, data: { course } });
});
exports.deleteCourse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const course = await Course_1.CourseModel.findByIdAndDelete(req.params.id);
    if (!course)
        throw (0, errorHandler_1.createError)('Course not found', 404);
    res.json({ success: true, message: 'Course deleted successfully' });
});
exports.toggleCourseActive = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const course = await Course_1.CourseModel.findById(req.params.id);
    if (!course)
        throw (0, errorHandler_1.createError)('Course not found', 404);
    course.isActive = !course.isActive;
    await course.save();
    res.json({ success: true, data: { course, isActive: course.isActive } });
});
exports.getAllCourses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.isActive !== undefined)
        filter.isActive = req.query.isActive === 'true';
    if (req.query.q) {
        const q = req.query.q;
        filter['$or'] = [
            { title: { $regex: q, $options: 'i' } },
            { skill: { $regex: q, $options: 'i' } },
            { provider: { $regex: q, $options: 'i' } },
        ];
    }
    const [courses, total] = await Promise.all([
        Course_1.CourseModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Course_1.CourseModel.countDocuments(filter),
    ]);
    res.json({
        success: true,
        data: { courses, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
    });
});
//# sourceMappingURL=adminController.js.map