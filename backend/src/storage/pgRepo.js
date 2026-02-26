import pg from "pg";

const { Pool } = pg;

const toJson = (value) => JSON.stringify(value ?? null);

export const createPgRepo = async (databaseUrl) => {
  const pool = new Pool({ connectionString: databaseUrl, ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false } });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      resume_text TEXT,
      preferences JSONB,
      profile JSONB,
      created_at TIMESTAMPTZ NOT NULL
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_text TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB;

    CREATE TABLE IF NOT EXISTS interviews (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      topic TEXT NOT NULL,
      language TEXT,
      questions JSONB NOT NULL,
      answers JSONB NOT NULL,
      proctoring_signals JSONB NOT NULL,
      status TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ,
      duration_sec INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY,
      interview_id UUID NOT NULL REFERENCES interviews(id),
      user_id UUID NOT NULL REFERENCES users(id),
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_interviews_user ON interviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
  `);

  return {
    async findUserByEmail(email) {
      const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
      if (!result.rows[0]) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        resumeText: row.resume_text,
        preferences: row.preferences,
        profile: row.profile,
        createdAt: row.created_at,
      };
    },

    async createUser({ id, name, email, passwordHash, role, resumeText = "", profile = null }) {
      const createdAt = new Date().toISOString();
      await pool.query(
        "INSERT INTO users (id, name, email, password_hash, role, resume_text, preferences, profile, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)",
        [id, name, email, passwordHash, role, resumeText, toJson({ theme: "light" }), toJson(profile), createdAt],
      );
      return { id, name, email, passwordHash, role, resumeText, preferences: { theme: "light" }, profile, createdAt };
    },

    async getUserById(id) {
      const result = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
      if (!result.rows[0]) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        resumeText: row.resume_text,
        preferences: row.preferences,
        profile: row.profile,
        createdAt: row.created_at,
      };
    },

    async updateUserPreferences(userId, preferences) {
      const result = await pool.query(
        "UPDATE users SET preferences = COALESCE(preferences, '{}'::jsonb) || $1::jsonb WHERE id = $2 RETURNING *",
        [toJson(preferences), userId],
      );
      if (!result.rows[0]) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        resumeText: row.resume_text,
        preferences: row.preferences,
        profile: row.profile,
        createdAt: row.created_at,
      };
    },

    async createInterview(payload) {
      await pool.query(
        `INSERT INTO interviews
         (id, user_id, type, topic, language, questions, answers, proctoring_signals, status, started_at, completed_at, duration_sec)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10, $11, $12)`,
        [
          payload.id,
          payload.userId,
          payload.type,
          payload.topic,
          payload.language || "",
          toJson(payload.questions),
          toJson([]),
          toJson(payload.proctoringSignals || {}),
          "in_progress",
          new Date().toISOString(),
          null,
          0,
        ],
      );

      return {
        id: payload.id,
        userId: payload.userId,
        type: payload.type,
        topic: payload.topic,
        language: payload.language || "",
        questions: payload.questions,
        answers: [],
        proctoringSignals: payload.proctoringSignals || {},
        status: "in_progress",
        startedAt: new Date().toISOString(),
      };
    },

    async getInterviewById(interviewId, userId) {
      const result = await pool.query("SELECT * FROM interviews WHERE id = $1 AND user_id = $2 LIMIT 1", [interviewId, userId]);
      if (!result.rows[0]) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        topic: row.topic,
        language: row.language,
        questions: row.questions,
        answers: row.answers,
        proctoringSignals: row.proctoring_signals,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        durationSec: row.duration_sec,
      };
    },

    async saveAnswer(interviewId, userId, answer) {
      const existing = await this.getInterviewById(interviewId, userId);
      if (!existing) return null;

      const answers = [...(existing.answers || []), answer];
      await pool.query("UPDATE interviews SET answers = $1::jsonb WHERE id = $2 AND user_id = $3", [toJson(answers), interviewId, userId]);
      return { ...existing, answers };
    },

    async completeInterview(interviewId, userId, durationSec, proctoringSignals) {
      await pool.query(
        "UPDATE interviews SET status = $1, completed_at = $2, duration_sec = $3, proctoring_signals = $4::jsonb WHERE id = $5 AND user_id = $6",
        ["completed", new Date().toISOString(), durationSec, toJson(proctoringSignals || {}), interviewId, userId],
      );
      return this.getInterviewById(interviewId, userId);
    },

    async terminateInterview(interviewId, userId, proctoringSignals) {
      await pool.query(
        "UPDATE interviews SET status = $1, completed_at = $2, proctoring_signals = $3::jsonb WHERE id = $4 AND user_id = $5",
        ["terminated", new Date().toISOString(), toJson(proctoringSignals || {}), interviewId, userId],
      );
      return this.getInterviewById(interviewId, userId);
    },

    async createReport(payload) {
      const id = payload.id;
      const createdAt = new Date().toISOString();

      await pool.query(
        "INSERT INTO reports (id, interview_id, user_id, data, created_at) VALUES ($1, $2, $3, $4::jsonb, $5)",
        [id, payload.interviewId, payload.userId, toJson(payload.data), createdAt],
      );

      return { id, interviewId: payload.interviewId, userId: payload.userId, ...payload.data, createdAt };
    },

    async getReportById(reportId, userId) {
      const result = await pool.query("SELECT * FROM reports WHERE id = $1 AND user_id = $2 LIMIT 1", [reportId, userId]);
      if (!result.rows[0]) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        interviewId: row.interview_id,
        userId: row.user_id,
        createdAt: row.created_at,
        ...row.data,
      };
    },

    async listReportsByUser(userId) {
      const result = await pool.query("SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
      return result.rows.map((row) => ({
        id: row.id,
        interviewId: row.interview_id,
        userId: row.user_id,
        createdAt: row.created_at,
        ...row.data,
      }));
    },

    async getDashboardSummary(userId) {
      const reports = await this.listReportsByUser(userId);
      const interviewResult = await pool.query("SELECT status FROM interviews WHERE user_id = $1", [userId]);

      const totalInterviews = interviewResult.rows.length;
      const completedInterviews = interviewResult.rows.filter((item) => item.status === "completed").length;

      const scores = reports.map((item) => item.overallScore || 0);
      const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const bestScore = scores.length ? Math.max(...scores) : 0;
      const recentInterview = reports[0] || null;

      const performanceTrend = reports
        .slice(0, 8)
        .reverse()
        .map((item, index) => ({ name: `Round ${index + 1}`, score: item.overallScore }));

      const latestBreakdown = recentInterview?.breakdown || {};
      const entries = Object.entries(latestBreakdown).filter(([, value]) => typeof value === "number");
      const weakArea = entries.length
        ? entries.reduce((acc, current) => (current[1] < acc[1] ? current : acc))[0]
        : "consistency";
      const strongArea = entries.length
        ? entries.reduce((acc, current) => (current[1] > acc[1] ? current : acc))[0]
        : "relevance";

      const completed = await pool.query("SELECT duration_sec, type FROM interviews WHERE user_id = $1 AND status = 'completed'", [userId]);
      const avgDurationSec = completed.rows.length
        ? Math.round(completed.rows.reduce((sum, item) => sum + (item.duration_sec || 0), 0) / completed.rows.length)
        : 0;

      const confidenceTrend = reports
        .slice(0, 8)
        .reverse()
        .map((item, index) => ({ name: `Round ${index + 1}`, score: item.breakdown?.confidence || 0 }));

      const fillerWordFrequency = reports
        .slice(0, 8)
        .reverse()
        .map((item, index) => ({ name: `Round ${index + 1}`, count: item.speechMetrics?.fillerWordsTotal || 0 }));

      const grouped = new Map();
      reports.forEach((item) => {
        const values = grouped.get(item.interviewType) || [];
        values.push(item.overallScore);
        grouped.set(item.interviewType, values);
      });

      let mostImprovedCategory = "n/a";
      let highestDelta = -Infinity;
      for (const [category, values] of grouped.entries()) {
        if (values.length < 2) continue;
        const delta = values[values.length - 1] - values[0];
        if (delta > highestDelta) {
          highestDelta = delta;
          mostImprovedCategory = category;
        }
      }

      return {
        totalInterviews,
        completedInterviews,
        averageScore,
        bestScore,
        recentInterview,
        performanceTrend,
        weakArea,
        strongArea,
        weakestParameter: weakArea,
        mostImprovedCategory,
        confidenceTrend,
        avgDurationSec,
        fillerWordFrequency,
      };
    },
  };
};
