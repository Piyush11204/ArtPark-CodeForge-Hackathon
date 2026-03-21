import axios from 'axios';
import FormData from 'form-data';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse');
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { IParsedData, IParsedSkills, IWorkExperience, IEducation, ICertification, IProject } from '../models/Resume';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : '';
}

function extractPhone(text: string): string {
  const m = text.match(/(?:\+?\d[\s\-.]?){9,14}/);
  return m ? m[0].trim() : '';
}

function extractLinkedin(text: string): string {
  const m = text.match(/linkedin\.com\/in\/[\w\-%.]+/i);
  return m ? `https://${m[0]}` : '';
}

function extractGithub(text: string): string {
  const m = text.match(/github\.com\/[\w\-%.]+/i);
  return m ? `https://${m[0]}` : '';
}

/** First non-contact-info line that looks like a proper name */
function extractName(lines: string[]): string {
  for (const line of lines.slice(0, 8)) {
    const l = line.trim();
    if (!l) continue;
    // Skip lines that are emails, URLs, phone-like, or all-caps section headers > 3 words
    if (l.includes('@')) continue;
    if (/^https?:\/\//.test(l)) continue;
    if (/^\+?[\d\s()\-]{7,}$/.test(l)) continue;
    if (l.length > 70) continue;
    // A name usually has 2–4 words, each starting with a capital (or all-caps short)
    const words = l.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && /[A-Z]/.test(l)) return l;
  }
  return '';
}

// ─── Section splitter ─────────────────────────────────────────────────────────

const SECTION_RE: Record<string, RegExp> = {
  summary:        /^(summary|professional summary|objective|career objective|about me|profile)\s*$/im,
  experience:     /^(experience|work experience|employment|professional experience|work history|career)\s*$/im,
  education:      /^(education|academic background|qualifications)\s*$/im,
  skills:         /^(skills|technical skills|core competencies|competencies|expertise|technologies|key skills)\s*$/im,
  projects:       /^(projects|personal projects|notable projects|side projects|key projects)\s*$/im,
  certifications: /^(certifications|certificates|licenses & certifications|licenses|achievements|awards)\s*$/im,
};

type SectionMap = Record<string, string>;

function splitIntoSections(text: string): SectionMap {
  const lines = text.split('\n');
  const sections: SectionMap = { header: '' };
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

// ─── Work experience parser ───────────────────────────────────────────────────

const DATE_RE = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*\.?\s*\d{4}|\d{4}/gi;
const DATE_RANGE_RE = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})\s*[-–—to]+\s*(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4}|present|current|now)/gi;

function parseExperience(text: string): IWorkExperience[] {
  if (!text?.trim()) return [];
  const results: IWorkExperience[] = [];
  // Split on blank lines or date-range lines
  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) continue;

    let duration = '';
    let titleLine = '';
    let companyLine = '';
    const descLines: string[] = [];

    for (const line of lines) {
      const rangeMatch = line.match(DATE_RANGE_RE);
      if (rangeMatch && !duration) {
        duration = rangeMatch[0];
        // The same line may also contain title/company
        const rest = line.replace(DATE_RANGE_RE, '').replace(/[-–—|,]+/g, ' ').trim();
        if (rest) titleLine = titleLine || rest;
      } else if (!titleLine) {
        titleLine = line;
      } else if (!companyLine && !line.match(DATE_RE)) {
        companyLine = line;
      } else {
        descLines.push(line);
      }
    }

    if (!titleLine && !companyLine) continue;

    // Try to split "Title at Company" or "Title | Company"
    const atMatch = titleLine.match(/^(.+?)\s+(?:at|@|[-–|])\s+(.+)$/i);
    if (atMatch && !companyLine) {
      results.push({
        position: atMatch[1].trim(),
        company: atMatch[2].trim(),
        duration,
        description: descLines.join(' ').trim(),
      });
    } else {
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

// ─── Education parser ─────────────────────────────────────────────────────────

const DEGREE_RE = /\b(bachelor|master|b\.?s\.?|m\.?s\.?|b\.?e\.?|m\.?e\.?|b\.?tech\.?|m\.?tech\.?|phd|ph\.?d\.?|diploma|associate|mba|b\.?a\.?|m\.?a\.?)\b/i;

function parseEducation(text: string): IEducation[] {
  if (!text?.trim()) return [];
  const results: IEducation[] = [];
  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    let degree = '';
    let institution = '';
    let year = '';
    let field = '';

    for (const line of lines) {
      const yearM = line.match(/\b(19|20)\d{2}\b/);
      if (yearM && !year) year = yearM[0];

      const degM = line.match(DEGREE_RE);
      if (degM && !degree) {
        degree = line;
        // field of study: "in Computer Science" or "of Science in ..."
        const fieldM = line.match(/\bin\s+([A-Z][a-zA-Z\s]+)/);
        if (fieldM) field = fieldM[1].trim();
      } else if (!institution && !degM) {
        institution = line.replace(/\b(19|20)\d{2}\b.*/, '').trim();
      }
    }

    if (degree || institution) {
      results.push({ degree: degree || '', institution: institution || '', year, field_of_study: field });
    }
  }
  return results.slice(0, 5);
}

