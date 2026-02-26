import type {
  AuthResponse,
  DashboardSummary,
  HistoryItem,
  InterviewAnswerInput,
  InterviewReport,
  InterviewSessionData,
  InterviewStartRequest,
} from "@/lib/types";

const configuredApiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

const API_BASE_URL = configuredApiBase.endsWith("/") ? configuredApiBase.slice(0, -1) : configuredApiBase;

const parseResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data as T;
};

const request = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  return parseResponse<T>(response);
};

export const api = {
  async register(payload: { name: string; email: string; password: string; role?: string; resumeBase64: string; resumeFileName: string }) {
    return request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },

  async login(payload: { email: string; password: string }) {
    return request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
  },

  async getMe(token: string) {
    return request<{ user: AuthResponse["user"] }>("/api/auth/me", {}, token);
  },

  async getPreferences(token: string) {
    return request<{ preferences: { theme: "light" | "dark" } }>("/api/users/preferences", {}, token);
  },

  async updatePreferences(token: string, payload: { theme: "light" | "dark" }) {
    return request<{ preferences: { theme: "light" | "dark" } }>("/api/users/preferences", { method: "PUT", body: JSON.stringify(payload) }, token);
  },

  async getDashboardSummary(token: string) {
    return request<DashboardSummary>("/api/dashboard/summary", {}, token);
  },

  async startInterview(token: string, payload: InterviewStartRequest) {
    return request<InterviewSessionData>("/api/interviews/start", { method: "POST", body: JSON.stringify(payload) }, token);
  },

  async submitAnswer(token: string, interviewId: string, answer: InterviewAnswerInput) {
    return request<{ interviewId: string; answerCount: number; totalQuestions: number; completed: boolean }>(
      `/api/interviews/${interviewId}/answer`,
      { method: "POST", body: JSON.stringify({ answer }) },
      token,
    );
  },

  async getInterviewSession(token: string, interviewId: string) {
    return request<InterviewSessionData & { answerCount: number; status: string }>(`/api/interviews/session/${interviewId}`, {}, token);
  },

  async completeInterview(
    token: string,
    interviewId: string,
    payload: {
      durationSec: number;
      proctoringSignals: {
        tabSwitches: number;
        longSilenceEvents: number;
        micOnRatio: number;
        faceDetectedRatio: number;
        backgroundNoiseEvents: number;
        multipleFaceEvents: number;
      };
    },
  ) {
    return request<{ reportId: string; report: InterviewReport }>(
      `/api/interviews/${interviewId}/complete`,
      { method: "POST", body: JSON.stringify(payload) },
      token,
    );
  },

  async terminateInterview(
    token: string,
    interviewId: string,
    payload: {
      reason: string;
      proctoringSignals?: {
        tabSwitches: number;
        longSilenceEvents: number;
        micOnRatio: number;
        faceDetectedRatio: number;
        backgroundNoiseEvents: number;
        multipleFaceEvents: number;
        terminationReason?: string;
      };
    },
  ) {
    return request<{ interviewId: string; status: string; reason: string }>(
      `/api/interviews/${interviewId}/terminate`,
      { method: "POST", body: JSON.stringify(payload) },
      token,
    );
  },

  async getHistory(token: string) {
    return request<{ history: HistoryItem[] }>("/api/interviews/history", {}, token);
  },

  async getReport(token: string, reportId: string) {
    return request<{ report: InterviewReport }>(`/api/interviews/reports/${reportId}`, {}, token);
  },
};
