import axios from 'axios';
import { normalizeSkills } from '../config/skillAliases';
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
    // Word-boundary check: the keyword should not be a substring of another word
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

  // Also pull skills mentioned in work experience and projects
  data.work_experience?.forEach((exp) => {
    if (exp.description) {
      // Minimal extraction: we trust parser for explicit skills
    }
  });

  return normalizeSkills(raw);
}

/**
 * Computes the skill gap between a candidate's normalized skills and a job.
 * If the job has no requiredSkills, falls back to ML service extraction from description.
 */
export async function computeGap(
  candidateNormalizedSkills: string[],
  job: IJob
): Promise<IGapDetail> {
  const candidateSet = new Set(candidateNormalizedSkills);

  let requiredSkills = job.requiredSkills ?? [];

  // Fallback 1: extract from job description (ML first, then local keywords)
  if (requiredSkills.length === 0 && job.jobDescription) {
    requiredSkills = await extractSkillsFromJD(job.jobDescription);
  }

  // Fallback 2: extract from the job title itself (e.g. "React Developer")
  if (requiredSkills.length === 0 && job.jobTitle) {
    requiredSkills = localExtractSkillsFromText(job.jobTitle);
  }

  const normalizedRequired = normalizeSkills(requiredSkills);
  const normalizedPreferred = normalizeSkills(job.preferredSkills ?? []);

  const satisfied = normalizedRequired.filter((s) => candidateSet.has(s));
  const missing = normalizedRequired.filter((s) => !candidateSet.has(s));
  const partial = normalizedPreferred.filter((s) => !candidateSet.has(s));

  const totalRequired = normalizedRequired.length;
  const gapScore =
    totalRequired > 0
      ? Math.round((missing.length / totalRequired) * 100)
      : 0;
  const matchScore = 100 - gapScore;

  return {
    missing,
    partial,
    satisfied,
    gapScore,
    matchScore,
    totalRequired,
    totalCandidate: candidateNormalizedSkills.length,
  };
}
