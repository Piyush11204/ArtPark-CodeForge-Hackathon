import mongoose, { Document, Schema } from 'mongoose';

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

const JobSchema = new Schema<IJob>(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    jobTitle: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    companySlug: { type: String, trim: true, index: true },
    companyIconUrl: { type: String },
    jobDescription: { type: String, default: '' }, // HTML stripped
    jobDescriptionRaw: { type: String, default: '' }, // Original HTML
    jobType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE', 'OTHER'],
      default: 'OTHER',
    },
    workType: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      default: 'onsite',
      index: true,
    },
    locationType: { type: String, default: 'onsite' },
    jobLocation: { type: String, default: '' },
    jobLink: { type: String, required: true },
    ats: { type: String },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    requiredExperience: { type: Number, default: null },
    salaryRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: 'USD' },
    },
    jobCategory: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    skillsExtracted: { type: Boolean, default: false },
    postedAt: { type: Date, default: null },
    closingDate: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Full-text search index
JobSchema.index({ jobTitle: 'text', jobDescription: 'text', companyName: 'text' });
// Compound filter index
JobSchema.index({ workType: 1, jobType: 1, isActive: 1 });

export const JobModel = mongoose.model<IJob>('Job', JobSchema);
