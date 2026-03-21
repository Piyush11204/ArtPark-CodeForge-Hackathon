import axios from 'axios';
import { normalizeSkills } from '../config/skillAliases';
import { IGapDetail } from '../models/GapReport';
import { IParsedData } from '../models/Resume';
import { IJob } from '../models/Job';
import { env } from '../config/env';

/**
 * Calls the Python ML microservice to extract skills from raw JD text.
 * Returns empty array on any failure (non-blocking).
 */
async function extractSkillsFromJD(description: string): Promise<string[]> {
  if (!description) return [];
  try {
    const res = await axios.post(
      `${env.ML_SERVICE_URL}/extract-skills`,
      { text: description },
      { timeout: 8000 }
    );
    return (res.data?.skills ?? []) as string[];
  } catch {
    return [];
  }
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

  // Fallback: extract skills from raw description via ML service
  if (requiredSkills.length === 0 && job.jobDescription) {
    const extracted = await extractSkillsFromJD(job.jobDescription);
    requiredSkills = extracted;
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
