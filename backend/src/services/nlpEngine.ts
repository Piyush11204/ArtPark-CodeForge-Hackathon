/**
 * nlpEngine.ts
 * ────────────
 * Pure TypeScript NLP engine — zero external dependencies, zero API calls.
 *
 * Pipeline:
 *   1. normalize(message)        — lowercase, strip punctuation
 *   2. tokenize(message)         — split into word tokens
 *   3. classifyIntent()          — keyword + phrase weighted scoring
 *   4. searchFAQ()               — FAQ knowledge base lookup
 *   5. searchSmallTalk()         — small talk response lookup
 *   6. buildReply()              — context-aware response assembly
 */

import knowledge from '../config/chatKnowledge.json';
import type { UserContext } from './chatService';

// ─── Types mirroring the JSON schema ─────────────────────────────
interface IntentDef {
  tag: string;
  keywords: string[];
  phrases: string[];
  weight: number;
}

interface FaqEntry {
  id: string;
  keywords: string[];
  phrases: string[];
  answer: string;
}

interface SmallTalkEntry {
  triggers: string[];
  response: string;
}

// ─── Pre-load knowledge at module level (once) ────────────────────
const INTENTS  = knowledge.intents as IntentDef[];
const FAQ      = knowledge.faq as FaqEntry[];
const SMALLTALK = knowledge.smallTalk as SmallTalkEntry[];
const RESPONSES = knowledge.responses as Record<string, string>;

