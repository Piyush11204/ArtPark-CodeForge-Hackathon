# AdaptLearn — AI-Adaptive Onboarding Engine
### ARTPARK CodeForge Hackathon 2026 | Submission Document

---

## Executive Summary

**AdaptLearn** is a fully automated, AI-driven onboarding and career readiness platform that turns a raw resume and a target job into a personalized, prerequisite-aware learning roadmap — in under 60 seconds. It replaces generic, one-size-fits-all training curricula with laser-focused, data-driven skill development plans tailored to each individual.

The platform is production-ready, containerized, and deployable in a single command.

---

## Problem Statement

Traditional corporate and self-directed onboarding suffers from three fundamental failures:

- **Experienced hires** are forced to sit through curriculum they already mastered, wasting weeks.
- **Beginners** are overwhelmed by advanced modules served out of sequence, causing disengagement and dropout.
- **HR and learning teams** have no data-driven mechanism to personalize development paths per individual — decisions are made on gut feel or templated programs.

The result: high onboarding costs, slow time-to-productivity, and talent that leaves before reaching full value.

---

## Solution

AdaptLearn solves this through a five-stage intelligent pipeline:

1. **Parse** — Upload a PDF or DOCX resume. A multi-layer NLP pipeline extracts structured personal data, work history, education, certifications, projects, and a normalized, categorized skill inventory.
2. **Match** — Browse and select from a catalog of **1,369 real, web-scraped job descriptions** across diverse industries and roles.
3. **Analyze** — The Skill Gap Engine diffs your skill profile against the role's requirements using skill normalization, alias resolution, synonym matching, and semantic similarity powered by sentence-transformers. Every skill is classified into one of four buckets: **Missing**, **Partial**, **Satisfied**, or **Transferable**.
4. **Roadmap** — The Adaptive Pathing Algorithm builds a topologically sorted, prerequisite-aware learning pathway over a **web-scraped and curated course catalog**, prioritized by gap severity.
5. **Track** — An interactive dashboard lets you mark individual roadmap steps as Pending, In-Progress, or Completed and visualizes your overall progress toward role readiness.

---

## Unique Selling Points (USPs)

### 1. Dual-Source Data Pipeline — 100% Web-Scraped & Real
Unlike competitors that rely on synthetic or hand-curated dummy data, every job description and course in the platform is **real-world data obtained through web scraping**:

- **1,369 Job Descriptions** — scraped and normalized from Leversol, a live job aggregator. Each entry includes company name, job title, work type, location, job type, required skills, preferred skills, salary range, and the full job description. These were HTML-stripped, decoded, and indexed with MongoDB full-text search for instant retrieval.
- **Course Catalog** — built through a two-phase ingestion pipeline. Phase 1 scrapes and upserts a comprehensive list of real courses with verified URLs (Udemy, Coursera, freeCodeCamp, official docs). Phase 2 calls the **Coursera public REST API** to discover additional courses for any skill under-represented in the catalog, ensuring coverage across the full skill taxonomy. The final catalog spans languages, frameworks, databases, cloud platforms, AI/ML tools, DevOps tools, and soft skills — each tagged with estimated hours, difficulty level, and prerequisite chains.

### 2. Three-Layer AI/ML Intelligence Stack
The platform embeds AI at every stage of the pipeline, not just as a demo feature:

- **spaCy NER (en_core_web_sm)** — Named Entity Recognition extracts technical skill tokens from free-form resume and job description text, catching skills that simple keyword lists would miss.
- **sentence-transformers (all-MiniLM-L6-v2)** — Generates high-quality semantic embeddings for skill sets and computes cosine similarity. This catches near-synonym matches ("Node.js" vs "Node" vs "NodeJS"), prevents false negatives in gap analysis, and produces accurate skill match scores without requiring exact string equality.
- **OpenAI API (optional fallback)** — For complex or ambiguous skill extraction tasks, the system can optionally escalate to an LLM for richer output. The architecture gracefully degrades to local extraction if the API key is absent.
- **Local Keyword Extractor (zero-latency fallback)** — A curated keyword dictionary covering 200+ technical skills ensures the gap engine works reliably even when the ML microservice is unavailable, providing resilience and availability guarantees.
- **Skill Alias & Synonym Resolution** — A purpose-built alias map normalizes over 80 common skill variants ("js" → "javascript", "k8s" → "kubernetes", "tailwind" → "tailwindcss") and a synonym graph prevents the same skill listed under different names from creating false gaps.
- **Skill Expansion Engine** — Composite skills like "MERN Stack" are automatically expanded to their component skills (MongoDB, Express, React, Node.js) so that a candidate's bundled experience is correctly credited.

