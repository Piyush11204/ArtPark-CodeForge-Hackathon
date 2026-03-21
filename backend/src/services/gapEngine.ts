import axios from 'axios';
import { normalizeSkills, normalizeSkill, SKILL_EXPANSIONS, SYNONYM_LOOKUP } from '../config/skillAliases';
import { IGapDetail } from '../models/GapReport';
import { IParsedData } from '../models/Resume';
import { IJob } from '../models/Job';
import { env } from '../config/env';

// ─── Shared skill keyword list used for local JD extraction ──────────────────
const JD_SKILL_KEYWORDS = [
  'javascript','typescript','python','java','c++','c#','go','rust','ruby','php','swift','kotlin','scala',
  'r','matlab','bash','shell','sql','html','css','xml','json',
  'react','angular','vue','next.js','nuxt','svelte','express','fastapi','django','flask','spring',
  'spring boot','nestjs','node.js','nodejs','graphql','rest','grpc','tailwind','bootstrap','redux',
  'mongodb','postgresql','mysql','sqlite','redis','elasticsearch','dynamodb','cassandra','neo4j',
  'aws','azure','gcp','docker','kubernetes','terraform','ansible','jenkins','github actions','ci/cd',
  'git','linux','nginx','webpack','vite','jest','pytest','cypress','selenium',
  'tensorflow','pytorch','keras','scikit-learn','pandas','numpy','openai','langchain',
  'machine learning','deep learning','nlp','computer vision','data science','data analysis',
  'excel','powerpoint','word','google sheets','looker','tableau','power bi',
  'salesforce','hubspot','zendesk','jira','confluence','asana','notion','slack',
  'figma','sketch','adobe xd','photoshop','illustrator',
  'agile','scrum','kanban','product management','project management',
  'communication','leadership','teamwork','problem solving','critical thinking',
  'customer success','account management','crm','saas','b2b','b2c','onboarding',
  'seo','google analytics','social media','content marketing','copywriting',
];

/**
 * Locally extracts skills from free-form text without any external service.
 */
function localExtractSkillsFromText(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return JD_SKILL_KEYWORDS.filter((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i').test(lower);
  });
}

/**
 * Calls the Python ML microservice to extract skills from raw JD text.
 * Falls back to local keyword extraction on any failure.
 */
async function extractSkillsFromJD(description: string): Promise<string[]> {
  if (!description) return [];
  try {
    const res = await axios.post(
      `${env.ML_SERVICE_URL}/extract-skills`,
      { text: description },
      { timeout: 8000 }
    );
    const mlSkills = (res.data?.skills ?? []) as string[];
    if (mlSkills.length > 0) return mlSkills;
  } catch {
    // ML service unavailable — fall through to local extractor
  }
  return localExtractSkillsFromText(description);
}

/**
 * Expands composite candidate skills to their components.
 * e.g. "mern stack" → also adds "mongodb", "express", "react", "nodejs"
 */
function expandSkills(skills: string[]): string[] {
  const expanded = new Set(skills);
  for (const skill of skills) {
    const components = SKILL_EXPANSIONS[skill];
    if (components) components.forEach(c => expanded.add(c));
  }
  return [...expanded];
}

/**
 * Exact match: is `required` in the candidate set, or any synonym of it?
 */
function exactOrSynonymMatch(required: string, candidateSet: Set<string>): boolean {
  if (candidateSet.has(required)) return true;
  const synonyms = SYNONYM_LOOKUP.get(required);
  if (synonyms) {
    for (const syn of synonyms) {
      if (candidateSet.has(syn)) return true;
    }
  }
  return false;
}

/**
 * Fuzzy / word-overlap match:
 *  - One skill contains the other as a full substring
 *  - Significant word overlap (≥1 content word in common)
 */
