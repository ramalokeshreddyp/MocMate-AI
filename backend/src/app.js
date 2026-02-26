import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { generateQuestions, evaluateInterview } from "./services/evaluationService.js";
import { parseResumePdf, extractProfileFromResume } from "./services/profileService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number"),
  resumeBase64: z.string().min(20, "Resume PDF is required"),
  resumeFileName: z.string().min(4, "Resume file is required"),
  role: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const startInterviewSchema = z.object({
  type: z.enum(["skill", "coding", "hr", "comprehensive"]),
  topic: z.string().min(1),
  language: z.string().optional(),
  resumeText: z.string().optional(),
});

const submitAnswerSchema = z.object({
  answer: z.object({
    transcript: z.string().optional(),
    speechMetrics: z
      .object({
        wordsPerMinute: z.number().min(0).max(220),
        pauseDurationSec: z.number().min(0).max(300),
        fillerWords: z.number().int().min(0),
        clarityScore: z.number().min(0).max(100),
      })
      .optional(),
    codeAnswer: z
      .object({
        code: z.string().min(1, "Code solution is required"),
        language: z.enum(["javascript", "python", "java", "cpp"]),
        complexityNote: z.string().optional(),
      })
      .optional(),
  }),
});

const terminateInterviewSchema = z.object({
  reason: z.string().min(5),
  proctoringSignals: z
    .object({
      tabSwitches: z.number().int().min(0).optional(),
      longSilenceEvents: z.number().int().min(0).optional(),
      micOnRatio: z.number().min(0).max(1).optional(),
      faceDetectedRatio: z.number().min(0).max(1).optional(),
      backgroundNoiseEvents: z.number().int().min(0).optional(),
      multipleFaceEvents: z.number().int().min(0).optional(),
      terminationReason: z.string().optional(),
    })
    .optional(),
});

const completeInterviewSchema = z.object({
  durationSec: z.number().int().min(1),
  proctoringSignals: z
    .object({
      tabSwitches: z.number().int().min(0).optional(),
      longSilenceEvents: z.number().int().min(0).optional(),
      micOnRatio: z.number().min(0).max(1).optional(),
      faceDetectedRatio: z.number().min(0).max(1).optional(),
      backgroundNoiseEvents: z.number().int().min(0).optional(),
      multipleFaceEvents: z.number().int().min(0).optional(),
    })
    .optional(),
});

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  profile: user.profile || null,
  preferences: user.preferences || { theme: "light" },
});

const createToken = (userId) => jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "7d" });

const authMiddleware = (repo) => async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await repo.getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const mapHistoryItem = (report) => ({
  id: report.id,
  interviewId: report.interviewId,
  type: report.interviewType,
  topic: report.topic,
  score: report.overallScore,
  durationSec: report.durationSec,
  communication: report.breakdown?.communication || 0,
  confidence: report.breakdown?.confidence || 0,
  createdAt: report.createdAt,
});

