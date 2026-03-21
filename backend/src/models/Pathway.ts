import mongoose, { Document, Schema } from 'mongoose';

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

const PathwayStepSchema = new Schema<IPathwayStep>(
  {
    order: { type: Number, required: true },
    skill: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    courseTitle: { type: String },
    courseProvider: { type: String },
    resourceUrl: { type: String },
    reason: { type: String, required: true },
    estimatedHours: { type: Number, default: 5 },
    priority: {
      type: String,
      enum: ['critical', 'recommended', 'optional'],
      default: 'recommended',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    completedAt: { type: Date },
  },
  { _id: true }
);

const PathwaySchema = new Schema<IPathway>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gapReportId: { type: Schema.Types.ObjectId, ref: 'GapReport', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
    steps: { type: [PathwayStepSchema], default: [] },
    totalEstimatedHours: { type: Number, default: 0 },
    completedHours: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PathwayModel = mongoose.model<IPathway>('Pathway', PathwaySchema);
