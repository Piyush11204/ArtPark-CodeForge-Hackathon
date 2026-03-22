# AdaptLearn AI Chatbot — Architecture & Design

## Overview

The AdaptLearn Chatbot is a context-aware, personalized AI assistant built on top of the platform's MongoDB data layer and a dual-engine NLP backend. It answers career questions, explains the user's own skill gaps, recommends courses, helps navigate the platform, and provides general career coaching — all with full awareness of the authenticated user's profile.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│   ChatWidget (floating bubble) → ChatPanel → Message Thread      │
│        ↕  POST /api/chat/message  ↕  GET /api/chat/history      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Backend  (Node.js / TypeScript)                │
│                                                                  │
│  chatController.ts                                               │
│    1. Authenticate user (JWT)                                    │
│    2. Fetch user context from MongoDB:                           │
│       • Latest resume   → normalizedSkills, parsedData           │
│       • Latest gap report → missing/partial skills, match score  │
│       • Active pathway  → learning steps & progress              │
│       • User profile    → name, role                             │
│       • Platform stats  → job count, course count                │
│    3. Build enriched system prompt                               │
│    4. Call AI engine (OpenAI GPT-4o-mini OR ML service)          │
│    5. Persist to ChatSession (MongoDB)                           │
│    6. Return response                                            │
│                                                                  │
│  Models:  ChatSession (userId, messages[], sessionId)            │
└──────────────────────────────────────────────────────────────────┘
          │ OpenAI API (primary)    │ ML Service fallback
          ▼                         ▼
┌─────────────────┐       ┌──────────────────────────────────────┐
│ OpenAI GPT-4o   │       │   Python ML Service (Flask)          │
│ mini via         │       │                                      │
│ openai SDK       │       │   modules/chatbot.py                 │
└─────────────────┘       │   • Intent classifier (TF-IDF + cos) │
                          │   • Sentence-transformer embeddings   │
                          │   • Template response engine          │
                          │   • Context-aware slot filling        │
                          └──────────────────────────────────────┘
```

---

## Dual-Engine Strategy

### Engine 1: OpenAI GPT-4o-mini (Primary)
- Activated when `OPENAI_API_KEY` is set in the backend environment
- Full conversational reasoning with personalized system prompt
- Handles all intent types natively
- ~$0.00015 / 1K tokens (extremely cost-efficient)

### Engine 2: Local NLP (Fallback — zero cost)
- Activated when OpenAI key is absent
- Python ML service handles the request
- Uses `sentence-transformers` (`all-MiniLM-L6-v2`) for semantic intent matching
- Uses TF-IDF cosine similarity for FAQ matching
- Template-based response generation with slot filling from user context
- Covers ~85% of common career/platform questions reliably

---

## Intent Categories

| Intent | Examples | Data Source |
|---|---|---|
| `greeting` | "Hi", "Hello", "Good morning" | Static |
| `query_skills` | "What are my skills?", "Show my tech stack" | Resume |
| `query_gaps` | "What skills am I missing?", "My gap analysis" | GapReport |
| `query_pathway` | "What should I learn next?", "My learning plan" | Pathway |
| `query_jobs` | "What jobs match me?", "Jobs requiring Python" | Jobs DB |
| `query_courses` | "Recommend Python courses", "How to learn Docker" | Courses DB |
| `query_progress` | "How far along am I?", "My learning progress" | Pathway |
| `platform_help` | "How do I upload a resume?", "How does gap analysis work?" | Static |
| `career_advice` | "How do I switch to ML?", "Should I learn Go?" | LLM |
| `general` | Anything else | LLM |

---

## Data Flow: Per Message

```
User: "What skills am I missing for the React Developer job?"
   │
   ▼ POST /api/chat/message { message: "...", sessionId?: "..." }
   │
   ▼ middleware: protect (JWT auth)
   │
   ▼ chatController.buildUserContext(userId)
     ├─ UserModel.findById()          → name, email, role
     ├─ ResumeModel.findOne(latest)   → normalizedSkills, parsedData.skills
     ├─ GapReportModel.findOne(latest)→ missing[], partial[], matchScore, jobTitle
     ├─ PathwayModel.findOne(latest)  → steps[{skill, status, priority}]
     └─ platform stats                → totalJobs, totalCourses
   │
   ▼ buildSystemPrompt(context)
     "You are AdaptLearn Assistant for {name}.
      Skills: python, react, typescript...
      Missing skills for 'React Developer' at Acme: docker, graphql, testing
      Learning pathway: Step 1 - docker (critical, pending)..."
   │
   ▼ Engine selection
     if (OPENAI_API_KEY) → OpenAI GPT-4o-mini
     else                → POST http://ml-service/chat { message, history, context }
   │
   ▼ Response: "You're missing **docker**, **graphql**, and **testing** for that role.
                Your pathway already has docker as step 1 (critical). Start there!
                I'd recommend the Docker Mastery course on Udemy (~10h)."
   │
   ▼ Persist to ChatSession document in MongoDB
   │
   ▼ Return { reply, sessionId, intent, sources }
