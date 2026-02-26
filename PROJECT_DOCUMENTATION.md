# MocMate AI – Full Project Documentation

## 1. Introduction

MocMate AI is a production-grade interview intelligence system designed for placement readiness. It provides structured mock interviews with strict evaluation logic, real-time proctoring, and analytics derived from persisted interview reports.

Unlike generic mock platforms, MocMate AI enforces correctness-first scoring and strict interview integrity constraints.

---

## 2. Problem Statement

Students preparing for placements often face three major issues:

1. No realistic interview environment.
2. No strict and reliable evaluation of answer correctness.
3. No measurable analytics to improve performance over time.

MocMate AI addresses these issues with mandatory proctoring, semantic correctness gating, coding validation, and real dashboard metrics.

---

## 3. Objectives

- Deliver realistic interview practice across theory and coding rounds.
- Enforce interview integrity (multi-person detection, mandatory media rules).
- Evaluate responses using strict semantic correctness thresholds.
- Reject inflated scoring behavior for incorrect answers.
- Provide structured per-question feedback and real trend analytics.
- Maintain responsiveness, stability, and deployment readiness.

---

## 4. System Overview

```text
Frontend (React + TS)
  ├─ Auth/UI/Themes
  ├─ Interview Session (speech/code)
  ├─ Proctoring indicators
  └─ Dashboard + Results
         │
         ▼
Backend API (Express)
  ├─ Auth + validation
  ├─ Interview lifecycle
  ├─ Strict evaluation pipeline
  └─ Reporting APIs
         │
         ▼
Storage Layer
  ├─ PostgreSQL (prod)
  └─ In-memory repo (dev)
```

---

## 5. End-to-End Process (Step-by-Step)

### Step 1: Registration
- User submits name/email/password + mandatory resume PDF.
- Backend validates payload and enforces PDF format.
- Resume is parsed; profile insights are extracted and stored.
- JWT token is returned.

### Step 2: Interview Start
- User selects interview type and topic.
- Backend generates at least 10 questions and persists a new interview session.

### Step 3: Question Loop
- 60-second timer starts per question.
- Theory rounds: spoken answer + speech metrics.
- Coding rounds: code editor submission (no speech path).
- On timeout: unanswered marker auto-submitted.

### Step 4: Proctoring Enforcement
- Continuous face detection runs.
- First multi-person detection: warning.
- Second detection: interview termination API call with reason persistence.

### Step 5: Completion
- Backend enforces minimum question/answer count.
- Strict evaluation pipeline computes report.
- Report is stored and shown in results/dashboard/history.

---

## 6. Detailed Interview Flow

```text
Start Session
   │
   ├─ Media checks
   ├─ Face detection loop
   ├─ Timer starts (60s)
   │
   ├─ Theory round?
   │    └─ speech transcript + metrics
   │
   ├─ Coding round?
   │    └─ codeAnswer {code, language, complexityNote}
   │
   ├─ Timeout?
   │    └─ auto-submit unanswered
   │
   └─ Next question ... until 10+ answered/submitted
```

---

## 7. Strict Scoring Logic

## 7.1 Correctness-First Gate
- Semantic similarity is computed between question and answer intent.
- Domain keyword validation is checked.
- If semantic threshold is not met:
  - Relevance = 0
  - Coverage = 0
  - Confidence/communication are not allowed to inflate result
  - Overall score is capped near zero.

## 7.2 Why Wrong Answers Stay Low
Wrong answers can no longer score high through verbosity or confidence. Correctness is mandatory before high scoring is possible.

## 7.3 Coding-Specific Evaluation
- Code is validated against question-specific checks.
- Syntax/runtime errors are explicitly reported.
- Failed validation forces low score.
- Passing validation unlocks strong score potential.

---

## 8. Proctoring Policy

### Mandatory Rules
- Camera mandatory in all rounds.
- Microphone mandatory for theoretical rounds.
- Coding round uses code editor only.

### Multi-Person Rule
1. First detection: warning.
2. Second detection: terminate interview.