function fuzzyMatch(required: string, candidateSkills: string[]): boolean {
  const STOP = new Set(['and', 'or', 'the', 'a', 'an', 'of', 'in', 'for', 'with', 'to', 'at']);
  const reqWords = required.split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  if (reqWords.length === 0) return false;

  for (const cand of candidateSkills) {
    // substring containment
    if (cand.includes(required) || required.includes(cand)) return true;
    // word overlap
    const candWords = cand.split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
    const overlap = reqWords.filter(w => candWords.includes(w));
    if (overlap.length > 0) return true;
    // synonym set of candidate also checked
    const candSynonyms = SYNONYM_LOOKUP.get(cand);
    if (candSynonyms) {
      // if required shares any synonym group member with candidate's group
      const reqSynonyms = SYNONYM_LOOKUP.get(required);
      if (reqSynonyms) {
        for (const rs of reqSynonyms) {
          if (candSynonyms.has(rs)) return true;
        }
      }
    }
  }
  return false;
}

/**
 * Extracts a flat list of all skills from parsed resume data.
 */
export function extractSkillsFromParsedData(data: IParsedData): string[] {
  const { skills } = data;
  const raw: string[] = [
    ...(skills?.technical_skills ?? []),
    ...(skills?.frameworks ?? []),
    ...(skills?.databases ?? []),
    ...(skills?.languages ?? []),
    ...(skills?.tools_and_technologies ?? []),
  ];
  return normalizeSkills(raw);
}

/**
 * Computes the skill gap between a candidate's normalized skills and a job.
 *
 * Matching tiers (for each required skill):
 *   satisfied  — exact match or synonym group match (score: 1.0)
 *   partial    — fuzzy / word-overlap / related match   (score: 0.5)
 *   missing    — no match                               (score: 0.0)
 *
 * matchScore = round((satisfied + 0.5 * partial) / totalRequired * 100)
 * gapScore   = 100 - matchScore
 */
export async function computeGap(
  candidateNormalizedSkills: string[],
  job: IJob
): Promise<IGapDetail> {
  // 1. Expand composite skills (MERN → mongodb+express+react+nodejs etc.)
  const expandedCandidate = expandSkills(candidateNormalizedSkills);
  const candidateSet = new Set(expandedCandidate);

  // 2. Get required skills with fallbacks
  let requiredSkills = job.requiredSkills ?? [];
  if (requiredSkills.length === 0 && job.jobDescription) {
    requiredSkills = await extractSkillsFromJD(job.jobDescription);
  }
  if (requiredSkills.length === 0 && job.jobTitle) {
    requiredSkills = localExtractSkillsFromText(job.jobTitle);
  }

  const normalizedRequired = normalizeSkills(requiredSkills);
  const normalizedPreferred = normalizeSkills(job.preferredSkills ?? []);

  // 3. Three-tier matching for each required skill
  const satisfied: string[] = [];
  const partial: string[] = [];
  const missing: string[] = [];

  for (const req of normalizedRequired) {
    if (exactOrSynonymMatch(req, candidateSet)) {
      satisfied.push(req);
    } else if (fuzzyMatch(req, expandedCandidate)) {
      partial.push(req);
    } else {
      missing.push(req);
    }
  }

  // 4. Also run preferred skills through the same matching; merge any exact/synonym hits
  //    into partial (unless already satisfied)
  const satisfiedSet = new Set(satisfied);
  for (const pref of normalizedPreferred) {
    if (!satisfiedSet.has(pref) && exactOrSynonymMatch(pref, candidateSet)) {
      partial.push(pref); // earns partial credit for preferred match
    }
  }

  // 5. Transferable: candidate's original (unexpanded) skills that didn't appear in
  //    required or preferred — shows breadth beyond the role requirements
  const allJobSkills = new Set([...normalizedRequired, ...normalizedPreferred]);
  const transferable = candidateNormalizedSkills.filter(
    s => !allJobSkills.has(s) && !satisfiedSet.has(s)
  );

  // 6. Score: satisfied=1.0, partial=0.5, missing=0
  const totalRequired = normalizedRequired.length;
  const matchScore =
    totalRequired > 0
      ? Math.min(100, Math.round(((satisfied.length + 0.5 * partial.length) / totalRequired) * 100))
      : 100;
  const gapScore = 100 - matchScore;

  return {
    missing,
    partial,
    satisfied,
    transferable,
    gapScore,
    matchScore,
    totalRequired,
    totalCandidate: candidateNormalizedSkills.length,
  };
}

