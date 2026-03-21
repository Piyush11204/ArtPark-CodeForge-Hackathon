"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const html_entities_1 = require("html-entities");
const striptags_1 = __importDefault(require("striptags"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const Job_1 = require("../models/Job");
const JD_FILE = path_1.default.resolve(__dirname, '../../../Doc/leversol.job_descriptions.json');
function stripHtml(html) {
    if (!html)
        return '';
    const decoded = (0, html_entities_1.decode)(html);
    return (0, striptags_1.default)(decoded).replace(/\s+/g, ' ').trim();
}
function parseDate(val) {
    if (!val)
        return null;
    if (typeof val === 'object' && val !== null && '$date' in val) {
        return new Date(val.$date);
    }
    if (typeof val === 'string')
        return new Date(val);
    return null;
}
async function seedJobs() {
    console.log('🌱 Starting job seeding...');
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI not set in .env');
    }
    await mongoose_1.default.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('✅ MongoDB connected');
    if (!fs_1.default.existsSync(JD_FILE)) {
        throw new Error(`Job descriptions file not found at: ${JD_FILE}`);
    }
    const raw = JSON.parse(fs_1.default.readFileSync(JD_FILE, 'utf-8'));
    console.log(`📄 Loaded ${raw.length} jobs from JSON`);
    let inserted = 0;
    let skipped = 0;
    const BATCH_SIZE = 100;
    for (let i = 0; i < raw.length; i += BATCH_SIZE) {
        const batch = raw.slice(i, i + BATCH_SIZE);
        const ops = batch
            .filter((j) => j.jobLink && (j.jobTitle || j.companyName))
            .map((j) => {
            const externalId = j.externalId ||
                j._id?.$oid ||
                Buffer.from(j.jobLink || '').toString('base64').slice(0, 32);
            const rawDesc = j.jobDescription || '';
            const strippedDesc = stripHtml(rawDesc);
            return {
                updateOne: {
                    filter: { externalId },
                    update: {
                        $setOnInsert: {
                            externalId,
                            jobTitle: (j.jobTitle || '').trim(),
                            companyName: (j.companyName || '').trim(),
                            companySlug: j.companySlug || '',
                            companyIconUrl: j.companyIconUrl || undefined,
                            jobDescriptionRaw: rawDesc,
                            jobDescription: strippedDesc,
                            jobType: (['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE'].includes((j.jobType || '').toUpperCase())
                                ? j.jobType.toUpperCase()
                                : 'OTHER'),
                            workType: (['onsite', 'remote', 'hybrid'].includes(j.workType || '')
                                ? j.workType
                                : 'onsite'),
                            locationType: j.locationType || 'onsite',
                            jobLocation: j.jobLocation || '',
                            jobLink: j.jobLink || '',
                            ats: j.ats,
                            requiredSkills: j.requiredSkills || [],
                            preferredSkills: j.preferredSkills || [],
                            requiredExperience: j.requiredExperience ?? null,
                            salaryRange: {
                                min: j.salaryRange?.min ?? null,
                                max: j.salaryRange?.max ?? null,
                                currency: j.salaryRange?.currency || 'USD',
                            },
                            jobCategory: j.jobCategory,
                            isActive: j.isActive !== false,
                            skillsExtracted: (j.requiredSkills?.length ?? 0) > 0,
                            postedAt: parseDate(j.postedAt),
                            closingDate: parseDate(j.closingDate),
                        },
                    },
                    upsert: true,
                },
            };
        });
        if (ops.length === 0) {
            skipped += batch.length;
            continue;
        }
        const result = await Job_1.JobModel.bulkWrite(ops, { ordered: false });
        inserted += result.upsertedCount;
        skipped += batch.length - ops.length;
        const pct = Math.round(((i + batch.length) / raw.length) * 100);
        process.stdout.write(`\r  Progress: ${pct}% (${i + batch.length}/${raw.length})`);
    }
    console.log(`\n\n✅ Seeding complete!`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped (already exist / invalid): ${skipped}`);
    console.log(`   Total in DB: ${await Job_1.JobModel.countDocuments()}`);
    await mongoose_1.default.disconnect();
    console.log('🔌 MongoDB disconnected');
}
seedJobs().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seedJobs.js.map