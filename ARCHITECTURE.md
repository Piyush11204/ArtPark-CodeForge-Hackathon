# Project Architecture — AI-Adaptive Onboarding Engine
### ARTPARK CodeForge Hackathon

---

## Overview

Full-stack **MERN** application with a separate **Python/Flask** microservice for ML tasks. The system parses a candidate's resume, matches it against a live job description from a 1000+ job catalog, identifies skill gaps, and generates a personalized adaptive training roadmap.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + TailwindCSS + React Flow |
| Backend | Node.js + Express.js |
| Database | MongoDB (Atlas) |
| Auth | JWT (access + refresh tokens) |
| File Uploads | Cloudinary |
| Resume Parser | Live Flask API (pre-built, external) |
| ML/AI Service | Python + Flask (separate microservice) |
| Deployment | Render (backend) + Vercel (frontend) + Docker |

---

## Repository Structure

```
artpark-codeforge/
├── backend/                   # Node.js + Express API
│   ├── src/
│   │   ├── config/            # DB, Cloudinary, env
│   │   ├── middleware/        # Auth, error handler, upload
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # Express route files
│   │   ├── controllers/       # Business logic handlers
│   │   ├── services/          # External API calls, algorithms
│   │   └── utils/             # Helpers
│   ├── .env.example
│   └── package.json
│
├── frontend/                  # React (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # Axios API calls
│   │   ├── store/             # Zustand / Context state
│   │   └── types/             # TypeScript interfaces
│   └── package.json
│
├── ml-service/                # Python Flask microservice
│   ├── app.py
│   ├── modules/
│   │   ├── skill_extractor.py
│   │   ├── gap_engine.py
│   │   └── adaptive_pathing.py
│   └── requirements.txt
│
├── Doc/                       # Hackathon docs
│   ├── ARTPARK_CodeForge_Hackathon.pdf
│   ├── resume_parser.md
│   └── leversol.job_descriptions.json   # 1000+ job seed data
│
├── ARCHITECTURE.md            # This file
├── README.md
└── docker-compose.yml
```

---

## Data Flow (End-to-End)

```
User uploads Resume (PDF/DOCX)
        │
        ▼
Cloudinary  ──► stores file  ──► returns secure_url
        │
        ▼
Backend calls Live Resume Parser API
  POST https://credx-flask-gcc4gffcatcsczcd.westus-01.azurewebsites.net/parse_resume
        │
        ▼
Structured ResumeData saved to MongoDB (User Profile)
        │
        ▼
User selects a Job from 1000+ catalog (or pastes JD)
        │
        ▼
Backend: Skill Gap Engine
  CandidateSkills ──► diff ──► JobRequiredSkills
  Output: { missing[], partial[], satisfied[] }
        │
        ▼
Backend: Adaptive Pathing Algorithm
  Gap Map + Course Catalog ──► Ordered Training Pathway
  + Reasoning Trace JSON
        │
        ▼
Frontend: Roadmap Visualization (React Flow)
  Renders nodes per training module with gap annotations
```

---

---

# PHASE 1 — Backend Foundation

**Goal:** Bare-metal Express server with MongoDB, auth, and all middleware wired up.

### 1.1 Project Init

```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose dotenv cors helmet morgan bcryptjs jsonwebtoken
npm install -D nodemon typescript @types/express
```

### 1.2 Files to Create

| File | Purpose |
|---|---|
| `src/config/db.ts` | Mongoose connect to MongoDB Atlas |
| `src/config/cloudinary.ts` | Cloudinary SDK init with env keys |
| `src/config/env.ts` | Typed env loader (validates required vars) |
| `src/middleware/auth.ts` | JWT verify middleware |
| `src/middleware/errorHandler.ts` | Global async error wrapper |
| `src/middleware/upload.ts` | Multer + Cloudinary storage engine |
| `src/app.ts` | Express app setup (cors, helmet, routes mount) |
| `src/server.ts` | HTTP server entry point |