// ─── Skills parser ────────────────────────────────────────────────────────────

const SKILL_KEYWORDS: string[] = [
  'javascript','typescript','python','java','c++','c#','go','rust','ruby','php','swift','kotlin','scala',
  'r','matlab','bash','shell','sql','html','css','xml','json','yaml',
  'react','angular','vue','next.js','nuxt','svelte','express','fastapi','django','flask','spring',
  'spring boot','nestjs','node.js','nodejs','graphql','rest','grpc','tailwind','bootstrap','redux',
  'mongodb','postgresql','mysql','sqlite','redis','elasticsearch','dynamodb','cassandra','neo4j','supabase','firebase',
  'aws','azure','gcp','docker','kubernetes','terraform','ansible','jenkins','github actions','ci/cd','git','linux',
  'nginx','webpack','vite','jest','pytest','cypress','selenium','postman',
  'tensorflow','pytorch','keras','scikit-learn','pandas','numpy','openai','langchain','hugging face',
  'machine learning','deep learning','nlp','computer vision','data science','data analysis',
  'figma','jira','confluence','agile','scrum','trello','notion','slack',
  'salesforce','hubspot','zendesk','crm','saas','b2b','excel','power bi','tableau',
];

const DB_SET = new Set(['mongodb','postgresql','mysql','sqlite','redis','elasticsearch','dynamodb','cassandra','neo4j','supabase','firebase']);
const FW_SET = new Set(['react','angular','vue','next.js','nuxt','svelte','express','fastapi','django','flask','spring','spring boot','nestjs','node.js','nodejs','graphql','redux','tailwind','bootstrap']);
const LANG_SET = new Set(['javascript','typescript','python','java','c++','c#','go','rust','ruby','php','swift','kotlin','scala','r','matlab','bash','shell','sql','html','css','yaml']);

function extractSkillsFromText(text: string): IParsedSkills {
  const lower = text.toLowerCase();
  const technical: string[] = [];
  const frameworks: string[] = [];
  const databases: string[] = [];
  const tools: string[] = [];
  const languages: string[] = [];

  for (const skill of SKILL_KEYWORDS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`(?<![a-z\\d])${escaped}(?![a-z\\d])`, 'i').test(lower)) continue;
    const display = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (DB_SET.has(skill)) databases.push(display);
    else if (FW_SET.has(skill)) frameworks.push(display);
    else if (LANG_SET.has(skill)) languages.push(display);
    else tools.push(display);
    technical.push(display);
  }

  const dedup = (arr: string[]) => [...new Set(arr)];
  return {
    technical_skills: dedup(technical),
    frameworks: dedup(frameworks),
    databases: dedup(databases),
    tools_and_technologies: dedup(tools),
    languages: dedup(languages),
    soft_skills: [],
  };
}

// ─── Certifications parser ────────────────────────────────────────────────────

function parseCertifications(text: string): ICertification[] {
  if (!text?.trim()) return [];
  return text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3)
    .slice(0, 10)
    .map(l => ({ name: l.replace(/^[-•*]\s*/, '').trim() }));
}

// ─── Projects parser ──────────────────────────────────────────────────────────

