# AI-Adaptive Onboarding Engine

> An end-to-end intelligent onboarding platform that parses your resume, matches you to a job, identifies skill gaps with NLP, and generates a personalized adaptive learning roadmap — all in one seamless flow.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Docker Deployment](#docker-deployment)
- [Team](#team)

---

## Problem Statement

Traditional corporate onboarding relies on static, one-size-fits-all training curricula, leading to:

- **Experienced hires** wasting time revisiting concepts they already know.
- **Beginners** being overwhelmed by advanced modules out of sequence.
- **HR teams** with no data-driven way to tailor onboarding per individual.

---

## Solution Overview

This project implements a fully automated, AI-driven adaptive onboarding system:

1. **Parse** — Upload a resume (PDF/DOCX); an NLP pipeline extracts structured skills and experience levels.
2. **Match** — Browse and select a target role from a catalog of **1 ,369 real job descriptions**.
3. **Analyze** — The Skill Gap Engine diffs candidate capabilities vs. role requirements into `Missing`, `Partial`, and `Satisfied` buckets using semantic similarity (sentence-transformers).
4. **Roadmap** — The Adaptive Pathing Algorithm builds a topologically sorted, prerequisite-aware training pathway from a curated course catalog.
5. **Visualize** — An interactive React dashboard renders your personalized roadmap with progress tracking.

---

## Features

| Feature | Description |
|---|---|
| **Resume Upload & Parsing** | Upload PDF or DOCX; text is extracted locally (pdf-parse) and sent to a live NLP parser for structured skill extraction |
| **1,369-Job Catalog** | Real-world job descriptions seeded from Leversol; searchable with MongoDB full-text index and category filters |
| **Skill Gap Analysis** | Three-tier gap report (Missing / Partial / Satisfied) powered by skill normalization, alias mapping, and semantic similarity scoring |
| **Adaptive Pathway Generation** | Topological-sort DAG over course prerequisites; priority-weighted by gap severity and estimated time-to-competency |
| **ML Microservice** | Standalone Python/Flask service using spaCy NER and sentence-transformers for skill extraction and semantic scoring |
| **Progress Tracking** | Mark individual roadmap steps as complete; dashboard shows overall completion percentage |
| **Secure Auth** | JWT access + refresh token rotation; bcrypt password hashing; rate-limited auth endpoints |
| **File Storage** | Resumes stored on Cloudinary v2; original files retained for re-parsing |
| **Reasoning Trace** | Gap reports expose why each skill was classified, giving transparency into AI decisions |
| **Responsive UI** | Mobile-friendly React 19 frontend with Tailwind CSS v4, drag-and-drop upload, and Recharts visualizations |
| **Docker Ready** | Single `docker compose up` brings up all three services (backend, frontend, ML) |

---

## Architecture

```
  ┌──────────────────────────────────────────────────────────┐
  │                      React Frontend                      │
  │  LandingPage → Register/Login → Onboard Flow → Dashboard │
  └───────────────────────────┬──────────────────────────────┘
                              │ REST (Axios)
                              ▼
  ┌──────────────────────────────────────────────────────────┐
  │              Node.js / Express API  (:5000)              │
  │  Auth · Jobs · Resume · Gap Analysis · Pathway · Courses │
  └────┬───────────────────────────┬─────────────────────────┘
       │ Mongoose                  │ HTTP
       ▼                           ▼
  ┌──────────────┐     ┌───────────────────────────────┐
  │ MongoDB Atlas│     │   Python Flask ML  (:6000)    │
  │  (all data)  │     │  spaCy · sentence-transformers│
  └──────────────┘     └───────────────────────────────┘
       │
       ▼
  ┌──────────────┐
  │  Cloudinary  │  (resume file storage)
  └──────────────┘
```

**Build phases completed:**

- ✅ Phase 1 — Backend Foundation (Express + MongoDB + JWT Auth)
- ✅ Phase 2 — Job Data Layer (1,369 seeded jobs, full-text search)
- ✅ Phase 3 — Resume Upload & Parse (Cloudinary + live NLP parser)
- ✅ Phase 4 — Skill Gap Engine (normalization + alias mapping + diff algorithm)
- ✅ Phase 5 — Adaptive Pathing (topological sort DAG + 24-course catalog)
- ✅ Phase 6 — Python ML Microservice (spaCy NER + sentence-transformers)
- ✅ Phase 7 — Frontend (React 19 + Vite 8 + Tailwind v4, all pages)
- ✅ Phase 8 — Docker Compose + deployment configuration

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Zustand 5, React Router v7, Recharts, Lucide Icons, React Dropzone |
| **Backend** | Node.js 20, Express 4, TypeScript 5, JWT (access + refresh), Multer v2, Helmet, express-rate-limit, Winston |
| **Database** | MongoDB Atlas (Mongoose 8) |
| **File Storage** | Cloudinary v2 |
| **ML / NLP** | Python 3.11, Flask, spaCy 3.8 (`en_core_web_sm`), sentence-transformers 3.4, OpenAI (optional) |
| **Resume Parsing** | pdf-parse (local) + Live NLP Parser API (Azure-hosted Flask) |
| **Deployment** | Docker Compose, Render (backend + ML), Vercel (frontend), nginx (static serving) |

---

## Project Structure

```
artpark-codeforge/
├── backend/                    # Node.js + Express + TypeScript API
│   └── src/
│       ├── config/             # DB, Cloudinary, env validation
│       ├── controllers/        # Route handlers (auth, jobs, resume, gap, pathway)
│       ├── middleware/         # Auth guard, error handler, file upload
│       ├── models/             # Mongoose schemas
│       ├── routes/             # Express routers
│       ├── scripts/            # Seed scripts (jobs, courses)
│       ├── services/           # Gap engine, adaptive pathing, resume parser
│       └── utils/              # Winston logger
│
├── frontend/                   # React 19 + Vite SPA
│   └── src/
│       ├── components/         # Navbar, Footer, Layout, ProtectedRoute, UI kit
│       ├── pages/              # Landing, Login, Register, Dashboard, Jobs, Pathway
│       │   └── onboard/        # 4-step onboarding flow (Upload → Job → Gap → Roadmap)
│       ├── services/           # Axios API clients
│       ├── store/              # Zustand state (auth, onboard)
│       └── utils/
│
├── ml-service/                 # Python Flask microservice
│   ├── app.py                  # Flask entry point
│   └── modules/
│       ├── skill_extractor.py  # spaCy NER skill extraction
│       ├── gap_engine.py       # Semantic gap scoring
│       └── similarity.py       # sentence-transformers embeddings
│
├── Doc/                        # Hackathon documentation
│   ├── ARCHITECTURE.md
│   ├── leversol.job_descriptions.json   # 1,369 job seed data
│   └── resume_parser.md
│
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| Python | 3.11+ |
| MongoDB | Atlas free tier (M0) |
| Cloudinary | Free tier account |
| Docker | Optional (for containerized setup) |

---

### 1 — Backend

```bash
cd backend
npm install
cp .env.example .env        # Fill in credentials (see Environment Variables below)
npm run seed:jobs           # Seeds 1,369 jobs into MongoDB
npm run seed:courses        # Seeds 24 curated courses
npm run dev                 # Starts Express on http://localhost:5000
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev                 # Starts Vite on http://localhost:5173 (proxies /api → :5000)
```

### 3 — ML Microservice

```bash
cd ml-service

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux / macOS

pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py                   # Starts Flask on http://localhost:6000
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/artpark

# JWT
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-refresh-secret>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Services
RESUME_PARSER_URL=https://credx-flask-gcc4gffcatcsczcd.westus-01.azurewebsites.net
ML_SERVICE_URL=http://localhost:6000
FRONTEND_URL=http://localhost:5173
```

---

## API Reference

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Login and receive JWT tokens |
| `POST` | `/api/auth/refresh` | Rotate refresh token |
| `GET`  | `/api/auth/me` | Get current authenticated user |

### Jobs

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/jobs` | Paginated job list with filters |
| `GET` | `/api/jobs/search?q=` | Full-text job search |
| `GET` | `/api/jobs/categories` | List distinct job categories |
| `GET` | `/api/jobs/:id` | Single job details |

### Resume

| Method | Route | Description |
|--------|-------|-------------|
| `POST`   | `/api/resume/upload` | Upload PDF/DOCX, parse skills, store |
| `GET`    | `/api/resume/me` | List current user's resumes |
| `DELETE` | `/api/resume/:id` | Delete a resume |

### Gap Analysis

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/gap/analyze` | `{ resumeId, jobId }` → generate gap report |
| `GET`  | `/api/gap/:id` | Fetch a specific gap report |
| `GET`  | `/api/gap/history` | User's gap analysis history |

### Pathway

| Method | Route | Description |
|--------|-------|-------------|
| `POST`  | `/api/pathway/generate` | `{ gapReportId }` → generate learning roadmap |
| `GET`   | `/api/pathway/:id` | Fetch a specific pathway |
| `GET`   | `/api/pathway/me` | List user's pathways |
| `PATCH` | `/api/pathway/:id/step/:stepId` | Update step completion status |

### Courses

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/courses` | List all curated courses |
| `GET` | `/api/courses/:id` | Single course details |

### ML Service (`:6000`)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/extract-skills` | spaCy NER skill extraction from raw text |
| `POST` | `/similarity-score` | Semantic similarity between two skill sets |
| `POST` | `/enhance-gap` | ML-enhanced gap report (spaCy + embeddings) |
| `GET`  | `/health` | Service health check |

---

## Docker Deployment

Bring up all three services with a single command:

```bash
cp .env.example .env        # Fill in all secrets
docker compose up --build
```

| Container | Port | Description |
|---|---|---|
| `artpark-backend` | `5000` | Node.js / Express API |
| `artpark-frontend` | `80` | React SPA served via nginx |
| `artpark-ml` | `6000` | Python Flask ML microservice |

The ML service includes a health check; the backend waits for it to be healthy before starting.

---