### 1.3 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESUME_PARSER_URL=https://credx-flask-gcc4gffcatcsczcd.westus-01.azurewebsites.net
```

### 1.4 Auth Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create user (name, email, password) |
| POST | `/api/auth/login` | Return access + refresh JWT |
| POST | `/api/auth/refresh` | Rotate refresh token |
| GET | `/api/auth/me` | Return current user profile |

### 1.5 MongoDB Models

**User**
```
_id, name, email, passwordHash, role (candidate/admin),
createdAt, updatedAt
```

---

---

# PHASE 2 — Job Data Layer

**Goal:** Seed the 1000+ jobs from `leversol.job_descriptions.json` into MongoDB and expose search/filter APIs.

### 2.1 Job MongoDB Model

```typescript
{
  _id: ObjectId,                  // keep original $oid from seed
  jobTitle: String,
  companyName: String,
  companySlug: String,
  jobDescription: String,         // raw HTML — strip on read
  jobType: String,                // INTERNSHIP | FULL_TIME | PART_TIME
  workType: String,               // onsite | remote | hybrid
  locationType: String,
  jobLocation: String,
  requiredSkills: [String],       // parsed by ML service (Phase 5)
  preferredSkills: [String],
  requiredExperience: Number,
  salaryRange: { min, max, currency },
  jobLink: String,
  isActive: Boolean,
  postedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 Seed Script

```
backend/src/scripts/seedJobs.ts
```
- Reads `Doc/leversol.job_descriptions.json`
- Strips HTML from `jobDescription` using `html-entities` + `striptags`
- Bulk upserts into `jobs` collection (unique on `externalId`)

### 2.3 Job API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/jobs` | List jobs — paginated (page, limit) |
| GET | `/api/jobs/search` | Full-text search by title / company |
| GET | `/api/jobs/filter` | Filter by workType, jobType, location |
| GET | `/api/jobs/:id` | Single job detail |
| GET | `/api/jobs/categories` | Distinct job categories for UI dropdowns |

### 2.4 MongoDB Indexes

```javascript
jobTitle: "text", jobDescription: "text"   // full-text search
companySlug: 1
workType: 1, jobType: 1                    // filter
isActive: 1
```

---

---

# PHASE 3 — Resume Upload & Parse

**Goal:** Accept a resume file, upload to Cloudinary, call the live parser API, store structured data against the user.

### 3.1 Resume MongoDB Model

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  cloudinaryUrl: String,          // public_url from Cloudinary
  cloudinaryPublicId: String,
  parsedData: {
    personal_information: { full_name, email, phone, location, linkedin },
    professional_summary: String,
    work_experience: [{ company, position, duration, description }],
    education: [{ degree, institution, year, gpa }],
    skills: {
      technical_skills: [String],
      soft_skills: [String],
      frameworks: [String],
      databases: [String],
      tools_and_technologies: [String]
    },
    certifications: [{ name, issuing_organization, issue_date }],
    projects: [{ project_name, description, technologies_used }],
    certifications: [...],
    metadata: { filename, parsed_at, parser_version, openai_used }
  },
  normalizedSkills: [String],     // flat array — built in Phase 4
  parserVersion: String,
  parsedAt: Date,
  createdAt: Date
}
```

### 3.2 Upload Flow

```
Client  ──► POST /api/resume/upload (multipart/form-data)
              │
              ├── Multer validates type (pdf/docx/txt) + size (≤5MB)
              ├── Cloudinary upload (resource_type: raw)
              │     returns { secure_url, public_id }
              ├── Call Live Parser API
              │     POST /parse_resume  { file: stream / url }
              ├── Store Resume doc in MongoDB
              └── Return { resumeId, parsedData }
```

### 3.3 Resume API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/resume/upload` | ✅ | Upload + parse resume |
| GET | `/api/resume/me` | ✅ | Get current user's latest resume |
| GET | `/api/resume/:id` | ✅ | Get specific resume by ID |
| DELETE | `/api/resume/:id` | ✅ | Delete resume (also removes from Cloudinary) |

### 3.4 Live Parser API Contract

```
POST https://credx-flask-gcc4gffcatcsczcd.westus-01.azurewebsites.net/parse_resume
Content-Type: multipart/form-data
Body: { file: <binary>, use_openai: "true" }

Response:
{
  "status": "success",
  "data": { ...ResumeData }
}
```

---

---

# PHASE 4 — Skill Gap Engine

**Goal:** Compare candidate's parsed skills against a selected job's requirements and produce a gap report.

### 4.1 Skill Normalization

Before comparison, all skills are normalized:
- Lowercase + trim
- Alias mapping (e.g. `"js" → "javascript"`, `"reactjs" → "react"`)
- Stored as `normalizedSkills[]` on the Resume model (computed at parse time)

Alias map lives in: `backend/src/config/skillAliases.ts`

### 4.2 Gap Computation Algorithm

