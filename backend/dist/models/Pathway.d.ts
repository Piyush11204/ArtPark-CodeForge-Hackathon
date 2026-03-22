import mongoose, { Document } from 'mongoose';
export interface IPathwayStep {
    order: number;
    skill: string;
    courseId?: mongoose.Types.ObjectId;
    courseTitle?: string;
    courseProvider?: string;
    resourceUrl?: string;
    reason: string;
    estimatedHours: number;
    priority: 'critical' | 'recommended' | 'optional';
    status: 'pending' | 'in-progress' | 'completed';
    completedAt?: Date;
}
export interface IPathway extends Document {
    userId: mongoose.Types.ObjectId;
    gapReportId: mongoose.Types.ObjectId;
    jobId: mongoose.Types.ObjectId;
    resumeId: mongoose.Types.ObjectId;
    steps: IPathwayStep[];
    totalEstimatedHours: number;
    completedHours: number;
    progressPercent: number;
    generatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PathwayModel: mongoose.Model<IPathway, {}, {}, {}, mongoose.Document<unknown, {}, IPathway, {}, {}> & IPathway & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Pathway.d.ts.map