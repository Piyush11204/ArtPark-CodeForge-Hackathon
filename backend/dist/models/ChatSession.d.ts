import mongoose, { Document } from 'mongoose';
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
export declare const ChatSessionModel: mongoose.Model<IChatSession, {}, {}, {}, mongoose.Document<unknown, {}, IChatSession, {}, {}> & IChatSession & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ChatSession.d.ts.map