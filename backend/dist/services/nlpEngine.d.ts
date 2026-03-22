import type { UserContext } from './chatService';
export interface ClassifyResult {
    tag: string;
    score: number;
}
export declare function classifyIntent(message: string): ClassifyResult;
export declare function searchFAQ(message: string): string | null;
export declare function searchSmallTalk(message: string): string | null;
export declare function buildReply(intent: string, ctx: UserContext, message: string, lastIntent: string | null): string;
//# sourceMappingURL=nlpEngine.d.ts.map