import { randomUUID } from "node:crypto";

export const createMemoryRepo = () => {
  const users = [];
  const interviews = [];
  const reports = [];

  return {
    async findUserByEmail(email) {
      return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
    },

    async createUser({ id, name, email, passwordHash, role = "student", resumeText = "", profile = null }) {
      const user = {
        id: id || randomUUID(),
        name,
        email,
        passwordHash,
        role,
        resumeText,
        profile,
        preferences: { theme: "light" },
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      return user;
    },

    async updateUserPreferences(userId, preferences) {
      const user = users.find((item) => item.id === userId);
      if (!user) {
        return null;
      }
      user.preferences = { ...(user.preferences || {}), ...preferences };
      return user;
    },

    async getUserById(id) {
      return users.find((user) => user.id === id) || null;
    },

    async createInterview(payload) {
      const interview = {
        id: randomUUID(),
        userId: payload.userId,
        type: payload.type,
        topic: payload.topic,
        language: payload.language || "",
        questions: payload.questions,
        answers: [],
        proctoringSignals: payload.proctoringSignals || {},
        status: "in_progress",
        startedAt: new Date().toISOString(),
        completedAt: null,
        durationSec: 0,
      };
      interviews.push(interview);
      return interview;
    },

    async getInterviewById(interviewId, userId) {
      return interviews.find((item) => item.id === interviewId && item.userId === userId) || null;
    },

    async saveAnswer(interviewId, userId, answer) {
      const interview = interviews.find((item) => item.id === interviewId && item.userId === userId);
      if (!interview) {
        return null;
      }
      interview.answers.push(answer);
      return interview;
    },

    async completeInterview(interviewId, userId, durationSec, proctoringSignals) {
      const interview = interviews.find((item) => item.id === interviewId && item.userId === userId);
      if (!interview) {
        return null;
      }
      interview.status = "completed";
      interview.completedAt = new Date().toISOString();
      interview.durationSec = durationSec;
      interview.proctoringSignals = proctoringSignals || interview.proctoringSignals;
      return interview;
    },

    async terminateInterview(interviewId, userId, proctoringSignals) {
      const interview = interviews.find((item) => item.id === interviewId && item.userId === userId);
      if (!interview) {
        return null;
      }
      interview.status = "terminated";
      interview.completedAt = new Date().toISOString();
      interview.proctoringSignals = proctoringSignals || interview.proctoringSignals;
      return interview;
    },

    async createReport(payload) {
      const report = {
        id: randomUUID(),
        interviewId: payload.interviewId,
        userId: payload.userId,
        createdAt: new Date().toISOString(),
        ...payload.data,
      };
      reports.push(report);
      return report;
    },

    async getReportById(reportId, userId) {
      return reports.find((item) => item.id === reportId && item.userId === userId) || null;
    },

    async listReportsByUser(userId) {
      return reports
        .filter((item) => item.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async getDashboardSummary(userId) {
      const userReports = reports.filter((item) => item.userId === userId);
      const userInterviews = interviews.filter((item) => item.userId === userId);

      const totalInterviews = userInterviews.length;
      const completedInterviews = userInterviews.filter((item) => item.status === "completed").length;
      const scores = userReports.map((item) => item.overallScore);
      const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const bestScore = scores.length ? Math.max(...scores) : 0;
      const recentInterview = userReports[0] || null;

      const performanceTrend = userReports
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

      const avgDurationSec = completedInterviews
        ? Math.round(userInterviews.filter((item) => item.status === "completed").reduce((sum, item) => sum + item.durationSec, 0) / completedInterviews)
        : 0;

      const confidenceTrend = userReports
        .slice(0, 8)
        .reverse()
        .map((item, index) => ({ name: `Round ${index + 1}`, score: item.breakdown?.confidence || 0 }));

      const fillerWordFrequency = userReports
        .slice(0, 8)
        .reverse()
        .map((item, index) => ({ name: `Round ${index + 1}`, count: item.speechMetrics?.fillerWordsTotal || 0 }));

      const categoryScores = new Map();
      userReports.forEach((item) => {
        const key = item.interviewType;
        const existing = categoryScores.get(key) || [];
        existing.push(item.overallScore);
        categoryScores.set(key, existing);
      });

      let mostImprovedCategory = "n/a";
      let highestDelta = -Infinity;
      for (const [category, values] of categoryScores.entries()) {
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