export const createApp = (repo) => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "interview-api" });
  });

  app.post("/api/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid payload" });
    }

    const { name, email, password, role = "student", resumeBase64, resumeFileName } = parsed.data;

    if (!resumeFileName.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ message: "Resume must be uploaded as PDF" });
    }

    const existing = await repo.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const resumeText = await parseResumePdf(resumeBase64);
    const profile = extractProfileFromResume(resumeText);

    const user = await repo.createUser({
      id: randomUUID(),
      name,
      email,
      passwordHash,
      role,
      resumeText,
      profile,
    });

    const token = createToken(user.id);
    return res.status(201).json({ user: sanitizeUser(user), token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Please provide valid credentials" });
    }

    const { email, password } = parsed.data;
    const user = await repo.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user.id);
    return res.json({ user: sanitizeUser(user), token });
  });

  app.get("/api/auth/me", authMiddleware(repo), async (req, res) => {
    return res.json({ user: sanitizeUser(req.user) });
  });

  app.get("/api/users/preferences", authMiddleware(repo), async (req, res) => {
    return res.json({ preferences: req.user.preferences || { theme: "light" } });
  });

  app.put("/api/users/preferences", authMiddleware(repo), async (req, res) => {
    const schema = z.object({ theme: z.enum(["light", "dark"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid preferences payload" });
    }

    const updated = await repo.updateUserPreferences(req.user.id, parsed.data);
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ preferences: updated.preferences || { theme: "light" } });
  });

  app.get("/api/dashboard/summary", authMiddleware(repo), async (req, res) => {
    const summary = await repo.getDashboardSummary(req.user.id);
    return res.json(summary);
  });

  app.post("/api/interviews/start", authMiddleware(repo), async (req, res) => {
    const parsed = startInterviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid interview request" });
    }

    const { type, topic, language, resumeText } = parsed.data;
    const questions = generateQuestions({ type, topic, resumeText });

    if (questions.length < 10) {
      return res.status(500).json({ message: "Interview generation failed to meet minimum 10-question requirement" });
    }

    const interview = await repo.createInterview({
      id: randomUUID(),
      userId: req.user.id,
      type,
      topic,
      language,
      questions,
      proctoringSignals: {
        tabSwitches: 0,
        longSilenceEvents: 0,
        micOnRatio: 1,
        faceDetectedRatio: 1,
        backgroundNoiseEvents: 0,
        multipleFaceEvents: 0,
      },
    });

    return res.status(201).json({
      interviewId: interview.id,
      type: interview.type,
      topic: interview.topic,
      language: interview.language,
      questions: interview.questions,
      startedAt: interview.startedAt,
    });
  });

  app.post("/api/interviews/:interviewId/answer", authMiddleware(repo), async (req, res) => {
    const parsed = submitAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid answer payload" });
    }

    const { interviewId } = req.params;
    const existing = await repo.getInterviewById(interviewId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const isCoding = existing.type === "coding";
    const answerPayload = parsed.data.answer;

    if (isCoding) {
      if (!answerPayload.codeAnswer?.code?.trim()) {
        return res.status(400).json({ message: "Coding interview requires a code solution" });
      }
    } else {
      if (!answerPayload.transcript || answerPayload.transcript.trim().length < 1) {
        return res.status(400).json({ message: "Transcribed answer is required" });
      }
      if (!answerPayload.speechMetrics) {
        return res.status(400).json({ message: "Speech metrics are required" });
      }
    }

    const interview = await repo.saveAnswer(interviewId, req.user.id, {
      transcript: (answerPayload.transcript || "").trim(),
      speechMetrics: answerPayload.speechMetrics || {
        wordsPerMinute: 0,
        pauseDurationSec: 0,
        fillerWords: 0,
        clarityScore: 0,
      },
      codeAnswer: answerPayload.codeAnswer || null,
    });
    if (!interview) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    return res.json({
      interviewId: interview.id,
      answerCount: interview.answers.length,
      totalQuestions: interview.questions.length,
      completed: interview.answers.length >= interview.questions.length,
    });
  });

  app.get("/api/interviews/session/:interviewId", authMiddleware(repo), async (req, res) => {
    const interview = await repo.getInterviewById(req.params.interviewId, req.user.id);
    if (!interview) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    return res.json({
      interviewId: interview.id,
      type: interview.type,
      topic: interview.topic,
      language: interview.language,
      questions: interview.questions,
      startedAt: interview.startedAt,
      answerCount: interview.answers.length,
      status: interview.status,
    });
  });

  app.post("/api/interviews/:interviewId/terminate", authMiddleware(repo), async (req, res) => {
    const parsed = terminateInterviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid termination payload" });
    }

    const { interviewId } = req.params;
    const existing = await repo.getInterviewById(interviewId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const finalSignals = {
      ...(existing.proctoringSignals || {}),
      ...(parsed.data.proctoringSignals || {}),
      terminationReason: parsed.data.reason,
    };

    const terminated = await repo.terminateInterview(interviewId, req.user.id, finalSignals);
    if (!terminated) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    return res.json({ interviewId: terminated.id, status: terminated.status, reason: parsed.data.reason });
  });

  app.post("/api/interviews/:interviewId/complete", authMiddleware(repo), async (req, res) => {
    const parsed = completeInterviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid completion payload" });
    }

    const { interviewId } = req.params;
    const existing = await repo.getInterviewById(interviewId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    if ((existing.questions?.length || 0) < 10) {
      return res.status(400).json({ message: "Interview must contain at least 10 questions" });
    }

    if ((existing.answers?.length || 0) < 10) {
      return res.status(400).json({ message: "All 10 questions are mandatory and must be answered" });
    }

    const completed = await repo.completeInterview(
      interviewId,
      req.user.id,
      parsed.data.durationSec,
      parsed.data.proctoringSignals || existing.proctoringSignals,
    );

    if (!completed) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const reportData = evaluateInterview({
      type: completed.type,
      topic: completed.topic,
      questions: completed.questions,
      answers: completed.answers,
      durationSec: completed.durationSec,
      proctoringSignals: completed.proctoringSignals,
    });

    const report = await repo.createReport({
      id: randomUUID(),
      interviewId: completed.id,
      userId: req.user.id,
      data: reportData,
    });

    return res.json({ reportId: report.id, report });
  });

  app.get("/api/interviews/history", authMiddleware(repo), async (req, res) => {
    const reports = await repo.listReportsByUser(req.user.id);
    const history = reports.map(mapHistoryItem);
    return res.json({ history });
  });

  app.get("/api/interviews/reports/:reportId", authMiddleware(repo), async (req, res) => {
    const report = await repo.getReportById(req.params.reportId, req.user.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json({ report });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    return res.status(500).json({ message: "Unexpected server error" });
  });

  // Serve static files from the frontend build directory
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));

  // SPA fallback: serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) {
        res.status(404).json({ message: "Not found" });
      }
    });
  });

  return app;
};