### 3. Prerequisite-Aware Adaptive Pathing (DAG-Based)
The roadmap is not a simple skill list — it is a **Directed Acyclic Graph (DAG)** topologically sorted via DFS traversal. Before recommending any course, the engine:
- Checks whether the candidate already satisfies prerequisite skills (e.g., don't recommend React before JavaScript).
- Orders learning steps so foundational skills always appear before advanced ones.
- Prioritizes skills by gap severity: **Critical** (missing + high job weight), **Recommended** (partial or preferred), **Optional** (nice-to-have).
- Attaches transparent **reasoning traces** to every step, explaining exactly why each skill is included and what pre-existing knowledge the candidate can leverage.

### 4. Production-Grade Security Architecture
Security is not bolted on — it is baked into every layer:
- **JWT Access + Refresh Token Rotation** — Short-lived access tokens (15 min) with rotating, single-use refresh tokens (7 days) stored server-side. Tokens are invalidated on logout.
- **bcrypt Password Hashing** — 12-round salt prevents brute-force and rainbow table attacks.
- **Helmet.js** — Sets all security-critical HTTP headers (CSP, HSTS, X-Frame-Options, etc.) out of the box.
- **Rate Limiting** — Global limiter (200 req / 15 min) and a tighter auth limiter (20 req / 15 min) prevent credential stuffing and brute-force attacks on login/register endpoints.
- **Input Validation** — All user inputs are validated with express-validator before reaching business logic. Malformed requests are rejected at the middleware boundary.
- **CORS Policy** — Strict allowlist of trusted frontend origins.
- **File Upload Hardening** — MIME-type whitelist (PDF, DOCX only), max file size enforcement, in-memory-only processing (no temp files written to disk), and Cloudinary secure storage.

### 5. Nginx-Powered Frontend with Intelligent Proxy
The React SPA is compiled into static assets and served through **Nginx** with three critical behaviors built in:
- **Reverse Proxy** — All `/api/` requests from the browser are transparently proxied to the Node.js backend container, eliminating CORS issues in production and exposing a single origin to users.
- **SPA Catch-All** — Any non-asset URL (e.g., `/dashboard`, `/pathway/123`) is served `index.html`, allowing React Router to handle client-side navigation without 404s.
- **Aggressive Asset Caching** — Static assets (JS, CSS, fonts, images) are served with a 1-year `Cache-Control: public, immutable` header, maximizing performance and reducing server load.

### 6. Zero-Configuration Docker Deployment
The entire three-tier application — backend API, React frontend, and Python ML microservice — is containerized and orchestrated with **Docker Compose**. Key capabilities:
- **Single-Command Startup** — `docker compose up --build` brings up all three services with correct environment wiring, network isolation, and container naming.
- **Health-Check Orchestration** — The ML microservice exposes a `/health` endpoint; Docker Compose health checks ensure the backend only starts **after the ML service is confirmed healthy**, preventing startup race conditions.
- **Service Health Monitoring** — All containers are configured with `restart: unless-stopped`, ensuring automatic recovery from crashes without manual intervention.
- **Internal Network Isolation** — All inter-service communication happens over a private Docker bridge network (`artpark-net`), so internal ports are never exposed to the public internet.
- **Environment-Driven Configuration** — All secrets (MongoDB URI, JWT secrets, Cloudinary credentials, OpenAI key) are injected at runtime via environment variables, with no credentials baked into images.

### 7. Resilient Multi-Source Resume Parsing
Resume parsing operates through a deliberate layered fallback strategy:
- **Primary**: The resume buffer is sent to a live Azure-hosted NLP microservice that returns richly structured data: personal info, work history with dates, education, certifications, projects, and categorized skills (technical, soft, frameworks, databases, tools).
- **Secondary Fallback**: If the external parser is unavailable, the system extracts raw text locally using `pdf-parse` and runs a section-splitting regex parser to reconstruct the structured output from headings like "Experience", "Skills", "Education".
- **Post-Parse Editing**: The UI renders the parsed resume data as an editable form, allowing candidates to correct OCR errors or add skills before running gap analysis — ensuring the input to the AI is always accurate.

### 8. Real-Time Progress Tracking with Visual Analytics
The dashboard is not a static display — it is a live operational interface:
- **Gap Score & Match Score rings** — SVG-rendered circular progress indicators show the candidate's current match percentage and gap severity at a glance.
- **Skill distribution bar** — A proportional bar chart breaks down Satisfied / Partial / Missing skill counts visually.
- **Roadmap timeline** — Each learning step is rendered as a chronological timeline with collapsible detail cards. Steps can be toggled between Pending → In-Progress → Completed with a single click.
- **Overall completion tracking** — As steps are marked complete, the pathway's `progressPercent` and `completedHours` fields update, giving candidates a quantified view of their progress.

---

## Complete Feature List

### Resume Management
- Upload PDF or DOCX resumes via drag-and-drop or file picker
- Multi-layer NLP extraction: personal info, work experience, education, certifications, projects, and categorized skills
- Post-parse editor: correct or enrich parsed data before analysis
- Multiple resume management: store and switch between several resume versions
- Cloudinary v2 secure cloud storage with permanent URL access
- Re-parse support: update parsed data without re-uploading the file
- Secure deletion: removes both the DB record and Cloudinary asset

### Job Discovery
- 1,369 real job descriptions from web-scraped Leversol dataset
- MongoDB full-text search index for instant keyword-based job discovery
- Filter by work type (remote / onsite / hybrid), job type (full-time, contract, internship), and company
- Paginated browsing with up to 50 results per page
- Direct link to original job posting on the company's ATS
- View count tracking per job listing
- Category breakdown endpoint for building dynamic filter UIs

### Skill Gap Analysis
- Four-tier skill classification: Missing, Partial, Satisfied, Transferable
- Skill normalization and alias resolution across 80+ common variants
- Synonym-aware matching via a bidirectional synonym graph
- Skill expansion for composite skills (MERN, MEAN, LAMP stacks, etc.)
- ML-enhanced extraction: spaCy NER extracts skills directly from raw job description text
- Semantic similarity scoring via sentence-transformers for near-match detection
- Gap Score (how far the candidate is from ready) and Match Score (overall compatibility)
- Per-skill reasoning traces explaining every classification decision
- Persistent gap report history with job and resume cross-references

### Adaptive Learning Pathway
- DAG-based topological sort ensures prerequisites are always taught first
- Three-tier priority weighting: Critical → Recommended → Optional
- Course matching: each pathway step links to a specific real course with provider and URL
- Estimated hours per step and total pathway duration
- Per-candidate customization: already-satisfied skills are excluded from the plan
- Upsert logic: regenerating a pathway replaces the previous one without creating orphaned records
- Step status API for real-time progress updates

### Course Catalog
- Web-scraped from real providers: Udemy, Coursera, freeCodeCamp, official docs
- Coursera public REST API integration for supplementary course discovery
- Coverage: languages, frameworks, databases, cloud, AI/ML, DevOps tools, soft skills
- Prerequisite chains for each course (e.g., TypeScript requires JavaScript)
- Filter by skill, difficulty level, category, and free-text search
- Sorted beginner → intermediate → advanced by default

### User Authentication & Accounts
- Email + password registration with strong password rules enforced client and server-side
- JWT access token (15 min) + refresh token (7 days) with server-side rotation
- Auto-refresh: expired access tokens are transparently renewed using the stored refresh token; users are never logged out mid-session
- Persistent auth state via Zustand with localStorage integration
- Logout invalidates the refresh token server-side
- Role-based access control foundation (candidate / admin)

### Frontend Application
- React 19 + Vite 8 single-page application
- Tailwind CSS v4 utility-first styling with dark theme
- Zustand 5 client-side state management (auth + onboarding flow)
- React Router v7 with protected routes and onboarding step guards
- Recharts data visualizations (progress rings, skill distribution bars)
- Lucide Icons throughout for consistent iconography
- React Dropzone drag-and-drop file upload
- Fully responsive layout — mobile, tablet, and desktop optimized
- Step Indicator UI component guides users through the 4-step onboarding flow
- Editable resume form with inline tag editors for skill lists
- Collapsible sections throughout for information-dense but uncluttered pages
- Axios interceptors handle auth headers, token refresh, and logout on failure

### Infrastructure & DevOps
- Docker Compose orchestrating three independent containers
- Nginx serving the frontend SPA with API proxy and aggressive asset caching
- MongoDB Atlas (Mongoose 8) as the primary data store
- Cloudinary v2 for secure, permanent resume file storage
- Winston structured logging across all backend processes
- Morgan HTTP request logging (combinedformat in production, dev format locally)
- Graceful shutdown handling: SIGTERM / SIGINT caught, in-flight requests completed before exit
- MongoDB connection retry logic (5 attempts, exponential backoff)
- Environment variable validation at startup — missing secrets cause a fast, loud failure rather than a silent runtime error

---

## Tech Stack at a Glance

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Zustand 5, React Router v7, Recharts, Lucide Icons, React Dropzone, Axios |
| **Backend API** | Node.js 20, Express 4, TypeScript 5, express-validator, Multer v2, Helmet, express-rate-limit, Morgan |
| **Authentication** | JSON Web Tokens (access + refresh), bcryptjs (12-round), server-side token rotation |
| **Database** | MongoDB Atlas, Mongoose 8 |
| **File Storage** | Cloudinary v2 |
| **ML / NLP** | Python 3.11, Flask, Flask-CORS, spaCy 3.8 (`en_core_web_sm`), sentence-transformers 3.4 (`all-MiniLM-L6-v2`), NumPy, OpenAI API (optional) |
| **Resume Parsing** | pdf-parse (local text extraction) + Azure-hosted NLP microservice (primary), custom regex section splitter (fallback) |
| **Web Scraping** | Leversol dataset (1,369 jobs), Coursera public REST API (course discovery), Node.js seed scripts |
| **Serving** | Nginx (SPA serving, API reverse proxy, static asset caching) |
| **Containerization** | Docker, Docker Compose (3-service orchestration with health checks) |
| **Logging** | Winston (structured JSON logs), Morgan (HTTP access logs) |
| **Deployment** | Docker Compose (local/server), Render (backend + ML service), Vercel (frontend) |

---

## Data Scale

| Asset | Count | Source |
|---|---|---|
| Job Descriptions | 1,369 | Web-scraped from Leversol |
| Seeded Courses | 24+ core + supplementary | Scraped from Udemy, Coursera, freeCodeCamp |
| Coursera API Pull | Dynamic | Coursera public REST API (supplementary fill) |
| Skill Aliases | 80+ | Hand-curated normalization map |
| Skill Keywords | 200+ | Curated technical skill dictionary |
| Skill Prerequisite Chains | 20+ | Manually authored dependency graph |

---

## User Flow

```
Register / Login
      │
      ▼
Upload Resume (PDF / DOCX)
      │  ←── NLP Parser extracts skills, experience, education
      │  ←── Post-parse editor lets user verify / enrich data
      ▼
Pick a Target Job (from 1,369 scraped listings)
      │  ←── Full-text search + filters
      ▼
Skill Gap Analysis
      │  ←── Normalization + alias resolution + synonym matching
      │  ←── spaCy NER extracts skills from raw job description
      │  ←── Semantic similarity scoring (sentence-transformers)
      │  ←── Four-tier classification: Missing / Partial / Satisfied / Transferable
      ▼
Generate Adaptive Roadmap
      │  ←── Topological sort (DAG) over prerequisite graph
      │  ←── Priority weighting: Critical → Recommended → Optional
      │  ←── Real course links from web-scraped catalog
      ▼
Dashboard — Track Progress
           ←── Mark steps Pending → In-Progress → Completed
           ←── Live progress percentage and hours tracking
```

---

## Security Highlights

| Concern | Mitigation |
|---|---|
| Broken Access Control | JWT middleware on all protected routes; resource ownership verified per request |
| Credential Theft | bcrypt 12-round hashing; passwords never stored or logged in plaintext |
| Token Replay | Short-lived access tokens (15 min); refresh tokens rotated on every use |
| Brute Force | Rate limiter: 20 auth requests / 15 min per IP |
| Injection (XSS / NoSQL) | express-validator input sanitization; Mongoose typed schemas prevent NoSQL injection |
| Insecure Headers | Helmet.js sets recommended HTTP security headers on every response |
| CORS Misuse | Strict allowlist of frontend origins; credentials mode enforced |
| Malicious File Upload | MIME-type whitelist; file size cap (5 MB); memory-only storage (no disk write) |
| Excessive Data Exposure | `select: false` on sensitive fields (passwordHash, refreshToken); `__v` stripped from all responses |

---

## Deployment

The platform is designed for zero-friction deployment:

- **One-command local/server** — `docker compose up --build` starts all three services, wires the internal network, and runs health checks before accepting traffic.
- **Render** — Backend and ML microservice deployed as web services with environment variables configured in the Render dashboard.
- **Vercel** — React frontend deployed as a static site with the API base URL set via `VITE_API_URL`.
- **MongoDB Atlas** — Free-tier M0 cluster with connection string passed as an environment variable.
- **Cloudinary** — Free-tier account for resume file storage.

No infrastructure provisioning, no Kubernetes manifests, no cloud-specific SDKs required for the base deployment.

---

## What Makes This Stand Out at a Hackathon

| Dimension | What We Delivered |
|---|---|
| **Real Data** | 1,369 web-scraped jobs + real courses from live platforms — not mock data |
| **End-to-End Pipeline** | Five connected stages from raw PDF to interactive roadmap — not a prototype |
| **Multiple AI Layers** | spaCy NER + sentence-transformers + OpenAI fallback — not just a single model call |
| **Production Security** | Full auth, rate limiting, Helmet, input validation — not left as "future work" |
| **Container-Ready** | `docker compose up` deploys everything — no manual setup |
| **Nginx SPA Serving** | Proper reverse proxy + SPA routing + asset caching — not `npm run preview` |
| **Transparent AI** | Every gap classification comes with a human-readable reasoning trace |
| **Graceful Degradation** | ML service down? Local extractor takes over. External parser down? Local fallback activates. |
| **Responsive UI** | Polished dark-mode React app that works on mobile and desktop |

---