```
function computeGap(candidateSkills[], jobRequiredSkills[], jobPreferredSkills[]):

  missing  = requiredSkills.filter(s => !candidateSkills.includes(s))
  partial  = preferredSkills.filter(s => !candidateSkills.includes(s))
  satisfied = requiredSkills.filter(s => candidateSkills.includes(s))

  gapScore = (missing.length / requiredSkills.length) * 100

  return {
    missing,       // must-learn
    partial,       // nice-to-have
    satisfied,
    gapScore,      // 0–100% (100 = no overlap at all)
    matchScore     // 100 - gapScore
  }
```

For jobs in the seed data that have empty `requiredSkills[]`, the ML Service (Phase 5) will extract skills from the raw `jobDescription` text.

### 4.3 Gap Report MongoDB Model

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  resumeId: ObjectId,
  jobId: ObjectId,
  gapReport: {
    missing: [String],
    partial: [String],
    satisfied: [String],
    gapScore: Number,
    matchScore: Number
  },
  pathway: ObjectId (ref: Pathway),   // linked in Phase 5
  createdAt: Date
}
```

### 4.4 Gap API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/gap/analyze` | ✅ | `{ resumeId, jobId }` → returns gap report |
| GET | `/api/gap/:id` | ✅ | Fetch saved gap report |
| GET | `/api/gap/history` | ✅ | User's gap analysis history |

---

---

# PHASE 5 — Adaptive Pathing Algorithm

**Goal:** Convert the gap report into an ordered, dependency-aware learning pathway with reasoning traces.

### 5.1 Course Catalog Model

```typescript
{
  _id: ObjectId,
  title: String,
  skill: String,           // normalized skill this module covers
  skillCategory: String,   // e.g. "framework", "language", "tool"
  prerequisites: [String], // skills that should be learned first
  estimatedHours: Number,
  level: "beginner" | "intermediate" | "advanced",
  resourceUrl: String,
  provider: String,        // "Udemy", "Coursera", "YouTube", etc.
  tags: [String]
}
```

Seed file: `backend/src/scripts/seedCourses.ts`

### 5.2 Adaptive Pathing Algorithm

Uses a **topological sort on a directed dependency graph**:

```
1. Build a DAG where nodes = skills-to-learn (missing + partial)
2. Add directed edges from prerequisite → dependent skill
3. Topological sort gives a valid learning order
4. Score each skill by: gap severity × estimated ROI
5. Map each skill node → course catalog entry
6. Output: ordered array of { skill, course, reason, estimatedHours }
```

Reasoning trace format per step:
```json
{
  "step": 1,
  "skill": "react",
  "reason": "Required for the role and missing from your profile. JavaScript prerequisite is already satisfied.",
  "course": "React - The Complete Guide (Udemy)",
  "estimatedHours": 40,
  "priority": "critical"
}
```

### 5.3 Pathway MongoDB Model

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  gapReportId: ObjectId,
  jobId: ObjectId,
  steps: [{
    order: Number,
    skill: String,
    courseId: ObjectId,
    reason: String,
    estimatedHours: Number,
    priority: "critical" | "recommended" | "optional",
    status: "pending" | "in-progress" | "completed"
  }],
  totalEstimatedHours: Number,
  generatedAt: Date
}
```

### 5.4 Pathway API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/pathway/generate` | ✅ | `{ gapReportId }` → generate pathway |
| GET | `/api/pathway/:id` | ✅ | Fetch pathway with reasoning trace |
| PATCH | `/api/pathway/:id/step/:stepId` | ✅ | Update step status (progress tracking) |
| GET | `/api/pathway/me` | ✅ | All pathways for current user |

---

---

# PHASE 6 — Python ML Microservice (Separate)

**Goal:** Skill extraction from raw job description HTML using NLP — feeds Phase 4 for jobs with empty `requiredSkills`.

### 6.1 Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/extract-skills` | `{ text }` → `{ skills: [String] }` |
| POST | `/similarity-score` | `{ skills_a, skills_b }` → cosine similarity |
| POST | `/enhance-gap` | Advanced gap report using embeddings |

### 6.2 Models Used

- **Skill Extraction**: `en_core_web_sm` (spaCy NER) + custom skill dictionary
- **Similarity**: `sentence-transformers/all-MiniLM-L6-v2` (Hugging Face)
- **Fallback**: OpenAI API (if OPENAI_API_KEY present)

### 6.3 Integration with Backend

Backend calls ML service internally (server-to-server):
```
POST http://ml-service:6000/extract-skills
Body: { "text": "<stripped job description>" }
```
Result is cached on the Job document (`requiredSkills` field update).

---

---

# PHASE 7 — Frontend (React + Vite)

**Goal:** Full UI — auth, resume upload, job picker, gap visualization, roadmap.

