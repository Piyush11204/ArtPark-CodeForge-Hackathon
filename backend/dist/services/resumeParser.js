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
function extractEmail(text) {
    const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    return m ? m[0] : '';
}
function extractPhone(text) {
    const m = text.match(/(?:\+?\d[\s\-.]?){9,14}/);
    return m ? m[0].trim() : '';
}
function extractLinkedin(text) {
    const m = text.match(/linkedin\.com\/in\/[\w\-%.]+/i);
    return m ? `https://${m[0]}` : '';
}
function extractGithub(text) {
    const m = text.match(/github\.com\/[\w\-%.]+/i);
    return m ? `https://${m[0]}` : '';
}
function extractName(lines) {
    for (const line of lines.slice(0, 8)) {
        const l = line.trim();
        if (!l)
            continue;
        if (l.includes('@'))
            continue;
        if (/^https?:\/\//.test(l))
            continue;
        if (/^\+?[\d\s()\-]{7,}$/.test(l))
            continue;
        if (l.length > 70)
            continue;
        const words = l.split(/\s+/);
        if (words.length >= 2 && words.length <= 5 && /[A-Z]/.test(l))
            return l;
    }
    return '';
}
const SECTION_RE = {
    summary: /^(summary|professional summary|objective|career objective|about me|profile)\s*$/im,
    experience: /^(experience|work experience|employment|professional experience|work history|career)\s*$/im,
    education: /^(education|academic background|qualifications)\s*$/im,
    skills: /^(skills|technical skills|core competencies|competencies|expertise|technologies|key skills)\s*$/im,
    projects: /^(projects|personal projects|notable projects|side projects|key projects)\s*$/im,
    certifications: /^(certifications|certificates|licenses & certifications|licenses|achievements|awards)\s*$/im,
};
function splitIntoSections(text) {
    const lines = text.split('\n');
    const sections = { header: '' };
    let current = 'header';
    for (const line of lines) {
        const trimmed = line.trim();
        let matched = false;
        for (const [key, re] of Object.entries(SECTION_RE)) {
            if (re.test(trimmed)) {
                current = key;
                sections[current] = sections[current] ?? '';
                matched = true;
                break;
            }
        }
        if (!matched) {
            sections[current] = (sections[current] ?? '') + line + '\n';
        }
    }
    return sections;
}
const DATE_RE = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*\.?\s*\d{4}|\d{4}/gi;
const DATE_RANGE_RE = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})\s*[-–—to]+\s*(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4}|present|current|now)/gi;
function parseExperience(text) {
    if (!text?.trim())
        return [];
    const results = [];
    const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 1)
            continue;
        let duration = '';
        let titleLine = '';
        let companyLine = '';
        const descLines = [];
        for (const line of lines) {
            const rangeMatch = line.match(DATE_RANGE_RE);
            if (rangeMatch && !duration) {
                duration = rangeMatch[0];
                const rest = line.replace(DATE_RANGE_RE, '').replace(/[-–—|,]+/g, ' ').trim();
                if (rest)
                    titleLine = titleLine || rest;
            }
            else if (!titleLine) {
                titleLine = line;
            }
            else if (!companyLine && !line.match(DATE_RE)) {
                companyLine = line;
            }
            else {
                descLines.push(line);
            }
        }
        if (!titleLine && !companyLine)
            continue;
        const atMatch = titleLine.match(/^(.+?)\s+(?:at|@|[-–|])\s+(.+)$/i);
        if (atMatch && !companyLine) {
            results.push({
                position: atMatch[1].trim(),
                company: atMatch[2].trim(),
                duration,
                description: descLines.join(' ').trim(),
            });
        }
        else {
            results.push({
                position: titleLine,
                company: companyLine,
                duration,
                description: descLines.join(' ').trim(),
            });
        }
    }
    return results.slice(0, 10);
}
const DEGREE_RE = /\b(bachelor|master|b\.?s\.?|m\.?s\.?|b\.?e\.?|m\.?e\.?|b\.?tech\.?|m\.?tech\.?|phd|ph\.?d\.?|diploma|associate|mba|b\.?a\.?|m\.?a\.?)\b/i;
function parseEducation(text) {
    if (!text?.trim())
        return [];
    const results = [];
    const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length)
            continue;
        let degree = '';
        let institution = '';
        let year = '';
        let field = '';
        for (const line of lines) {
            const yearM = line.match(/\b(19|20)\d{2}\b/);
            if (yearM && !year)
                year = yearM[0];
            const degM = line.match(DEGREE_RE);
            if (degM && !degree) {
                degree = line;
                const fieldM = line.match(/\bin\s+([A-Z][a-zA-Z\s]+)/);
                if (fieldM)
                    field = fieldM[1].trim();
            }
            else if (!institution && !degM) {
                institution = line.replace(/\b(19|20)\d{2}\b.*/, '').trim();
            }
        }
        if (degree || institution) {
            results.push({ degree: degree || '', institution: institution || '', year, field_of_study: field });
        }
    }
    return results.slice(0, 5);
}
const SKILL_KEYWORDS = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
    'r', 'matlab', 'bash', 'shell', 'sql', 'html', 'css', 'xml', 'json', 'yaml',
    'react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'express', 'fastapi', 'django', 'flask', 'spring',
    'spring boot', 'nestjs', 'node.js', 'nodejs', 'graphql', 'rest', 'grpc', 'tailwind', 'bootstrap', 'redux',
    'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'neo4j', 'supabase', 'firebase',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd', 'git', 'linux',
    'nginx', 'webpack', 'vite', 'jest', 'pytest', 'cypress', 'selenium', 'postman',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'openai', 'langchain', 'hugging face',
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science', 'data analysis',
    'figma', 'jira', 'confluence', 'agile', 'scrum', 'trello', 'notion', 'slack',
    'salesforce', 'hubspot', 'zendesk', 'crm', 'saas', 'b2b', 'excel', 'power bi', 'tableau',
];
const DB_SET = new Set(['mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'neo4j', 'supabase', 'firebase']);
const FW_SET = new Set(['react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'express', 'fastapi', 'django', 'flask', 'spring', 'spring boot', 'nestjs', 'node.js', 'nodejs', 'graphql', 'redux', 'tailwind', 'bootstrap']);
const LANG_SET = new Set(['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'bash', 'shell', 'sql', 'html', 'css', 'yaml']);
function extractSkillsFromText(text) {
    const lower = text.toLowerCase();
    const technical = [];
    const frameworks = [];
    const databases = [];
    const tools = [];
    const languages = [];
    for (const skill of SKILL_KEYWORDS) {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!new RegExp(`(?<![a-z\\d])${escaped}(?![a-z\\d])`, 'i').test(lower))
            continue;
        const display = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (DB_SET.has(skill))
            databases.push(display);
        else if (FW_SET.has(skill))
            frameworks.push(display);
        else if (LANG_SET.has(skill))
            languages.push(display);
        else
            tools.push(display);
        technical.push(display);
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
function parseCertifications(text) {
    if (!text?.trim())
        return [];
    return text.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 3)
        .slice(0, 10)
        .map(l => ({ name: l.replace(/^[-•*]\s*/, '').trim() }));
}
function parseProjects(text) {
    if (!text?.trim())
        return [];
    const results = [];
    const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length)
            continue;
        const name = lines[0].replace(/^[-•*]\s*/, '').trim();
        const desc = lines.slice(1).join(' ').trim();
        const techMatch = desc.match(/\btech(?:nologies)?(?:\s+used)?[:]\s*([^\n.]+)/i);
        results.push({
            project_name: name,
            description: desc,
            technologies_used: techMatch ? techMatch[1].split(/[,/]/).map(t => t.trim()) : [],
        });
    }
    return results.slice(0, 8);
}
async function localFallbackParse(buffer, filename) {
    logger_1.logger.info(`Using local fallback parser for: ${filename}`);
    let text = '';
    try {
        const result = await pdfParse(buffer);
        text = result.text ?? '';
        logger_1.logger.info(`pdf-parse extracted ${text.length} chars from ${filename}`);
    }
    catch (pdfErr) {
        logger_1.logger.warn(`pdf-parse failed for ${filename}: ${pdfErr.message}`);
    }
    const cleanText = text.replace(/\r\n/g, '\n').replace(/[ \t]{2,}/g, ' ');
    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
    const sections = splitIntoSections(cleanText);
    const headerText = sections.header || cleanText.slice(0, 600);
    const fullName = extractName(lines);
    const nameParts = fullName.split(/\s+/);
    const skillsText = sections.skills ? sections.skills + '\n' + cleanText : cleanText;
    return {
        personal_information: {
            full_name: fullName,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            email: extractEmail(headerText),
            phone: extractPhone(headerText),
            linkedin: extractLinkedin(cleanText),
            github: extractGithub(cleanText),
        },
        professional_summary: (sections.summary || '').trim().slice(0, 800),
        work_experience: parseExperience(sections.experience || ''),
        education: parseEducation(sections.education || ''),
        skills: extractSkillsFromText(skillsText),
        certifications: parseCertifications(sections.certifications || ''),
        projects: parseProjects(sections.projects || ''),
        metadata: {
            filename,
            parsed_at: new Date().toISOString(),
            parser_version: 'local-fallback-2.0',
            openai_used: false,
            text_length: text.length,
        },
    };
}
function normalizeApiResponse(raw) {
    if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
        const d = raw.data;
        if (d.personal_information || d.skills || d.work_experience)
            return d;
        if (d.parsedData && typeof d.parsedData === 'object')
            return d.parsedData;
    }
    if (raw.resume && typeof raw.resume === 'object')
        return raw.resume;
    if (raw.parsedData && typeof raw.parsedData === 'object')
        return raw.parsedData;
    if (raw.personal_information || raw.skills || raw.work_experience)
        return raw;
    return null;
}
async function parseResumeFromBuffer(buffer, filename, mimetype) {
    logger_1.logger.info(`Calling resume parser API for file: ${filename}`);
    const buildForm = (fieldName) => {
        const fd = new form_data_1.default();
        fd.append(fieldName, buffer, { filename, contentType: mimetype });
        return fd;
    };
    for (const fieldName of ['file', 'resume']) {
        const formData = buildForm(fieldName);
        try {
            const response = await axios_1.default.post(env_1.env.RESUME_PARSER_URL, formData, {
                headers: { ...formData.getHeaders() },
                timeout: 45000,
            });
            const raw = response.data;
            logger_1.logger.info(`Parser API response (field=${fieldName}): status=${response.status}, keys=${Object.keys(raw).join(',')}`);
            const parsed = normalizeApiResponse(raw);
            if (parsed) {
                if (!parsed.metadata) {
                    parsed.metadata = {
                        filename,
                        parsed_at: new Date().toISOString(),
                        parser_version: 'credx-api',
                        openai_used: true,
                        text_length: 0,
                    };
                }
                logger_1.logger.info(`Resume parsed successfully via API (field=${fieldName}): ${filename}`);
                return parsed;
            }
            logger_1.logger.warn(`Parser API response did not contain recognised data shape (field=${fieldName}), raw keys: ${Object.keys(raw).join(',')}`);
            break;
        }
        catch (err) {
            if (axios_1.default.isAxiosError(err)) {
                const status = err.response?.status;
                const msg = err.response?.data?.message || err.response?.data?.error || err.message;
                if (status === 422 || status === 400) {
                    logger_1.logger.warn(`Parser API rejected field="${fieldName}" (${status}: ${msg}), retrying…`);
                    continue;
                }
                logger_1.logger.warn(`Resume parser API unavailable (${status ?? 'network error'}: ${msg}), using local fallback`);
                break;
            }
            logger_1.logger.warn(`Resume parser unexpected error: ${err.message}`);
            break;
        }
    }
    return localFallbackParse(buffer, filename);
}
//# sourceMappingURL=resumeParser.js.map