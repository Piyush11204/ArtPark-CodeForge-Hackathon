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
const JD_SKILL_KEYWORDS = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
    'r', 'matlab', 'bash', 'shell', 'sql', 'html', 'css', 'xml', 'json',
    'react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'express', 'fastapi', 'django', 'flask', 'spring',
    'spring boot', 'nestjs', 'node.js', 'nodejs', 'graphql', 'rest', 'grpc', 'tailwind', 'bootstrap', 'redux',
    'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'neo4j',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd',
    'git', 'linux', 'nginx', 'webpack', 'vite', 'jest', 'pytest', 'cypress', 'selenium',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'openai', 'langchain',
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science', 'data analysis',
    'excel', 'powerpoint', 'word', 'google sheets', 'looker', 'tableau', 'power bi',
    'salesforce', 'hubspot', 'zendesk', 'jira', 'confluence', 'asana', 'notion', 'slack',
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
    'agile', 'scrum', 'kanban', 'product management', 'project management',
    'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
    'customer success', 'account management', 'crm', 'saas', 'b2b', 'b2c', 'onboarding',
    'seo', 'google analytics', 'social media', 'content marketing', 'copywriting',
];
function localExtractSkillsFromText(text) {
    if (!text)
        return [];
    const lower = text.toLowerCase();
    return JD_SKILL_KEYWORDS.filter((kw) => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i').test(lower);
    });
}
async function extractSkillsFromJD(description) {
    if (!description)
        return [];
    try {
        const res = await axios_1.default.post(`${env_1.env.ML_SERVICE_URL}/extract-skills`, { text: description }, { timeout: 8000 });
        const mlSkills = (res.data?.skills ?? []);
        if (mlSkills.length > 0)
            return mlSkills;
    }
    catch {
    }
    return localExtractSkillsFromText(description);
}
function expandSkills(skills) {
    const expanded = new Set(skills);
    for (const skill of skills) {
        const components = skillAliases_1.SKILL_EXPANSIONS[skill];
        if (components)
            components.forEach(c => expanded.add(c));
    }
    return [...expanded];
}
function exactOrSynonymMatch(required, candidateSet) {
    if (candidateSet.has(required))
        return true;
    const synonyms = skillAliases_1.SYNONYM_LOOKUP.get(required);
    if (synonyms) {
        for (const syn of synonyms) {
            if (candidateSet.has(syn))
                return true;
        }
    }
    return false;
}
function fuzzyMatch(required, candidateSkills) {
    const STOP = new Set(['and', 'or', 'the', 'a', 'an', 'of', 'in', 'for', 'with', 'to', 'at']);
    const reqWords = required.split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
    if (reqWords.length === 0)
        return false;
    for (const cand of candidateSkills) {
        if (cand.includes(required) || required.includes(cand))
            return true;
        const candWords = cand.split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
        const overlap = reqWords.filter(w => candWords.includes(w));
        if (overlap.length > 0)
            return true;
        const candSynonyms = skillAliases_1.SYNONYM_LOOKUP.get(cand);
        if (candSynonyms) {
            const reqSynonyms = skillAliases_1.SYNONYM_LOOKUP.get(required);
            if (reqSynonyms) {
                for (const rs of reqSynonyms) {
                    if (candSynonyms.has(rs))
                        return true;
                }
            }
        }
    }
    return false;
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
    return (0, skillAliases_1.normalizeSkills)(raw);
}
async function computeGap(candidateNormalizedSkills, job) {
    const expandedCandidate = expandSkills(candidateNormalizedSkills);
    const candidateSet = new Set(expandedCandidate);
    let requiredSkills = job.requiredSkills ?? [];
    if (requiredSkills.length === 0 && job.jobDescription) {
        requiredSkills = await extractSkillsFromJD(job.jobDescription);
    }
    if (requiredSkills.length === 0 && job.jobTitle) {
        requiredSkills = localExtractSkillsFromText(job.jobTitle);
    }
    const normalizedRequired = (0, skillAliases_1.normalizeSkills)(requiredSkills);
    const normalizedPreferred = (0, skillAliases_1.normalizeSkills)(job.preferredSkills ?? []);
    const satisfied = [];
    const partial = [];
    const missing = [];
    for (const req of normalizedRequired) {
        if (exactOrSynonymMatch(req, candidateSet)) {
            satisfied.push(req);
        }
        else if (fuzzyMatch(req, expandedCandidate)) {
            partial.push(req);
        }
        else {
            missing.push(req);
        }
    }
    const satisfiedSet = new Set(satisfied);
    for (const pref of normalizedPreferred) {
        if (!satisfiedSet.has(pref) && exactOrSynonymMatch(pref, candidateSet)) {
            partial.push(pref);
        }
    }
    const allJobSkills = new Set([...normalizedRequired, ...normalizedPreferred]);
    const transferable = candidateNormalizedSkills.filter(s => !allJobSkills.has(s) && !satisfiedSet.has(s));
    const totalRequired = normalizedRequired.length;
    const matchScore = totalRequired > 0
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
//# sourceMappingURL=gapEngine.js.map