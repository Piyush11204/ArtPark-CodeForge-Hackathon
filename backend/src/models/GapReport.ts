import mongoose, { Document, Schema } from 'mongoose';

export interface IGapDetail {
  missing: string[];
  partial: string[];
  satisfied: string[];
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

const GapReportSchema = new Schema<IGapReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    gapReport: {
      missing: { type: [String], default: [] },
      partial: { type: [String], default: [] },
      satisfied: { type: [String], default: [] },
      gapScore: { type: Number, default: 0 },
      matchScore: { type: Number, default: 0 },
      totalRequired: { type: Number, default: 0 },
      totalCandidate: { type: Number, default: 0 },
    },
    pathwayId: { type: Schema.Types.ObjectId, ref: 'Pathway' },
  },
  { timestamps: true }
);

export const GapReportModel = mongoose.model<IGapReport>('GapReport', GapReportSchema);
