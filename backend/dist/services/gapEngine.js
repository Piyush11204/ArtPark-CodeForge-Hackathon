"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSkillsFromParsedData = extractSkillsFromParsedData;
exports.computeGap = computeGap;
const axios_1 = __importDefault(require("axios"));
const skillAliases_1 = require("../config/skillAliases");
const env_1 = require("../config/env");
async function extractSkillsFromJD(description) {
    if (!description)
        return [];
    try {
        const res = await axios_1.default.post(`${env_1.env.ML_SERVICE_URL}/extract-skills`, { text: description }, { timeout: 8000 });
        return (res.data?.skills ?? []);
    }
    catch {
        return [];
    }
}
function extractSkillsFromParsedData(data) {
    const { skills } = data;
    const raw = [
        ...(skills?.technical_skills ?? []),
        ...(skills?.frameworks ?? []),
        ...(skills?.databases ?? []),
        ...(skills?.languages ?? []),
        ...(skills?.tools_and_technologies ?? []),
    ];
    data.work_experience?.forEach((exp) => {
        if (exp.description) {
        }
    });
    return (0, skillAliases_1.normalizeSkills)(raw);
}
async function computeGap(candidateNormalizedSkills, job) {
    const candidateSet = new Set(candidateNormalizedSkills);
    let requiredSkills = job.requiredSkills ?? [];
    if (requiredSkills.length === 0 && job.jobDescription) {
        const extracted = await extractSkillsFromJD(job.jobDescription);
        requiredSkills = extracted;
    }
    const normalizedRequired = (0, skillAliases_1.normalizeSkills)(requiredSkills);
    const normalizedPreferred = (0, skillAliases_1.normalizeSkills)(job.preferredSkills ?? []);
    const satisfied = normalizedRequired.filter((s) => candidateSet.has(s));
    const missing = normalizedRequired.filter((s) => !candidateSet.has(s));
    const partial = normalizedPreferred.filter((s) => !candidateSet.has(s));
    const totalRequired = normalizedRequired.length;
    const gapScore = totalRequired > 0
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
//# sourceMappingURL=gapEngine.js.map