### 7.1 Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Hero, how-it-works, CTA |
| `/login` | Login | JWT auth form |
| `/register` | Register | Sign up |
| `/dashboard` | Dashboard | User's gap reports + pathways |
| `/onboard` | Onboard | Step-by-step flow (upload → pick job → view gap → view roadmap) |
| `/onboard/upload` | Step 1 | Resume upload with drag-and-drop |
| `/onboard/jobs` | Step 2 | Job catalog browser + search |
| `/onboard/gap` | Step 3 | Skill gap visualization |
| `/onboard/roadmap` | Step 4 | Adaptive pathway (React Flow) |
| `/pathway/:id` | Pathway Detail | Full roadmap + progress tracking |
| `/jobs` | Job Browser | Browse + filter 1000+ jobs |

### 7.2 Key Components

| Component | Library | Description |
|---|---|---|
| `<ResumeUploader />` | react-dropzone | Drag-and-drop resume upload |
| `<JobSearch />` | built-in | Search + filter job catalog |
| `<GapChart />` | recharts | Donut chart: satisfied vs missing vs partial |
| `<SkillBadge />` | TailwindCSS | Color-coded skill chip (green/orange/red) |
| `<RoadmapFlow />` | react-flow | DAG visualization of training pathway |
| `<StepCard />` | TailwindCSS | Single pathway step with reasoning trace |
| `<ProgressTracker />` | built-in | Mark steps complete, hours remaining |

### 7.3 State Management

- **Zustand** for global state (auth user, active resume, active job)
- **React Query (TanStack Query)** for API cache + loading/error states

### 7.4 API Service Layer

`frontend/src/services/`
```
auth.service.ts      — login, register, refreshToken
resume.service.ts    — upload, getMyResume
jobs.service.ts      — search, filter, getById
gap.service.ts       — analyze, getReport
pathway.service.ts   — generate, getPathway, updateStep
```

---

---

# PHASE 8 — Integration, Docker & Deployment

**Goal:** Wire all services together, add Docker, deploy.

### 8.1 docker-compose.yml Services

```yaml
services:
  backend:        # Node.js Express — port 5000
  frontend:       # React (nginx) — port 3000
  ml-service:     # Python Flask — port 6000
```

### 8.2 Environment Strategy

| Service | .env file |
|---|---|
| backend | `backend/.env` |
| frontend | `frontend/.env` (VITE_ prefix) |
| ml-service | `ml-service/.env` |

### 8.3 Deployment Plan

| Service | Platform |
|---|---|
| Backend | Render (free tier, Docker) |
| Frontend | Vercel |
| ML Service | Render (separate service) |
| Database | MongoDB Atlas (free M0) |
| File Storage | Cloudinary (free tier) |

---

---

## Build Order Summary

```
Phase 1  ──  Backend Foundation          (Express + MongoDB + Auth + Cloudinary config)
Phase 2  ──  Job Data Layer              (Job model + seed 1000+ jobs + search APIs)
Phase 3  ──  Resume Upload & Parse       (Cloudinary upload + live parser API integration)
Phase 4  ──  Skill Gap Engine            (Normalization + diff algorithm + gap report APIs)
Phase 5  ──  Adaptive Pathing            (Course catalog + DAG topological sort + pathway APIs)
Phase 6  ──  Python ML Microservice      (spaCy NER skill extraction + similarity scoring)
Phase 7  ──  Frontend                    (React + all pages + React Flow roadmap)
Phase 8  ──  Integration & Deploy        (Docker Compose + Render + Vercel)
```

---

## API Base URLs

| Environment | Backend | ML Service |
|---|---|---|
| Local | `http://localhost:5000` | `http://localhost:6000` |
| Production | `https://artpark-backend.onrender.com` | `https://artpark-ml.onrender.com` |
| Resume Parser (live, pre-built) | `https://credx-flask-gcc4gffcatcsczcd.westus-01.azurewebsites.net` | — |

---

## Evaluation Criteria Mapping

| Criterion | Phases That Address It |
|---|---|
| Technical Sophistication (20%) | Phase 4, 5, 6 |
| Grounding & Reliability (15%) | Phase 5 (course catalog), Phase 4 (strict diff) |
| Reasoning Trace (10%) | Phase 5 (per-step reason field) |
| Product Impact (10%) | Phase 4 + 5 (targeted, non-redundant training) |
| User Experience (15%) | Phase 7 (React Flow, step tracker, gap chart) |
| Cross-Domain Scalability (10%) | Phase 2 (1000+ diverse jobs), Phase 6 (NLP-based extraction) |
| Communication & Documentation (20%) | README.md, this file, inline code comments |
