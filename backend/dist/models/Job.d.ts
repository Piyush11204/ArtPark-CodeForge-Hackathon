import mongoose, { Document } from 'mongoose';
export interface ISalaryRange {
    min: number | null;
    max: number | null;
    currency: string;
}
export interface IJob extends Document {
    externalId: string;
    jobTitle: string;
    companyName: string;
    companySlug: string;
    companyIconUrl?: string;
    jobDescription: string;
    jobDescriptionRaw: string;
    jobType: string;
    workType: string;
    locationType: string;
    jobLocation: string;
    jobLink: string;
    ats?: string;
    requiredSkills: string[];
    preferredSkills: string[];
    requiredExperience: number | null;
    salaryRange: ISalaryRange;
    jobCategory?: string;
    isActive: boolean;
    skillsExtracted: boolean;
    postedAt: Date | null;
    closingDate: Date | null;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const JobModel: mongoose.Model<IJob, {}, {}, {}, mongoose.Document<unknown, {}, IJob, {}, {}> & IJob & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Job.d.ts.map