"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResumeFromBuffer = parseResumeFromBuffer;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const pdfParse = require('pdf-parse');
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const SKILL_KEYWORDS = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
    'r', 'matlab', 'bash', 'shell', 'sql', 'html', 'css', 'xml', 'json',
    'react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'express', 'fastapi', 'django', 'flask', 'spring',
    'spring boot', 'nestjs', 'node.js', 'nodejs', 'graphql', 'rest', 'grpc', 'tailwind', 'bootstrap', 'redux',
    'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'neo4j', 'supabase',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd',
    'git', 'linux', 'nginx', 'webpack', 'vite', 'jest', 'pytest', 'cypress', 'selenium',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'hugging face', 'langchain', 'openai',
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science',
    'agile', 'scrum', 'figma', 'jira', 'confluence', 'postman', 'graphql',
];
function extractSkillsFromText(text) {
    const lower = text.toLowerCase();
    const technical = [];
    const frameworks = [];
    const databases = [];
    const tools = [];
    const languages = [];
    const dbWords = new Set(['mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'neo4j', 'supabase']);
    const fwWords = new Set(['react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'express', 'fastapi', 'django', 'flask', 'spring', 'spring boot', 'nestjs', 'node.js', 'nodejs', 'graphql', 'redux', 'tailwind', 'bootstrap']);
    const langWords = new Set(['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'bash', 'shell', 'sql', 'html', 'css']);
    for (const skill of SKILL_KEYWORDS) {
        if (lower.includes(skill)) {
            const display = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (dbWords.has(skill))
                databases.push(display);
            else if (fwWords.has(skill))
                frameworks.push(display);
            else if (langWords.has(skill))
                languages.push(display);
            else
                tools.push(display);
            technical.push(display);
        }
    }
    const dedup = (arr) => [...new Set(arr)];
    return {
        technical_skills: dedup(technical),
        frameworks: dedup(frameworks),
        databases: dedup(databases),
        tools_and_technologies: dedup(tools),
        languages: dedup(languages),
        soft_skills: [],
    };
}
function extractEmail(text) {
    const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    return m ? m[0] : '';
}
function extractPhone(text) {
    const m = text.match(/(?:\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/);
    return m ? m[0] : '';
}
function extractName(lines) {
    for (const line of lines.slice(0, 6)) {
        const l = line.trim();
        if (l && !l.includes('@') && !l.startsWith('http') && l.length < 60 && /[A-Z]/.test(l)) {
            return l;
        }
    }
    return '';
}
function extractLinkedin(text) {
    const m = text.match(/linkedin\.com\/in\/[\w\-]+/i);
    return m ? `https://${m[0]}` : '';
}
function extractGithub(text) {
    const m = text.match(/github\.com\/[\w\-]+/i);
    return m ? `https://${m[0]}` : '';
}
async function localFallbackParse(buffer, filename) {
    logger_1.logger.info(`Using local fallback parser for: ${filename}`);
    let text = '';
    try {
        const parsed = await pdfParse(buffer);
        text = parsed.text;
    }
    catch {
        logger_1.logger.warn('pdf-parse failed, returning minimal parsed data');
        text = '';
    }
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const fullName = extractName(lines);
    const nameParts = fullName.split(' ');
    return {
        personal_information: {
            full_name: fullName,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            email: extractEmail(text),
            phone: extractPhone(text),
            linkedin: extractLinkedin(text),
            github: extractGithub(text),
        },
        professional_summary: '',
        work_experience: [],
        education: [],
        skills: extractSkillsFromText(text),
        certifications: [],
        projects: [],
        metadata: {
            filename,
            parsed_at: new Date().toISOString(),
            parser_version: 'local-fallback-1.0',
            openai_used: false,
            text_length: text.length,
        },
    };
}
async function parseResumeFromBuffer(buffer, filename, mimetype) {
    const formData = new form_data_1.default();
    formData.append('file', buffer, {
        filename,
        contentType: mimetype,
    });
    formData.append('use_openai', 'true');
    logger_1.logger.info(`Calling resume parser API for file: ${filename}`);
    try {
        const response = await axios_1.default.post(`${env_1.env.RESUME_PARSER_URL}/parse_resume`, formData, {
            headers: { ...formData.getHeaders() },
            timeout: 30000,
        });
        if (response.data.status !== 'success' && response.data.status !== 'ok') {
            throw new Error(`Parser API returned status: ${response.data.status}`);
        }
        logger_1.logger.info(`Resume parsed successfully via API: ${filename}`);
        return response.data.data;
    }
    catch (err) {
        if (axios_1.default.isAxiosError(err)) {
            const status = err.response?.status;
            const msg = err.response?.data?.error || err.message;
            logger_1.logger.warn(`Resume parser API unavailable (${status ?? 'network error'}: ${msg}), using local fallback`);
            return localFallbackParse(buffer, filename);
        }
        throw err;
    }
}
//# sourceMappingURL=resumeParser.js.map