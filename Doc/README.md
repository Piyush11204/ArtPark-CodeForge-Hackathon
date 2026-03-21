# AI-Adaptive Onboarding Engine

> **ARTPARK CodeForge Hackathon** — Submission by Piyush Krishnadutt Yadav

---

## Problem Statement

Traditional corporate onboarding relies on static, one-size-fits-all curricula, leading to:

- **Experienced hires** wasting time revisiting concepts they already know.
- **Beginners** being overwhelmed by advanced modules out of sequence.

### The Challenge
Build an AI-driven, adaptive learning engine that:
1. Parses a new hire's current capabilities from their **resume** or a **diagnostic test**.
2. Dynamically maps an **optimized, personalized training pathway** to reach role-specific competency.

---

## Solution Overview

This project implements an end-to-end adaptive onboarding system that:

- **Extracts skills** from an uploaded resume and a target Job Description (JD) using NLP/LLM-based parsing.
- **Identifies skill gaps** by comparing extracted candidate skills against role requirements.
- **Generates a personalized learning roadmap** using an adaptive pathing algorithm.
- **Visualizes the roadmap** through an interactive web UI.

---

## Features

| Feature | Description |
|---|---|
| Intelligent Parsing | Extracts skills and experience levels from resumes and JDs |
| Skill Gap Analysis | Compares candidate profile against role requirements |
| Adaptive Pathway Generation | Builds a personalized training roadmap per hire |
| Reasoning Trace | Exposes the model's reasoning behind each recommendation |
| Web Interface | Upload documents and visualize the training roadmap |

---

## Architecture & Workflow

```
        ┌─────────────┐       ┌──────────────────┐
        │  Resume PDF  │──────▶│  Resume Parser   │
        └─────────────┘       │  (LLM + NLP)     │
                               └────────┬─────────┘
                                        │  Candidate Skill Profile
        ┌─────────────┐                 ▼
        │  Job Desc.  │──────▶  ┌──────────────────┐
        └─────────────┘         │  Skill Gap Engine │
                                 └────────┬─────────┘
                                          │  Gap Map
                                          ▼
                                 ┌──────────────────┐
                                 │  Adaptive Pathing │
                                 │  Algorithm        │
                                 └────────┬─────────┘
                                          │  Learning Pathway
                                          ▼
                                 ┌──────────────────┐
                                 │   Web UI          │
                                 │   (Roadmap View)  │
                                 └──────────────────┘
```

**Data Flow:**
1. User uploads a **Resume** (PDF/DOCX) and a **Job Description**.
2. The **Resume Parser** extracts structured skill-experience data via LLM.
3. The **Skill Gap Engine** diffs candidate skills vs. role requirements.
4. The **Adaptive Pathing Algorithm** (graph-based / Knowledge Tracing) sequences training modules to fill gaps optimally.
5. The **Web UI** renders the personalized roadmap with reasoning traces.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React / Next.js |
| **Backend** | Python, Flask |
| **LLM / NLP** | OpenAI GPT / LangChain, Hugging Face (BERT/Mistral) |
| **Skill Gap & Pathing** | Custom graph-based adaptive algorithm |
| **Database** | MongoDB / Firebase |
| **Deployment** | Docker, Render / Vercel |

---

## Skill-Gap Analysis Logic

1. **Resume Parsing** — LLM extracts a structured JSON of skills, experience years, and proficiency from free-form resume text.
2. **JD Parsing** — A similar extraction pass is run on the job description to produce a role requirement map.
3. **Gap Computation** — Each required skill is scored against the candidate's proficiency:
   - `Missing` → not present in resume
   - `Partial` → present but below required level
   - `Satisfied` → meets or exceeds requirement
4. **Adaptive Pathing** — A directed graph of training modules is traversed using a priority queue weighted by:
   - Gap severity
   - Prerequisite dependencies between modules
   - Estimated time-to-competency

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (optional, recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/artpark-codeforge.git
cd artpark-codeforge
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Add your OpenAI API key
python app.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Run with Docker (optional)
```bash
docker build -t adaptive-onboarding .
docker run -p 5000:5000 adaptive-onboarding
```

---

## Dependencies

### Backend (`requirements.txt`)
```
flask
flask-cors
pdfplumber
python-docx
openai
langchain
sentence-transformers
networkx
pymongo
python-dotenv
```

### Frontend (`package.json`)
```
react, next.js
axios
tailwindcss
react-flow (roadmap visualization)
```

---

## Datasets Used

| Dataset | Source |
|---|---|
| Resume Dataset | [Kaggle – snehaanbhawal/resume-dataset](https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset/data) |
| Occupational Skills (O*NET) | [O*NET Database Releases](https://www.onetcenter.org/db_releases.html) |
| Job Descriptions | [Kaggle – kshitizregmi/jobs-and-job-description](https://www.kaggle.com/datasets/kshitizregmi/jobs-and-job-description) |

---

## Evaluation Criteria

| Criterion | Weight |
|---|---|
| Technical Sophistication (skill extraction + adaptive model) | 20% |
| Grounding & Reliability (zero hallucinations, catalog adherence) | 15% |
| User Experience (clarity of roadmap + UI usability) | 15% |
| Communication & Documentation | 20% |
| Reasoning Trace | 10% |
| Product Impact (reduced redundant training) | 10% |
| Cross-Domain Scalability | 10% |

---

## Submission Deliverables

- [x] Public GitHub Repository with documented source code
- [x] README with setup instructions, dependencies, and skill-gap logic overview
- [ ] 2–3 minute Video Demonstration
- [ ] 5-Slide Technical Presentation
- [ ] Dockerfile (optional but encouraged)

---

## License

This project was built for the **ARTPARK CodeForge Hackathon**. All third-party datasets and models are cited above and used in accordance with their respective licenses.
