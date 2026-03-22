export interface UserContext {
    userName: string;
    userEmail: string;
    skills: string[];
    missingSkills: string[];
    partialSkills: string[];
    satisfiedSkills: string[];
    matchScore: number;
    targetJobTitle: string;
    targetCompany: string;
    pathwayProgress: number;
    pathwaySteps: Array<{
        skill: string;
        priority: string;
        status: string;
    }>;
    nextSteps: Array<{
        skill: string;
        priority: string;
    }>;
    totalJobs: number;
    totalCourses: number;
    hasResume: boolean;
    hasGapReport: boolean;
    hasPathway: boolean;
}
export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface ChatEngineResult {
    reply: string;
    intent: string;
    sources: string[];
}
export declare function buildUserContext(userId: string): Promise<UserContext>;
export declare function generateChatReply(userId: string, userMessage: string, history: HistoryMessage[]): Promise<ChatEngineResult>;
export declare function buildContextSnapshot(ctx: UserContext): {
    resumeSkills: string[];
    topMissingSkills: string[];
    activeJobTitle: string;
};
//# sourceMappingURL=chatService.d.ts.map