"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePathway = generatePathway;
const Course_1 = require("../models/Course");
const logger_1 = require("../utils/logger");
function topologicalSort(nodes) {
    const visited = new Set();
    const result = [];
    function dfs(skill) {
        if (visited.has(skill))
            return;
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
function buildReason(skill, priority, satisfiedPrereqs, missingPrereqs) {
    const parts = [];
    if (priority === 'critical') {
        parts.push(`"${skill}" is a required skill for this role and is missing from your profile.`);
    }
    else if (priority === 'recommended') {
        parts.push(`"${skill}" is a preferred skill that would strengthen your candidacy.`);
    }
    else {
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
async function generatePathway(gapDetail, candidateSkills) {
    const candidateSet = new Set(candidateSkills);
    const allSkillsToLearn = [
        ...gapDetail.missing.map((s) => ({ skill: s, priority: 'critical' })),
        ...gapDetail.partial.map((s) => ({ skill: s, priority: 'recommended' })),
    ];
    if (allSkillsToLearn.length === 0) {
        return { steps: [], totalEstimatedHours: 0 };
    }
    const skillNames = allSkillsToLearn.map((s) => s.skill);
    const courses = await Course_1.CourseModel.find({
        skill: { $in: skillNames },
        isActive: true,
    }).lean();
    const courseMap = new Map(courses.map((c) => [c.skill, c]));
    const nodeMap = new Map();
    for (const { skill, priority } of allSkillsToLearn) {
        const course = courseMap.get(skill);
        nodeMap.set(skill, {
            skill,
            priority,
            prerequisites: course?.prerequisites ?? [],
            course: course ?? undefined,
        });
    }
    const ordered = topologicalSort(nodeMap);
    let order = 0;
    const steps = [];
    let totalHours = 0;
    for (const skill of ordered) {
        const node = nodeMap.get(skill);
        if (!node)
            continue;
        const satisfiedPrereqs = node.prerequisites.filter((p) => candidateSet.has(p));
        const missingPrereqs = node.prerequisites.filter((p) => !candidateSet.has(p) && nodeMap.has(p));
        const estimatedHours = node.course?.estimatedHours ?? getDefaultHours(node.priority);
        totalHours += estimatedHours;
        const step = {
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
        };
        steps.push(step);
    }
    logger_1.logger.info(`Pathway generated: ${steps.length} steps, ~${totalHours}h total`);
    return { steps, totalEstimatedHours: totalHours };
}
function getDefaultHours(priority) {
    const defaults = { critical: 20, recommended: 10, optional: 5 };
    return defaults[priority];
}
//# sourceMappingURL=adaptivePathing.js.map