// ─── 1. Text normalisation ────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")        // smart quotes → straight
    .replace(/[^\w\s']/g, ' ')   // strip punctuation (keep apostrophes)
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter((t) => t.length >= 2);
}

// ─── 2. Intent classification ────────────────────────────────────
//  Score = Σ(phrase hits × 3) + Σ(keyword hits × 1), multiplied by weight
//  Threshold: raw score ≥ 1 (at least one keyword)
// ─────────────────────────────────────────────────────────────────

export interface ClassifyResult {
  tag: string;
  score: number;
}

export function classifyIntent(message: string): ClassifyResult {
  const norm   = normalize(message);
  const tokens = new Set(tokenize(message));

  let best: ClassifyResult = { tag: 'general', score: 0 };

  for (const intent of INTENTS) {
    let score = 0;

    // Phrase matches — high signal (3 points each)
    for (const phrase of intent.phrases) {
      if (norm.includes(phrase)) score += 3;
    }

    // Keyword matches — medium signal (1 point each)
    for (const kw of intent.keywords) {
      if (tokens.has(kw)) score += 1;
    }

    score *= (intent.weight ?? 1.0);

    if (score > best.score) {
      best = { tag: intent.tag, score };
    }
  }

  // Minimum threshold: at least 1 point
  if (best.score < 1) best.tag = 'general';

  return best;
}

// ─── 3. FAQ search ────────────────────────────────────────────────
//  Same approach: phrase (3pt) + keyword (1pt) scoring; threshold = 2

export function searchFAQ(message: string): string | null {
  const norm   = normalize(message);
  const tokens = new Set(tokenize(message));

  let bestScore = 0;
  let bestAnswer: string | null = null;

  for (const entry of FAQ) {
    let score = 0;
    for (const phrase of entry.phrases) {
      if (norm.includes(phrase)) score += 3;
    }
    for (const kw of entry.keywords) {
      if (tokens.has(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = entry.answer;
    }
  }

  return bestScore >= 2 ? bestAnswer : null;
}

// ─── 4. Small talk search ─────────────────────────────────────────

export function searchSmallTalk(message: string): string | null {
  const norm = normalize(message);
  for (const entry of SMALLTALK) {
    for (const trigger of entry.triggers) {
      if (norm.includes(normalize(trigger))) return entry.response;
    }
  }
  return null;
}

// ─── 5. Template slot filler ─────────────────────────────────────
//  Replaces {{varName}} placeholders in response templates with real values

function fill(template: string, slots: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(slots[key] ?? ''));
}

// ─── 6. Response builder ─────────────────────────────────────────
//  Selects the right response template based on intent + user context,
//  fills in slots, and returns the final reply string.

export function buildReply(
  intent: string,
  ctx: UserContext,
  message: string,
  lastIntent: string | null
): string {
  const firstName = ctx.userName.split(' ')[0] || ctx.userName;

  // ── Common slot helpers ──────────────────────────────────────
  const skillsList = ctx.skills.length
    ? ctx.skills.slice(0, 12).map((s) => `\`${s}\``).join(', ')
    : '';
  const moreText = ctx.skills.length > 12 ? ` …and ${ctx.skills.length - 12} more` : '';
  const jobLine  = ctx.targetJobTitle ? ` for **${ctx.targetJobTitle}**${ctx.targetCompany ? ` at ${ctx.targetCompany}` : ''}` : '';
  const matchLine = ctx.hasGapReport
    ? `Your match score for **${ctx.targetJobTitle || 'your target job'}**: **${ctx.matchScore}%**`
    : 'Run a gap analysis to see your job match score.';

  const missingList  = ctx.missingSkills.slice(0, 8).map((s) => `\`${s}\``).join(', ') || 'none';
  const partialList  = ctx.partialSkills.slice(0, 8).map((s) => `\`${s}\``).join(', ') || 'none';
  const satisfiedList = ctx.satisfiedSkills.slice(0, 6).map((s) => `\`${s}\``).join(', ') || 'none';

  const pathwayLine = ctx.hasPathway
    ? `Your pathway is **${ctx.pathwayProgress}% complete** — keep going!`
    : 'Generate a pathway to get your personalised learning plan.';

  const nextSkill    = ctx.nextSteps[0]?.skill || '';
  const nextPriority = ctx.nextSteps[0]?.priority || '';
  const nextLine     = nextSkill
    ? `**Next to learn:** \`${nextSkill}\` (${nextPriority} priority)`
    : ctx.hasPathway
      ? '🎉 All pathway steps completed!'
      : '';

  const completedSteps = ctx.pathwaySteps.filter((s) => s.status === 'completed').length;
  const totalSteps     = ctx.pathwaySteps.length;
  const encouragement  = ctx.pathwayProgress >= 75
    ? "You're almost there — keep pushing! 🚀"
    : ctx.pathwayProgress >= 40
      ? "Great momentum! You're past the halfway mark. 💪"
      : "Every step counts. You've got this! 🌱";

  // Pathway steps list (formatted bullets, max 7)
  const stepsList = ctx.pathwaySteps
    .slice(0, 7)
    .map((s, i) => {
      const icon = s.status === 'completed' ? '✅' : s.priority === 'critical' ? '🔴' : s.priority === 'recommended' ? '🟡' : '🟢';
      return `${icon} ${i + 1}. **${s.skill}** (${s.priority} · ${s.status})`;
    })
    .join('\n');
  const stepsMore = ctx.pathwaySteps.length > 7 ? `\n…and ${ctx.pathwaySteps.length - 7} more steps` : '';

  switch (intent) {

    // ── Greeting ────────────────────────────────────────────────
    case 'greeting': {
      if (ctx.hasGapReport && ctx.hasPathway) {
        return fill(RESPONSES.greeting_with_profile, {
          firstName,
          matchScore: ctx.matchScore,
          jobLine,
          pathwayProgress: ctx.pathwayProgress,
        });
      }
      if (ctx.hasResume) {
        return fill(RESPONSES.greeting_no_gaps, {
          firstName,
          skillCount: ctx.skills.length,
        });
      }
      return RESPONSES.greeting_fresh;
    }

    // ── Farewell ─────────────────────────────────────────────────
    case 'farewell': {
      return ctx.userName !== 'there'
        ? fill(RESPONSES.farewell_with_profile, { firstName })
        : RESPONSES.farewell_generic;
    }

    // ── Thanks ───────────────────────────────────────────────────
    case 'thanks': {
      return ctx.userName !== 'there'
        ? fill(RESPONSES.thanks_with_context, { firstName })
        : RESPONSES.thanks;
    }

    // ── Skills ───────────────────────────────────────────────────
    case 'query_skills': {
      if (!ctx.hasResume) return fill(RESPONSES.no_resume_prompt, { firstName });
      if (!ctx.skills.length) return RESPONSES.skills_none_extracted;
      return fill(RESPONSES.skills_found, {
        skillCount: ctx.skills.length,
        skillsList,
        moreText,
        matchLine,
      });
    }

    // ── Gaps ─────────────────────────────────────────────────────
    case 'query_gaps': {
      if (!ctx.hasResume)   return fill(RESPONSES.no_resume_prompt, { firstName });
      if (!ctx.hasGapReport) return fill(RESPONSES.no_gap_prompt, { firstName: '' });
      if (ctx.matchScore === 100) return fill(RESPONSES.gaps_perfect, { jobLine });
      if (ctx.matchScore >= 80) {
        return fill(RESPONSES.gaps_high_match, {
          firstName: firstName ? `, ${firstName}` : '',
          matchScore: ctx.matchScore,
          jobLine,
          missingList,
        });
      }
      return fill(RESPONSES.gaps_report, {
        jobLine,
        matchScore: ctx.matchScore,
        missingCount: ctx.missingSkills.length,
        missingList,
        partialCount:  ctx.partialSkills.length,
        partialList,
        satisfiedCount: ctx.satisfiedSkills.length,
        satisfiedList,
        pathwayLine,
      });
    }

    // ── Pathway ──────────────────────────────────────────────────
    case 'query_pathway': {
      if (!ctx.hasResume)    return fill(RESPONSES.no_resume_prompt, { firstName });
      if (!ctx.hasGapReport) return fill(RESPONSES.no_gap_prompt, { firstName: '' });
      if (!ctx.hasPathway)   return fill(RESPONSES.no_pathway_prompt, { firstName: '' });
      if (ctx.pathwayProgress === 100) {
        return fill(RESPONSES.pathway_done, { totalSteps });
      }
      return fill(RESPONSES.pathway_found, {
        jobLine,
        pathwayProgress: ctx.pathwayProgress,
        stepsList: stepsList + stepsMore,
        nextLine,
      });
    }

    // ── Progress ─────────────────────────────────────────────────
    case 'query_progress': {
      if (!ctx.hasPathway) return fill(RESPONSES.no_pathway_prompt, { firstName: '' });
      return fill(RESPONSES.progress_report, {
        completedSteps,
        totalSteps,
        pathwayProgress: ctx.pathwayProgress,
        nextLine,
        encouragement,
      });
    }

    // ── Jobs ─────────────────────────────────────────────────────
    case 'query_jobs': {
      if (!ctx.hasResume || !ctx.skills.length) {
        return fill(RESPONSES.jobs_no_skills, { totalJobs: ctx.totalJobs });
      }
      return fill(RESPONSES.jobs_with_skills, {
        skillCount:  ctx.skills.length,
        topSkills:   ctx.skills.slice(0, 3).join(', '),
        totalJobs:   ctx.totalJobs,
        jobTitle:    ctx.targetJobTitle || 'your target role',
        matchScore:  ctx.matchScore,
      });
    }

    // ── Courses ──────────────────────────────────────────────────
    case 'query_courses': {
      // Check if user asked for a specific skill course (e.g. "learn react")
      const norm = normalize(message);
      const faqAnswer = searchFAQ(norm);
      if (faqAnswer) return faqAnswer;

      if (ctx.missingSkills.length) {
        return fill(RESPONSES.courses_with_gaps, {
          missingList,
          totalCourses: ctx.totalCourses,
        });
      }
      return fill(RESPONSES.courses_no_gaps, { totalCourses: ctx.totalCourses });
    }

    // ── Match Score ──────────────────────────────────────────────
    case 'query_matchscore': {
      if (!ctx.hasGapReport) return fill(RESPONSES.no_gap_prompt, { firstName: '' });
      return fill(RESPONSES.matchscore_report, {
        firstName: firstName ? `${firstName}, ` : '',
        jobLine,
        matchScore: ctx.matchScore,
        nextLine,
      });
    }

    // ── Career Advice ────────────────────────────────────────────
    case 'career_advice': {
      const faqAnswer = searchFAQ(message);
      if (faqAnswer) return faqAnswer;
      return `Here are some general career tips tailored for tech:\n\n• **Build projects** — 2–3 real projects on GitHub > any certificate\n• **Learn in public** — share progress on LinkedIn\n• **Network consistently** — meetups, open source, Twitter/X\n• **Match your resume to job descriptions** — use the same keywords\n• **Apply before you feel "ready"** — confidence comes from doing\n\nFor personalised advice, tell me the **role or stack** you're targeting and I'll tailor this further!`;
    }

    // ── Platform Help ────────────────────────────────────────────
    case 'platform_help': {
      const faqAnswer = searchFAQ(message);
      if (faqAnswer) return faqAnswer;
      return `I can walk you through any part of AdaptLearn:\n\n• **Getting started** — ask "how do I start"\n• **Resume upload** — ask "how do I upload my resume"\n• **Gap analysis** — ask "how does gap analysis work"\n• **Learning pathway** — ask "what is a pathway"\n• **Match score** — ask "how to improve my score"\n\nWhat specific part would you like help with?`;
    }

    // ── Salary ───────────────────────────────────────────────────
    case 'query_salary': {
      const faqAnswer = searchFAQ(message);
      if (faqAnswer) return faqAnswer;
      return fill(RESPONSES.salary_context, {
        jobLine: ctx.targetJobTitle ? ` (${ctx.targetJobTitle})` : '',
      });
    }

    // ── Continuation (follow-up) ──────────────────────────────────
    case 'continuation': {
      // Route to the previous intent handler with more detail flag
      if (lastIntent && lastIntent !== 'continuation' && lastIntent !== 'general') {
        return buildReply(lastIntent, ctx, 'tell me more', null);
      }
      return RESPONSES.continuation_prompt;
    }

    // ── Negative Sentiment ────────────────────────────────────────
    case 'negative_sentiment': {
      return fill(RESPONSES.negative_support, {
        skillCount:    ctx.skills.length || 0,
        jobTitle:      ctx.targetJobTitle || 'your dream role',
        company:       ctx.targetCompany ? ` at ${ctx.targetCompany}` : '',
        missingCount:  ctx.missingSkills.length || 0,
      });
    }

    // ── General / Fallback ────────────────────────────────────────
    default: {
      // Try FAQ first
      const faqAnswer = searchFAQ(message);
      if (faqAnswer) return faqAnswer;

      // Try small talk
      const stAnswer = searchSmallTalk(message);
      if (stAnswer) return stAnswer;

      // Context-aware fallback
      if (ctx.hasGapReport && ctx.missingSkills.length) {
        return fill(RESPONSES.general_fallback, { firstName });
      }
      return ctx.userName !== 'there'
        ? fill(RESPONSES.general_fallback, { firstName })
        : RESPONSES.general_fallback_no_name;
    }
  }
}
