import mongoose, { Document } from 'mongoose';
export interface IGapDetail {
    missing: string[];
    partial: string[];
    satisfied: string[];
    transferable: string[];
    gapScore: number;
    matchScore: number;
    totalRequired: number;
    totalCandidate: number;
}
export interface IGapReport extends Document {
    userId: mongoose.Types.ObjectId;
    resumeId: mongoose.Types.ObjectId;
    jobId: mongoose.Types.ObjectId;
    gapReport: IGapDetail;
    pathwayId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const GapReportModel: mongoose.Model<IGapReport, {}, {}, {}, mongoose.Document<unknown, {}, IGapReport, {}, {}> & IGapReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=GapReport.d.ts.map