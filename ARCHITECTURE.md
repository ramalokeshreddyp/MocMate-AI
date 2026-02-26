# MocMate AI – Production Architecture

## 1. High-Level Architecture

```text
┌───────────────────────────────────────────────┐
│                  Frontend (React)             │
│  Pages, Proctoring UI, Code Editor, Dashboard │
└───────────────────────┬───────────────────────┘
                        │ HTTPS + JWT
┌───────────────────────▼───────────────────────┐
│              Backend API (Express)            │
│ Auth, Interview lifecycle, Evaluation pipeline │
└───────────────┬───────────────────────┬───────┘
                │                       │
                │                       │
       ┌────────▼────────┐     ┌────────▼─────────┐
       │ AI Services     │     │ Persistence      │
       │ Resume parsing  │     │ PostgreSQL /     │
       │ Face detection* │     │ In-memory repo   │
       │ Scoring engine  │     │ (dev fallback)   │
       └─────────────────┘     └──────────────────┘
```

`*` Face detection executes client-side via TensorFlow.js + BlazeFace, with signals persisted through backend APIs.

---

## 2. Component-Level Architecture

### Frontend
- `AuthContext`: token + session state.
- `ThemeContext`: light/dark mode with backend preference sync.
- `InterviewSession`: timer, proctoring, speech mode (theory), code mode (coding).
- `InterviewResults`: per-question breakdown and strict feedback rendering.
- `Dashboard`: metrics from persisted reports only.

### Backend
- `app.js`: route layer and request validation.
- `evaluationService.js`: strict semantic scoring + coding validation.
- `profileService.js`: resume parsing/extraction pipeline.
- Storage adapters:
  - `pgRepo.js` (production)
  - `memoryRepo.js` (development)

---

## 3. Frontend → Backend → AI Service → Database Flow

```text
User Action
   │
   ▼
Frontend UI (InterviewSession / Auth / Dashboard)
   │  (REST + JWT)
   ▼
Backend API (Express + Zod)
   │
   ├─ Resume pipeline (parse + extract)
   ├─ Strict evaluation pipeline (semantic + keyword + structure)
   ├─ Coding validator pipeline (runtime checks)
   ▼
Repository Layer
   │
   ▼
PostgreSQL (users, interviews, reports)
```

---

## 4. Resume Parsing Pipeline

```text
Register Request (name,email,password,resumeBase64,resumeFileName)
    │
    ▼
Validate payload + enforce PDF
    │
    ▼
Parse PDF text
    │
    ▼
Extract skills/projects/keywords/profile insights
    │
    ▼
Store user + profile + resume_text
    │
    ▼
Return JWT + sanitized user
```

---

## 5. Interview Lifecycle Flow

```text
Start Interview
  ├─ Validate type/topic
  ├─ Generate exactly 10 questions
  └─ Persist interview (status=in_progress)

Question Loop (per question)
  ├─ Start 60s timer
  ├─ Capture response
  │   ├─ Theory: speech transcript + speech metrics
  │   └─ Coding: code editor payload + complexity note
  ├─ Timeout? auto-submit unanswered
  └─ Save answer

Complete Interview
  ├─ Enforce >=10 questions
  ├─ Enforce >=10 answers
  ├─ Evaluate via strict pipeline
  ├─ Persist report JSON
  └─ Return reportId/report
```

---

## 6. 60-Second Timeout Logic

- Each question starts at 60 seconds.
- At timeout:
  - Answer auto-submitted as unanswered marker.
  - Candidate proceeds to next question.
- Timeout events affect report quality and unanswered counters.
- This removes manual skip loopholes and enforces interview discipline.

---

## 7. Face Detection & Proctoring Workflow

```text
Camera stream active
   │
   ▼
BlazeFace infer loop (continuous interval)
   │
   ├─ faceCount <= 1  → continue
   └─ faceCount > 1   → violation
          │
          ├─ first violation  → warning modal
          └─ second violation → terminate interview API call
                                + persist reason:
                                  "Interview terminated – Multiple persons detected."
```

Additional proctoring signals:
- tab switches
- long silence events
- background noise events
- face visibility ratio

---

## 8. Audio Monitoring Workflow (Theoretical Interviews)

```text
Mic stream + Speech Recognition
   │
   ├─ transcript capture
   ├─ speech metrics (WPM, filler words, pause, clarity)
   ├─ silence monitor
   └─ mandatory mic state enforcement
```

- Mic is mandatory for non-coding rounds.
- Missing mic/camera/face presence pauses answer flow.

---

## 9. Coding Evaluation Workflow

```text
Code Editor Input (no speech)
   │
   ▼
Submit codeAnswer { code, language, complexityNote }
   │
   ▼
Backend coding evaluator
   ├─ syntax/runtime validation
   ├─ question-specific output checks
   ├─ edge-case checks
   └─ complexity-note quality signals
   │
   ▼
Result
   ├─ pass: score computed with correctness contribution
   └─ fail: low score + precise error feedback
```

---

## 10. AI Evaluation Pipeline (Strict)

### Stage A: Correctness Gate
- Compute semantic similarity between response and question intent.
- Validate required domain keyword presence.
- If below threshold:
  - relevance = 0
  - coverage = 0
  - communication/confidence gating
  - overall capped near zero

### Stage B: Parameter Scoring (only meaningful after gate)
- Relevance
- Coverage
- Structure
- Grammar/clarity
- Communication quality
- Confidence/proctoring stability

### Stage C: Aggregation & Feedback
- Weighted score calculation.
- Per-question breakdown generation.
- Missing concept detection.
- Strict negative feedback for incorrect answers.

---

## 11. Database Schema Overview

```text
users
- id (PK)
- name, email, password_hash
- role
- resume_text
- preferences (theme)
- profile (JSONB)
- created_at

interviews
- id (PK)
- user_id (FK -> users.id)
- type, topic, language
- questions (JSONB)
- answers (JSONB)
- proctoring_signals (JSONB)
- status (in_progress/completed/terminated)
- started_at, completed_at
- duration_sec

reports
- id (PK)
- interview_id (FK -> interviews.id)
- user_id (FK -> users.id)
- data (JSONB full evaluation)
- created_at
```

Relationships:
- One user → many interviews
- One interview → one report (on completion)
- One user → many reports

---

## 12. Scalability Approach

- Stateless API with JWT sessions.
- Repository abstraction supports multiple storage backends.
- JSONB report payload enables evolving metrics without destructive schema churn.
- Frontend/backend split deployment supports horizontal scaling.
- Detection and rendering logic decoupled from persistence layer.

---

## 13. Security Model

- JWT authentication for protected APIs.
- Password hashing with bcrypt.
- Input validation via Zod for all write endpoints.
- Enforced authorization checks per interview/report owner.
- Secure environment variables for secrets and DB credentials.
- HTTPS required in deployment for media + auth transport.

---

## 14. Production Notes

- Use PostgreSQL in production (`DATABASE_URL` configured).
- Verify camera/mic permissions under HTTPS domain.
- Persisted theme and proctoring termination signals are part of final user/session integrity.
- Analytics and dashboard are computed from stored reports only (no hardcoded trend data).
