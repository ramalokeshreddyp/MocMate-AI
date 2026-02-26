import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createMemoryRepo } from "./storage/memoryRepo.js";

const fakePdfBase64 = Buffer.from("%PDF-1.4\nFake Resume\nReact Node SQL\n%%EOF", "utf8").toString("base64");

const createAuthenticatedAgent = async () => {
  const app = createApp(createMemoryRepo());

  const registerResponse = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "test@example.com",
    password: "TestPass123",
    role: "student",
    resumeBase64: fakePdfBase64,
    resumeFileName: "resume.pdf",
  });

  const token = registerResponse.body.token;
  return { app, token };
};

describe("backend api", () => {
  it("registers and logs in user", async () => {
    const app = createApp(createMemoryRepo());

    const registerResponse = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane@example.com",
      password: "StrongPass1",
      role: "student",
      resumeBase64: fakePdfBase64,
      resumeFileName: "resume.pdf",
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.token).toBeTruthy();
    expect(registerResponse.body.user.email).toBe("jane@example.com");

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "jane@example.com",
      password: "StrongPass1",
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeTruthy();
  });

  it("rejects non-pdf resume upload at registration", async () => {
    const app = createApp(createMemoryRepo());

    const response = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane-pdf@example.com",
      password: "StrongPass1",
      role: "student",
      resumeBase64: fakePdfBase64,
      resumeFileName: "resume.txt",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("PDF");
  });

  it("rejects interview completion when answers are incomplete", async () => {
    const { app, token } = await createAuthenticatedAgent();

    const startResponse = await request(app)
      .post("/api/interviews/start")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "skill", topic: "react" });

    const interviewId = startResponse.body.interviewId;

    for (let index = 0; index < 2; index += 1) {
      const answerResponse = await request(app)
        .post(`/api/interviews/${interviewId}/answer`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          answer: {
            transcript: "This is a sufficiently long answer for validation checks.",
            speechMetrics: {
              wordsPerMinute: 120,
              pauseDurationSec: 2,
              fillerWords: 0,
              clarityScore: 85,
            },
          },
        });

      expect(answerResponse.status).toBe(200);
    }

    const completeResponse = await request(app)
      .post(`/api/interviews/${interviewId}/complete`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        durationSec: 180,
        proctoringSignals: { tabSwitches: 0, longSilenceEvents: 0, micOnRatio: 1, faceDetectedRatio: 1 },
      });

    expect(completeResponse.status).toBe(400);
    expect(completeResponse.body.message).toContain("mandatory");
  });

  it("stores user theme preference and supports termination reason persistence", async () => {
    const { app, token } = await createAuthenticatedAgent();

    const prefResponse = await request(app)
      .put("/api/users/preferences")
      .set("Authorization", `Bearer ${token}`)
      .send({ theme: "dark" });

    expect(prefResponse.status).toBe(200);
    expect(prefResponse.body.preferences.theme).toBe("dark");

    const startResponse = await request(app)
      .post("/api/interviews/start")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "skill", topic: "react" });

    const terminateResponse = await request(app)
      .post(`/api/interviews/${startResponse.body.interviewId}/terminate`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        reason: "Interview terminated – Multiple persons detected.",
        proctoringSignals: {
          multipleFaceEvents: 2,
          terminationReason: "Interview terminated – Multiple persons detected.",
        },
      });

    expect(terminateResponse.status).toBe(200);
    expect(terminateResponse.body.status).toBe("terminated");
    expect(terminateResponse.body.reason).toContain("Multiple persons detected");
  });

  it("rejects coding answer payload without codeAnswer", async () => {
    const { app, token } = await createAuthenticatedAgent();

    const startResponse = await request(app)
      .post("/api/interviews/start")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "coding", topic: "arrays", language: "javascript" });

    const answerResponse = await request(app)
      .post(`/api/interviews/${startResponse.body.interviewId}/answer`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        answer: {
          transcript: "I would use a map",
          speechMetrics: {
            wordsPerMinute: 100,
            pauseDurationSec: 2,
            fillerWords: 0,
            clarityScore: 80,
          },
        },
      });

    expect(answerResponse.status).toBe(400);
    expect(answerResponse.body.message).toContain("code solution");
  });

  it("rejects theory answer payload without transcript/speech metrics", async () => {
    const { app, token } = await createAuthenticatedAgent();

    const startResponse = await request(app)
      .post("/api/interviews/start")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "skill", topic: "react" });

    const answerResponse = await request(app)
      .post(`/api/interviews/${startResponse.body.interviewId}/answer`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        answer: {
          codeAnswer: {
            code: "function solve() {}",
            language: "javascript",
          },
        },
      });

    expect(answerResponse.status).toBe(400);
    expect(answerResponse.body.message).toContain("Transcribed answer");
  });

  it("completes interview and returns report/history", async () => {
    const { app, token } = await createAuthenticatedAgent();

    const startResponse = await request(app)
      .post("/api/interviews/start")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "skill", topic: "react" });

    expect(startResponse.status).toBe(201);
    expect(startResponse.body.questions.length).toBeGreaterThan(0);

    const interviewId = startResponse.body.interviewId;

    for (const question of startResponse.body.questions) {
      const answerResponse = await request(app)
        .post(`/api/interviews/${interviewId}/answer`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          answer: {
            transcript: `Detailed answer for ${question} with hooks state performance and examples repeated for completeness.`,
            speechMetrics: {
              wordsPerMinute: 120,
              pauseDurationSec: 2,
              fillerWords: 1,
              clarityScore: 82,
            },
          },
        });

      expect(answerResponse.status).toBe(200);
    }

    const completeResponse = await request(app)
      .post(`/api/interviews/${interviewId}/complete`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        durationSec: 600,
        proctoringSignals: { tabSwitches: 0, longSilenceEvents: 1, micOnRatio: 0.95, faceDetectedRatio: 1 },
      });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.report.overallScore).toBeGreaterThan(0);
    expect(completeResponse.body.report.breakdown.communication).toBeGreaterThan(0);

    const historyResponse = await request(app)
      .get("/api/interviews/history")
      .set("Authorization", `Bearer ${token}`);

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.history.length).toBe(1);

    const reportId = historyResponse.body.history[0].id;
    const reportResponse = await request(app)
      .get(`/api/interviews/reports/${reportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(reportResponse.status).toBe(200);
    expect(reportResponse.body.report.id).toBe(reportId);
  }, 15000);
});
