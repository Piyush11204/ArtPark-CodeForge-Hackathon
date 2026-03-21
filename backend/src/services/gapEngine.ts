import { normalizeSkills } from '../config/skillAliases';
import { IGapDetail } from '../models/GapReport';
import { IParsedData } from '../models/Resume';
import { IJob } from '../models/Job';

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
 */
export function computeGap(
  candidateNormalizedSkills: string[],
  job: IJob
): IGapDetail {
  const candidateSet = new Set(candidateNormalizedSkills);

  const normalizedRequired = normalizeSkills(job.requiredSkills);
  const normalizedPreferred = normalizeSkills(job.preferredSkills);

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
