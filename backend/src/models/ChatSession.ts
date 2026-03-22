import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  sources?: string[];
  timestamp: Date;
}

export interface IContextSnapshot {
  resumeSkills: string[];
  topMissingSkills: string[];
  activeJobTitle: string;
}

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  title: string;
  messages: IChatMessage[];
  contextSnapshot: IContextSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    intent: { type: String },
    sources: { type: [String], default: [] },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'New Chat', maxlength: 120 },
    messages: { type: [ChatMessageSchema], default: [] },
    contextSnapshot: {
      resumeSkills: { type: [String], default: [] },
      topMissingSkills: { type: [String], default: [] },
      activeJobTitle: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Keep sessions trimmed — max 200 messages; enforce in service layer
ChatSessionSchema.index({ userId: 1, createdAt: -1 });

export const ChatSessionModel = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
