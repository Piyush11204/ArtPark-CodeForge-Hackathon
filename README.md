# AI-Adaptive Onboarding Engine

> **ARTPARK CodeForge Hackathon 2026** — Full-stack MERN application  
> Parses your resume, matches you to a job, identifies skill gaps, and generates a personalized adaptive learning roadmap.

---

## Quick Start

### Prerequisites
- Node.js 20+, Python 3.11+, Docker (optional)
- MongoDB Atlas account (free M0 tier)
- Cloudinary account (free tier)

---

### 1 — Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MongoDB + Cloudinary credentials
npm run seed:jobs      # inserts 1369 jobs from Doc/leversol.job_descriptions.json
npm run seed:courses   # inserts 24 curated courses
npm run dev            # starts on :5000
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev            # starts on :5173, proxies /api → :5000
```

### 3 — ML Microservice (Python)

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate   # Windows  |  source .venv/bin/activate (Linux/Mac)
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py            # starts on :6000
```

---

### Run with Docker Compose

```bash
cp .env.example .env    # fill in secrets
docker compose up --build
```

Services:
| Container | Port | Purpose |
|-----------|------|---------|
| artpark-backend | 5000 | Node.js Express API |
| artpark-frontend | 80 | React (nginx) |
| artpark-ml | 6000 | Python Flask ML |

---

## API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| GET  | `/api/auth/me` | Current user |

### Jobs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/jobs` | List with pagination + filters |
| GET | `/api/jobs/search?q=` | Full-text search |
| GET | `/api/jobs/categories` | Distinct categories |
| GET | `/api/jobs/:id` | Single job detail |

### Resume
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/resume/upload` | Upload PDF/DOCX, parse, store |
| GET  | `/api/resume/me` | My resumes |
| DELETE | `/api/resume/:id` | Delete resume |

### Gap Analysis
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/gap/analyze` | `{resumeId, jobId}` → gap report |
| GET  | `/api/gap/:id` | Fetch report |
| GET  | `/api/gap/history` | My analysis history |

### Pathway
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/pathway/generate` | `{gapReportId}` → learning roadmap |
| GET  | `/api/pathway/:id` | Fetch pathway |
| GET  | `/api/pathway/me` | My pathways |
| PATCH | `/api/pathway/:id/step/:stepId` | Update step status |

### ML Service
| Method | Route | Description |
|--------|-------|-------------|
| POST | `ml:6000/extract-skills` | NLP skill extraction from text |
| POST | `ml:6000/similarity-score` | Semantic similarity between skill sets |
| POST | `ml:6000/enhance-gap` | Enhanced gap with ML (spaCy + embeddings) |

---

## Architecture

See [ARCHITECTURE.md](../ARCHITECTURE.md) for the full 8-phase architecture with data-flow diagram.

**Build phases completed:**
- ✅ Phase 1 — Backend Foundation (Express + MongoDB + JWT Auth)
- ✅ Phase 2 — Job Data Layer (1369 seeded jobs, full-text search)
- ✅ Phase 3 — Resume Upload & Parse (Cloudinary + live Flask parser)
- ✅ Phase 4 — Skill Gap Engine (normalization + diff algorithm)
- ✅ Phase 5 — Adaptive Pathing (topological sort DAG + course catalog)
- ✅ Phase 6 — Python ML Microservice (spaCy NER + sentence-transformers)
- ✅ Phase 7 — Frontend (React 19 + Vite + Tailwind v4, all pages)
- ✅ Phase 8 — Docker Compose + Deployment config

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Zustand, React Router v6, Recharts |
| Backend | Node.js 20, Express, TypeScript, JWT (access+refresh), Multer v2 |
| Database | MongoDB Atlas, Mongoose |
| File Storage | Cloudinary v2 |
| Resume Parser | Live Flask API (Azure, pre-built) |
| ML Service | Python 3.11, Flask, spaCy, sentence-transformers |
| Deployment | Docker Compose, Render (backend + ML), Vercel (frontend) |
