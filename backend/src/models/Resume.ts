import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkExperience {
  company: string;
  position: string;
  duration: string;
  description: string;
  start_date?: string;
  end_date?: string;
  location?: string;
}

export interface IEducation {
  degree: string;
  institution: string;
  year?: string;
  gpa?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
}

export interface ICertification {
  name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface IProject {
  project_name: string;
  description: string;
  technologies_used?: string[];
  github_url?: string;
  url?: string;
  start_date?: string;
  end_date?: string;
}

export interface IParsedSkills {
  technical_skills: string[];
  soft_skills: string[];
  frameworks: string[];
  databases: string[];
  languages: string[];
  tools_and_technologies: string[];
}

export interface IPersonalInfo {
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  location?: string | Record<string, string>;
  linkedin?: string;
  github?: string;
  portfolio_website?: string;
  other_links?: string[];
}

export interface IParsedData {
  personal_information: IPersonalInfo;
  professional_summary: string;
  work_experience: IWorkExperience[];
  education: IEducation[];
  skills: IParsedSkills;
  certifications: ICertification[];
  projects: IProject[];
  metadata: {
    filename: string;
    parsed_at: string;
    parser_version: string;
    openai_used: boolean;
    text_length: number;
  };
}

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  originalFilename: string;
  parsedData: IParsedData;
  normalizedSkills: string[];
  parserVersion: string;
  parsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    originalFilename: { type: String, required: true },
    parsedData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    normalizedSkills: { type: [String], default: [] },
    parserVersion: { type: String, default: '' },
    parsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ResumeModel = mongoose.model<IResume>('Resume', ResumeSchema);
