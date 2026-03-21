import { CourseModel, ICourse } from '../models/Course';
import { IGapDetail } from '../models/GapReport';
import { IPathwayStep } from '../models/Pathway';
import { logger } from '../utils/logger';

interface SkillNode {
  skill: string;
  priority: 'critical' | 'recommended' | 'optional';
  prerequisites: string[];
  course?: ICourse;
}

/**
 * Topological sort using DFS — returns skills in valid learning order
 * respecting prerequisite dependencies.
 */
function topologicalSort(nodes: Map<string, SkillNode>): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function dfs(skill: string): void {
    if (visited.has(skill)) return;
    visited.add(skill);

    const node = nodes.get(skill);
    if (node) {
      for (const prereq of node.prerequisites) {
        if (nodes.has(prereq)) {
          dfs(prereq);
        }
      }
    }
    result.push(skill);
  }

  for (const skill of nodes.keys()) {
    dfs(skill);
  }

  return result;
}

/**
 * Generates reasoning text for a learning step.
 */
function buildReason(
  skill: string,
  priority: 'critical' | 'recommended' | 'optional',
  satisfiedPrereqs: string[],
  missingPrereqs: string[]
): string {
  const parts: string[] = [];

  if (priority === 'critical') {
    parts.push(`"${skill}" is a required skill for this role and is missing from your profile.`);
  } else if (priority === 'recommended') {
    parts.push(`"${skill}" is a preferred skill that would strengthen your candidacy.`);
  } else {
    parts.push(`"${skill}" is an optional skill that adds value to your profile.`);
  }

  if (satisfiedPrereqs.length > 0) {
    parts.push(`You already know: ${satisfiedPrereqs.join(', ')} — which makes this easier to learn.`);
  }

  if (missingPrereqs.length > 0) {
    parts.push(`Prerequisites to complete first: ${missingPrereqs.join(', ')}.`);
  }

  return parts.join(' ');
}

/**
 * Main adaptive pathing function.
 * Takes a gap report and builds an ordered, dependency-aware learning pathway.
 */
export async function generatePathway(
  gapDetail: IGapDetail,
  candidateSkills: string[]
): Promise<{ steps: IPathwayStep[]; totalEstimatedHours: number }> {
  const candidateSet = new Set(candidateSkills);
  const allSkillsToLearn: { skill: string; priority: 'critical' | 'recommended' | 'optional' }[] =
    [
      ...gapDetail.missing.map((s) => ({ skill: s, priority: 'critical' as const })),
      ...gapDetail.partial.map((s) => ({ skill: s, priority: 'recommended' as const })),
    ];

  if (allSkillsToLearn.length === 0) {
    return { steps: [], totalEstimatedHours: 0 };
  }

  // Fetch courses from DB for all skills we need to teach
  const skillNames = allSkillsToLearn.map((s) => s.skill);
  const courses = await CourseModel.find({
    skill: { $in: skillNames },
    isActive: true,
  }).lean();

  const courseMap = new Map<string, ICourse>(courses.map((c) => [c.skill, c as unknown as ICourse]));

  // Build skill nodes with prerequisite info
  const nodeMap = new Map<string, SkillNode>();
  for (const { skill, priority } of allSkillsToLearn) {
    const course = courseMap.get(skill);
    nodeMap.set(skill, {
      skill,
      priority,
      prerequisites: course?.prerequisites ?? [],
      course: course ?? undefined,
    });
  }

  // Topological sort for correct ordering
  const ordered = topologicalSort(nodeMap);

  // If a skill to learn has prerequisites that are also in the "to learn" list,
  // reorder so prerequisite comes first (topologicalSort already handles this)
  let order = 0;
  const steps: IPathwayStep[] = [];
  let totalHours = 0;

  for (const skill of ordered) {
    const node = nodeMap.get(skill);
    if (!node) continue;

    const satisfiedPrereqs = node.prerequisites.filter((p) => candidateSet.has(p));
    const missingPrereqs = node.prerequisites.filter(
      (p) => !candidateSet.has(p) && nodeMap.has(p)
    );

    const estimatedHours = node.course?.estimatedHours ?? getDefaultHours(node.priority);
    totalHours += estimatedHours;

    const step: IPathwayStep = {
      order: ++order,
      skill,
      courseId: node.course?._id,
      courseTitle: node.course?.title ?? `Learn ${skill}`,
      courseProvider: node.course?.provider ?? 'Self-study',
      resourceUrl: node.course?.resourceUrl ?? '',
      reason: buildReason(skill, node.priority, satisfiedPrereqs, missingPrereqs),
      estimatedHours,
      priority: node.priority,
      status: 'pending',
    } as IPathwayStep;

    steps.push(step);
  }

  logger.info(`Pathway generated: ${steps.length} steps, ~${totalHours}h total`);
  return { steps, totalEstimatedHours: totalHours };
}

function getDefaultHours(priority: 'critical' | 'recommended' | 'optional'): number {
  const defaults = { critical: 20, recommended: 10, optional: 5 };
  return defaults[priority];
}