```

---

## Message Schema (MongoDB)

```typescript
// ChatSession document
{
  _id: ObjectId,
  userId: ObjectId,          // ref User
  sessionId: string,         // UUID — one per conversation thread
  title: string,             // Auto-generated from first message (first 60 chars)
  messages: [
    {
      role: 'user' | 'assistant',
      content: string,
      intent?: string,       // Detected intent
      sources?: string[],    // Which DB collections were used
      timestamp: Date,
    }
  ],
  contextSnapshot: {         // Context at session creation (for audit)
    resumeSkills: string[],
    topMissingSkills: string[],
    activeJobTitle: string,
  },
  createdAt: Date,
  updatedAt: Date,
}
```

---

## System Prompt Template

```
You are AdaptLearn Assistant — an expert AI career coach embedded in the AdaptLearn platform.
You help users understand their skill gaps, plan their learning journey, and navigate the platform.

=== USER PROFILE ===
Name: {name}
Email: {email}
Skills from resume: {skills_list}

=== LATEST GAP ANALYSIS ===
Job target: {jobTitle} at {companyName}
Match score: {matchScore}%
Missing skills: {missing_skills}
Partial skills: {partial_skills}
Satisfied skills: {satisfied_skills}

=== ACTIVE LEARNING PATHWAY ===
Progress: {completedSteps}/{totalSteps} steps ({progressPercent}% done)
Next step: {nextStep.skill} ({nextStep.priority} priority)
Remaining skills: {remaining_skills}

=== PLATFORM CONTEXT ===
Available jobs: {totalJobs}
Available courses: {totalCourses}

=== INSTRUCTIONS ===
- Be conversational, specific, and encouraging
- Reference the user's ACTUAL data from above when relevant
- For skill questions, use the gap report data
- For "what next" questions, refer to the pathway
- For course questions, suggest resources based on their missing skills
- Keep responses concise (2–4 paragraphs max) unless asked for detail
- Use markdown formatting (bold, bullets) for clarity
- Never make up data — if you don't know something specific, say so
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat/message` | JWT | Send a message, get a reply |
| `GET` | `/api/chat/history` | JWT | List all chat sessions |
| `GET` | `/api/chat/history/:sessionId` | JWT | Get full message thread |
| `DELETE` | `/api/chat/history/:sessionId` | JWT | Delete a session |

### POST `/api/chat/message`
```json
// Request
{
  "message": "What skills am I missing?",
  "sessionId": "optional-existing-session-uuid"
}

// Response
{
  "success": true,
  "data": {
    "reply": "Based on your latest gap report...",
    "sessionId": "uuid-v4",
    "intent": "query_gaps",
    "sources": ["GapReport", "Resume"]
  }
}
```

---

## Frontend: ChatWidget

The chat widget is a **floating action button** visible on all authenticated pages:

- **Collapsed**: Indigo circle with chat icon + unread badge
- **Expanded**: Slide-up panel (400×600px) with:
  - Header with title and minimize/close
  - Message thread (user right / assistant left)
  - Typing indicator (animated dots)
  - Quick-action chips: "My skills", "Skill gaps", "What to learn", "Top jobs"
  - Text input with send button
  - Session history dropdown

---

## Python ML Service: `modules/chatbot.py`

### Intent Classification
Uses TF-IDF vectorizer + cosine similarity against labeled example utterances.
Falls back to `all-MiniLM-L6-v2` embeddings for semantic similarity if TF-IDF score is low (<0.35).

### Response Generation (no OpenAI)
- Intent-specific template trees with slot filling from passed context
- Semantic FAQ search over a curated knowledge base
- Graceful fallbacks for unknown intents

### Knowledge Base Topics
- Platform usage guides
- Career path advice (entry → senior, career switches)
- Learning resource recommendations
- Resume tips
- Interview preparation
- Tech skill roadmaps (Python, React, ML, DevOps etc.)

---

## Security

- All endpoints require `Bearer` JWT authentication
- Session isolation: users can only access their own sessions
- Message content is sanitised server-side (no HTML injection)
- OpenAI calls are made server-side only (API key never exposed to browser)
- Rate limited: 60 messages per hour per user

---

## Deployment

### Environment Variables

**Backend (`.env`):**
```env
OPENAI_API_KEY=sk-...           # Optional — activates GPT-4o-mini engine
OPENAI_MODEL=gpt-4o-mini        # Default model
CHAT_MAX_HISTORY=20             # Messages to send as context window
CHAT_RATE_LIMIT=60              # Max messages per user per hour
```

**ML Service:**
```env
OPENAI_API_KEY=sk-...           # Used by existing skill extractor
```

---

## Future Enhancements

| Feature | Description | Priority |
|---|---|---|
| Voice input | Web Speech API → text → chat | Medium |
| Proactive nudges | "You haven't studied in 3 days" | Medium |
| Course deep-link | Click course title → opens course page | High |
| Multi-session | Resume previous conversations | Done ✓ |
| Export chat | Download as PDF/markdown | Low |
| WebSocket | Real-time streaming responses | Low |
| Admin chatlog | Admins can review anonymised conversations | Low |
