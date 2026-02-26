# MocMate AI

Production-ready AI interview intelligence platform for placement preparation.

MocMate AI solves a core placement problem: students often lack realistic interview practice, strict evaluation, and actionable feedback before real interviews. The platform provides proctored interview simulation, correctness-first scoring, and measurable progress analytics.

## Core Objectives

- Provide realistic interview simulation across skill, coding, HR, and comprehensive rounds.
- Enforce disciplined interview behavior with real-time proctoring and mandatory constraints.
- Score responses using strict semantic correctness rules (no inflated scoring).
- Deliver structured feedback and real analytics from persisted interview data.
- Maintain deployment-ready stability, responsiveness, and consistent UX.

## Finalized Feature Set

### Candidate Onboarding & Profile Intelligence
- Resume PDF upload is mandatory during registration.
- Resume text is parsed and profile insights are generated (skills/projects/keywords).
- Resume signals are used for HR/resume-driven interview personalization.

### Interview Engine
- Minimum 10 questions per interview (strictly enforced server-side).
- 60-second timer per question.
- Timeout behavior auto-submits unanswered response (`[UNANSWERED - TIMEOUT]`) and moves to next question.
- Mandatory camera + mic for theoretical rounds.
- Coding round is writing-only (no speech input) with integrated code editor.

### Proctoring (Strict)
- Continuous face monitoring using TensorFlow.js + BlazeFace.
- Multi-person rule:
  1. First detection → warning shown: “Multiple persons detected. Please ensure you are alone during the interview.”
  2. Second detection → interview auto-terminated.
- Termination reason persisted via API and storage: “Interview terminated – Multiple persons detected.”
- Additional monitoring: tab switches, long silence events, background noise events.

### Coding Interview Mode
- Code editor with syntax highlighting and line numbers.
- Language selection supported in UI.
- Optional complexity note input.
- Evaluation is correctness-first:
  - Code is validated against question-specific checks.
  - Syntax/runtime errors produce explicit feedback.
  - Failing validation keeps score low.

### Strict Scoring Logic (No Inflated Scores)
- Semantic correctness threshold is enforced before meaningful scoring.
- If answer does not match question intent:
  - Relevance = 0
  - Coverage = 0
  - Communication/confidence gated down
  - Overall score capped near zero
- Wrong answers cannot be rescued by fluency/confidence alone.

### Feedback & Analytics
- Per-question breakdown with status, metrics, and targeted improvements.
- Structured feedback with explicit incorrect/missing concept messaging.
- Dashboard analytics are computed from stored report data (no dummy charts).
- Trends: performance, confidence, filler word frequency, weak/strong areas.

### UI/UX & Theming
- Multi-page app flow with protected routes and role-consistent navigation.
- Professional SaaS-grade branding: MocMate AI.
- Light/Dark mode toggle with persisted preference.
- Fully responsive layouts and smooth transitions.

## Proctoring Model Summary

- Camera feed is continuously analyzed.
- Face count > 1 is treated as a proctoring violation.
- First violation warns candidate.
- Second violation terminates interview and writes reason to persistence.
- Proctoring signals are included in final report scoring context.

## Tech Stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Recharts
- react-simple-code-editor + Prism

### Backend
- Node.js + Express
- Zod validation
- JWT authentication
- bcrypt password hashing

### AI / Detection / Evaluation
- TensorFlow.js
- BlazeFace model (`@tensorflow-models/blazeface`) for face detection
- Strict semantic+keyword+structure scoring pipeline in backend service
- Coding validation pipeline (runtime and correctness checks)

### Database & Storage
- PostgreSQL (production)
- In-memory repository fallback (development)
- JSONB report storage for rich evaluation payloads

### Testing & Quality
- Vitest + Supertest
- ESLint

## Setup

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Development (in-memory mode):
```bash
npm run dev:full
```

Production (PostgreSQL mode):
```bash
# Example values
DATABASE_URL=postgres://user:password@localhost:5432/hiresense
JWT_SECRET=your-secure-secret
PORT=4000
NODE_ENV=production
```

## 3) Run

```bash
npm run dev:full
```

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:4000`

## 4) Validate

```bash
npm run lint
npm run test
npm run build
```

## Folder Structure (Overview)

```text
hackathon/
├─ src/
│  ├─ components/
│  ├─ context/
│  ├─ lib/
│  ├─ pages/
│  └─ test/
├─ backend/
│  └─ src/
│     ├─ services/
│     ├─ storage/
│     ├─ app.js
│     └─ server.js
├─ public/
├─ package.json
├─ vite.config.ts
└─ README.md
```

## Deployment Notes

- Frontend and backend can be deployed separately.
- Use PostgreSQL in production; schema initializes automatically in repository startup.
- Ensure TLS-enabled environment and secure `JWT_SECRET`.
- Use environment variable `VITE_API_URL` for frontend-backend routing in hosted setup.
- Verify camera/microphone permissions in production domain (HTTPS required for media APIs).



