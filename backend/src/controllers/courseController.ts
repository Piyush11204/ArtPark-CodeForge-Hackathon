import { Request, Response, NextFunction } from 'express';
import { CourseModel } from '../models/Course';

/** GET /api/courses
 *  Query: skill, level, category, q (search), page, limit
 */
export async function getCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip  = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };

    if (req.query.skill) {
      filter.skill = (req.query.skill as string).toLowerCase();
    }
    if (req.query.level) {
      const allowed = ['beginner', 'intermediate', 'advanced'];
      if (allowed.includes(req.query.level as string)) {
        filter.level = req.query.level;
      }
    }
    if (req.query.category) {
      filter.skillCategory = req.query.category;
    }
    if (req.query.q) {
      const q = req.query.q as string;
      filter['$or'] = [
        { title:    { $regex: q, $options: 'i' } },
        { skill:    { $regex: q, $options: 'i' } },
        { tags:     { $elemMatch: { $regex: q, $options: 'i' } } },
        { provider: { $regex: q, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      CourseModel.find(filter)
        .sort({ skillCategory: 1, level: 1, title: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseModel.countDocuments(filter),
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
  } catch (err) {
    next(err);
  }
}

/** GET /api/courses/skill/:skill
 *  Returns all courses for a specific skill, sorted beginner → advanced
 */
export async function getCoursesBySkill(req: Request, res: Response, next: NextFunction) {
  try {
    const skill = req.params.skill.toLowerCase();
    const levelOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

    const courses = await CourseModel.find({ skill, isActive: true }).lean();
    courses.sort((a, b) => (levelOrder[a.level] ?? 1) - (levelOrder[b.level] ?? 1));

    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
}

/** GET /api/courses/categories
 *  Returns all distinct skillCategory values with counts
 */
export async function getCourseCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await CourseModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$skillCategory', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

/** GET /api/courses/:id */
export async function getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await CourseModel.findById(req.params.id).lean();
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}
