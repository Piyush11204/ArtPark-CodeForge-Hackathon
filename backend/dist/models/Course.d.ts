import mongoose, { Document } from 'mongoose';
export interface ICourse extends Document {
    title: string;
    skill: string;
    skillCategory: 'language' | 'framework' | 'database' | 'tool' | 'cloud' | 'ai_ml' | 'soft_skill' | 'other';
    prerequisites: string[];
    estimatedHours: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    resourceUrl: string;
    provider: string;
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CourseModel: mongoose.Model<ICourse, {}, {}, {}, mongoose.Document<unknown, {}, ICourse, {}, {}> & ICourse & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Course.d.ts.map