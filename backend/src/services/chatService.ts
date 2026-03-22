/**
 * chatService.ts
 * ─────────────
 * Builds personalised user context from MongoDB and generates chat replies
 * using the pure-TypeScript NLP engine (nlpEngine.ts + chatKnowledge.json).
 *
 * Zero external dependencies — no OpenAI, no Python ML service, no axios.
 * All processing happens in-process: < 20 ms per reply after DB queries.
 */
import { UserModel } from '../models/User';
import { ResumeModel } from '../models/Resume';
import { GapReportModel } from '../models/GapReport';
import { PathwayModel } from '../models/Pathway';
import { JobModel } from '../models/Job';
import { CourseModel } from '../models/Course';
import { classifyIntent, buildReply, searchFAQ, searchSmallTalk } from './nlpEngine';

// ─── Types ───────────────────────────────────────────────────────
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
  pathwaySteps: Array<{ skill: string; priority: string; status: string }>;
  nextSteps: Array<{ skill: string; priority: string }>;
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

// ─── Context Builder ─────────────────────────────────────────────
export async function buildUserContext(userId: string): Promise<UserContext> {
  const [user, resume, gapReport, pathway, totalJobs, totalCourses] = await Promise.all([
    UserModel.findById(userId).select('name email').lean(),
    ResumeModel.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    GapReportModel.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('jobId', 'jobTitle companyName')
      .lean(),
    PathwayModel.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    JobModel.countDocuments({ isActive: true }),
    CourseModel.countDocuments({ isActive: true }),
  ]);

  const gapData = gapReport?.gapReport;
  const jobDoc  = gapReport?.jobId as { jobTitle?: string; companyName?: string } | null;

  const pathwaySteps = (pathway?.steps || []).map((s) => ({
    skill:    s.skill,
    priority: s.priority,
    status:   s.status,
  }));

  const nextSteps = pathwaySteps
    .filter((s) => s.status === 'pending')
    .slice(0, 3)
    .map((s) => ({ skill: s.skill, priority: s.priority }));

  return {
    userName:       user?.name || 'there',
    userEmail:      user?.email || '',
    skills:         resume?.normalizedSkills || [],
    missingSkills:  gapData?.missing   || [],
    partialSkills:  gapData?.partial   || [],
    satisfiedSkills:gapData?.satisfied || [],
    matchScore:     Math.round((gapData?.matchScore || 0) * 100),
    targetJobTitle: jobDoc?.jobTitle   || '',
    targetCompany:  jobDoc?.companyName || '',
    pathwayProgress:pathway?.progressPercent || 0,
    pathwaySteps,
    nextSteps,
    totalJobs,
    totalCourses,
    hasResume:     !!resume,
    hasGapReport:  !!gapReport,
    hasPathway:    !!pathway,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────
// Resolves the last intent from recent history for continuation handling
function extractLastIntent(history: HistoryMessage[]): string | null {
  // Look for the last assistant message that had an intent marker
  // (stored as a comment prefix in the reply — we use a lightweight approach:
  //  just re-classify the last user message before the current one)
  const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg) return null;
  const { tag } = classifyIntent(lastUserMsg.content);
  return tag !== 'general' ? tag : null;
}

export async function generateChatReply(
  userId: string,
  userMessage: string,
  history: HistoryMessage[]
): Promise<ChatEngineResult> {
  // 1. Build user context from DB (all queries run in parallel)
  const ctx = await buildUserContext(userId);

  // 2. Classify intent using pure keyword/phrase NLP
  const { tag: intent, score } = classifyIntent(userMessage);

  // 3. Check small talk first (exact trigger matching, very fast)
  const stReply = searchSmallTalk(userMessage);
  if (stReply) {
    return { reply: stReply, intent: 'small_talk', sources: ['small_talk'] };
  }

  // 4. For general/low-confidence intents, try FAQ search before fallback
  const sources: string[] = ['nlp_engine'];
  if (intent === 'general' || score < 2) {
    const faqReply = searchFAQ(userMessage);
    if (faqReply) {
      return { reply: faqReply, intent: 'faq', sources: ['faq_kb'] };
    }
  }

  // 5. Determine last intent for continuation handling
  const lastIntent = intent === 'continuation' ? extractLastIntent(history) : null;

  // 6. Build contextual reply using the resolved intent + user DB data
  const reply = buildReply(intent, ctx, userMessage, lastIntent);

  return { reply, intent, sources };
}

export function buildContextSnapshot(ctx: UserContext) {
  return {
    resumeSkills:     ctx.skills.slice(0, 20),
    topMissingSkills: ctx.missingSkills.slice(0, 10),
    activeJobTitle:   ctx.targetJobTitle,
  };
}