### Persisted Termination Reason
- `Interview terminated – Multiple persons detected.`

### Additional Signals
- Tab switches
- Long silence events
- Background noise events

---

## 9. Dashboard Metrics Explanation

Dashboard uses report data from persistence only.

Displayed metrics include:
- Total interviews
- Completed interviews
- Average score
- Best score
- Weakest/strongest dimensions
- Performance trend over attempts
- Confidence trend
- Filler-word frequency trend

No hardcoded trend data is used for analytics.

---

## 10. Evaluation Formula

For theoretical rounds:

```text
overall =
  relevance*0.30 +
  coverage*0.20 +
  structure*0.15 +
  communication*0.15 +
  confidence*0.10 +
  grammar*0.10
```

With strict gate:
- If semantic correctness gate fails, overall is capped near zero.

For coding rounds:
- Includes correctness/validation contribution as a dominant weighted factor.

---

## 11. Edge Case Handling

### No response
- Trigger: timer reaches 60s with no valid response.
- Action: unanswered marker auto-submitted; move to next question.

### Multiple faces
- Trigger: face detector returns count > 1.
- Action: warning then termination on second event.

### Wrong answer
- Trigger: semantic threshold/keyword validation fails.
- Action: relevance/coverage zeroed; final score near zero.

### Mic disabled (theory)
- Trigger: microphone unavailable/off.
- Action: interview remains paused from submission flow until compliant.

### Coding syntax error
- Trigger: runtime/syntax exception during code validation.
- Action: explicit syntax/runtime feedback + low score.

---

## 12. Deployment Architecture

```text
[Client Browser]
   │ HTTPS
   ▼
[Frontend Host]
   │ REST
   ▼
[Backend API Host]
   │ SQL
   ▼
[PostgreSQL]
```

Deployment essentials:
- Configure `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`.
- Serve over HTTPS to support media APIs.
- Persist preferences and reports in PostgreSQL.

---

## 13. Data Flow Explanation

```text
Register/Login
  └─ JWT issued

Start Interview
  └─ session persisted with 10 questions

Submit Answers
  ├─ theory transcript/speech metrics
  └─ coding codeAnswer payload

Complete/Terminate
  ├─ strict evaluation or termination reason
  └─ report/signals persisted

Dashboard/History/Results
  └─ read from persisted reports/interviews
```

---

## 14. UI/UX Design Principles

- Professional SaaS-grade interface.
- Multi-page structure with clear route separation.
- Minimal visual noise; interview-focused controls.
- Responsive layout for mobile/tablet/desktop.
- Smooth transitions and clear status feedback.
- Light mode default; dark mode optional and persisted.

---

## 15. Process & Pipeline Diagrams

### 15.1 Interview Lifecycle Diagram

```text
Create Session → Q1..Q10 Loop → Complete Evaluation → Persist Report → Dashboard/History
                            └→ Terminate (policy violation) → Persist reason
```

### 15.2 Evaluation Pipeline Diagram

```text
Input Answer
   │
   ▼
Semantic + Keyword Gate
   │
   ├─ Fail → relevance/coverage=0 → score near zero
   └─ Pass → full weighted scoring
   │
   ▼
Per-question feedback + aggregate report
```

### 15.3 Proctoring Pipeline Diagram

```text
Video Stream → BlazeFace detectFaces() loop
                │
                ├─ <=1 face: continue
                └─ >1 face:
                      first -> warning
                      second -> terminate + persist reason
```

---

## 16. Future Enhancements

- Multi-language executable coding sandboxes (Python/Java/C++ runtime validation).
- Enhanced gaze/pose-based proctoring refinement.
- Optional supervised review dashboard for institutions.
- Interview blueprint customization by company role templates.

---

## 17. Conclusion

MocMate AI is a strict, production-oriented interview intelligence platform focused on correctness, integrity, and measurable improvement. The system enforces realistic interview constraints, prevents inflated scoring, persists genuine analytics, and provides structured, actionable feedback aligned with placement preparation needs.