function parseProjects(text: string): IProject[] {
  if (!text?.trim()) return [];
  const results: IProject[] = [];
  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
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

// ─── Main fallback entry ──────────────────────────────────────────────────────

async function localFallbackParse(buffer: Buffer, filename: string): Promise<IParsedData> {
  logger.info(`Using local fallback parser for: ${filename}`);

  let text = '';
  try {
    const result = await pdfParse(buffer);
    text = result.text ?? '';
    logger.info(`pdf-parse extracted ${text.length} chars from ${filename}`);
  } catch (pdfErr) {
    logger.warn(`pdf-parse failed for ${filename}: ${(pdfErr as Error).message}`);
  }

  // Normalise whitespace a bit but keep structure
  const cleanText = text.replace(/\r\n/g, '\n').replace(/[ \t]{2,}/g, ' ');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  const sections = splitIntoSections(cleanText);
  const headerText = sections.header || cleanText.slice(0, 600);

  const fullName = extractName(lines);
  const nameParts = fullName.split(/\s+/);

  // Skills: prefer dedicated skills section, fallback to full text
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

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Normalise the raw API response into our IParsedData shape.
 * Handles the CredX /api/resume/parse response as well as the old Flask shape.
 *
 * Known response shapes we handle:
 *   { status, data: { ... } }                      ← old Flask shape
 *   { success, data: { ... } }                      ← CredX shape A
 *   { success, resume: { ... } }                    ← CredX shape B
 *   { data: { parsedData: { ... } } }               ← CredX shape C
 *   { parsedData: { ... } }                         ← CredX shape D
 *   { ... }   (flat — the object itself IS the data) ← CredX shape E
 */
function normalizeApiResponse(raw: Record<string, unknown>): IParsedData | null {
  // --- shape A / old Flask ---
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    const d = raw.data as Record<string, unknown>;
    if (d.personal_information || d.skills || d.work_experience) return d as unknown as IParsedData;
    // nested parsedData inside data
    if (d.parsedData && typeof d.parsedData === 'object') return d.parsedData as unknown as IParsedData;
  }
  // --- shape B ---
  if (raw.resume && typeof raw.resume === 'object') return raw.resume as unknown as IParsedData;
  // --- shape D ---
  if (raw.parsedData && typeof raw.parsedData === 'object') return raw.parsedData as unknown as IParsedData;
  // --- shape E: the root object itself ---
  if (raw.personal_information || raw.skills || raw.work_experience) return raw as unknown as IParsedData;
  return null;
}

/**
 * Calls the live CredX resume parser API with a file buffer.
 * Falls back to local text extraction if the external service is unavailable.
 */
export async function parseResumeFromBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<IParsedData> {
  logger.info(`Calling resume parser API for file: ${filename}`);

  const buildForm = (fieldName: string) => {
    const fd = new FormData();
    fd.append(fieldName, buffer, { filename, contentType: mimetype });
    return fd;
  };

  // Try with field name 'file' first, then 'resume' as fallback
  for (const fieldName of ['file', 'resume']) {
    const formData = buildForm(fieldName);
    try {
      const response = await axios.post(
        env.RESUME_PARSER_URL,          // full URL — no suffix appended
        formData,
        {
          headers: { ...formData.getHeaders() },
          timeout: 45000,
        }
      );

      const raw = response.data as Record<string, unknown>;
      logger.info(`Parser API response (field=${fieldName}): status=${response.status}, keys=${Object.keys(raw).join(',')}`);

      const parsed = normalizeApiResponse(raw);
      if (parsed) {
        // Ensure mandatory metadata field is present
        if (!parsed.metadata) {
          (parsed as IParsedData).metadata = {
            filename,
            parsed_at: new Date().toISOString(),
            parser_version: 'credx-api',
            openai_used: true,
            text_length: 0,
          };
        }
        logger.info(`Resume parsed successfully via API (field=${fieldName}): ${filename}`);
        return parsed;
      }

      logger.warn(`Parser API response did not contain recognised data shape (field=${fieldName}), raw keys: ${Object.keys(raw).join(',')}`);
      // Don't retry with different field name if we got a 2xx but unrecognised shape — fall through to fallback
      break;

    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.response?.data?.error || err.message;
        if (status === 422 || status === 400) {
          // Wrong field name — retry with next field name
          logger.warn(`Parser API rejected field="${fieldName}" (${status}: ${msg}), retrying…`);
          continue;
        }
        logger.warn(`Resume parser API unavailable (${status ?? 'network error'}: ${msg}), using local fallback`);
        break;
      }
      // Non-axios error (e.g. timeout that isn't axios) — fall through
      logger.warn(`Resume parser unexpected error: ${(err as Error).message}`);
      break;
    }
  }

  // All API attempts failed — use local PDF parser
  return localFallbackParse(buffer, filename);
}

