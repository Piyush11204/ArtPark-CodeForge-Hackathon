import mongoose, { Document, Schema } from 'mongoose';

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

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    skill: { type: String, required: true, lowercase: true, trim: true, index: true },
    skillCategory: {
      type: String,
      enum: ['language', 'framework', 'database', 'tool', 'cloud', 'ai_ml', 'soft_skill', 'other'],
      default: 'other',
    },
    prerequisites: { type: [String], default: [] },
    estimatedHours: { type: Number, default: 5 },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    resourceUrl: { type: String, required: true },
    provider: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CourseSchema.index({ skill: 1, level: 1 });

export const CourseModel = mongoose.model<ICourse>('Course', CourseSchema);
