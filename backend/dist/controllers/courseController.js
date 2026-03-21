"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourses = getCourses;
exports.getCoursesBySkill = getCoursesBySkill;
exports.getCourseCategories = getCourseCategories;
exports.getCourseById = getCourseById;
const Course_1 = require("../models/Course");
async function getCourses(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = { isActive: true };
        if (req.query.skill) {
            filter.skill = req.query.skill.toLowerCase();
        }
        if (req.query.level) {
            const allowed = ['beginner', 'intermediate', 'advanced'];
            if (allowed.includes(req.query.level)) {
                filter.level = req.query.level;
            }
        }
        if (req.query.category) {
            filter.skillCategory = req.query.category;
        }
        if (req.query.q) {
            const q = req.query.q;
            filter['$or'] = [
                { title: { $regex: q, $options: 'i' } },
                { skill: { $regex: q, $options: 'i' } },
                { tags: { $elemMatch: { $regex: q, $options: 'i' } } },
                { provider: { $regex: q, $options: 'i' } },
            ];
        }
        const [courses, total] = await Promise.all([
            Course_1.CourseModel.find(filter)
                .sort({ skillCategory: 1, level: 1, title: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Course_1.CourseModel.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: courses,
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
async function getCoursesBySkill(req, res, next) {
    try {
        const skill = req.params.skill.toLowerCase();
        const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        const courses = await Course_1.CourseModel.find({ skill, isActive: true }).lean();
        courses.sort((a, b) => (levelOrder[a.level] ?? 1) - (levelOrder[b.level] ?? 1));
        res.json({ success: true, data: courses });
    }
    catch (err) {
        next(err);
    }
}
async function getCourseCategories(_req, res, next) {
    try {
        const categories = await Course_1.CourseModel.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$skillCategory', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        res.json({ success: true, data: categories });
    }
    catch (err) {
        next(err);
    }
}
async function getCourseById(req, res, next) {
    try {
        const course = await Course_1.CourseModel.findById(req.params.id).lean();
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        res.json({ success: true, data: course });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=courseController.js.map