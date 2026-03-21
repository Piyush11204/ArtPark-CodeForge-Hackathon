import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { decode } from 'html-entities';
import striptags from 'striptags';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { JobModel } from '../models/Job';

const JD_FILE = path.resolve(__dirname, '../../../Doc/leversol.job_descriptions.json');

interface RawJob {
  _id?: { $oid: string };
  externalId?: string;
  jobTitle?: string;
  companyName?: string;
  companySlug?: string;
  companyIconUrl?: string;
  jobDescription?: string;
  jobType?: string;
  workType?: string;
  locationType?: string;
  jobLocation?: string;
  jobLink?: string;
  ats?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  requiredExperience?: number | null;
  salaryRange?: { min: number | null; max: number | null; currency?: string };
  jobCategory?: string;
  isActive?: boolean;
  postedAt?: { $date: string } | string | null;
  closingDate?: { $date: string } | string | null;
}

function stripHtml(html: string): string {
  if (!html) return '';
  const decoded = decode(html);
  return striptags(decoded).replace(/\s+/g, ' ').trim();
}

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === 'object' && val !== null && '$date' in (val as Record<string, unknown>)) {
    return new Date((val as { $date: string }).$date);
  }
  if (typeof val === 'string') return new Date(val);
  return null;
}

async function seedJobs(): Promise<void> {
  console.log('🌱 Starting job seeding...');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set in .env');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ MongoDB connected');

  if (!fs.existsSync(JD_FILE)) {
    throw new Error(`Job descriptions file not found at: ${JD_FILE}`);
  }

  const raw = JSON.parse(fs.readFileSync(JD_FILE, 'utf-8')) as RawJob[];
  console.log(`📄 Loaded ${raw.length} jobs from JSON`);

  let inserted = 0;
  let skipped = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < raw.length; i += BATCH_SIZE) {
    const batch = raw.slice(i, i + BATCH_SIZE);

    const ops = batch
      .filter((j) => j.jobLink && (j.jobTitle || j.companyName))
      .map((j) => {
        const externalId =
          j.externalId ||
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
                jobType: (['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE'].includes(
                  (j.jobType || '').toUpperCase()
                )
                  ? j.jobType!.toUpperCase()
                  : 'OTHER') as string,
                workType: (['onsite', 'remote', 'hybrid'].includes(j.workType || '')
                  ? j.workType
                  : 'onsite') as string,
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

    const result = await JobModel.bulkWrite(ops, { ordered: false });
    inserted += result.upsertedCount;
    skipped += batch.length - ops.length;

    const pct = Math.round(((i + batch.length) / raw.length) * 100);
    process.stdout.write(`\r  Progress: ${pct}% (${i + batch.length}/${raw.length})`);
  }

  console.log(`\n\n✅ Seeding complete!`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped (already exist / invalid): ${skipped}`);
  console.log(`   Total in DB: ${await JobModel.countDocuments()}`);

  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected');
}

seedJobs().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
