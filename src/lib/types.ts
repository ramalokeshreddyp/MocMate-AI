export type InterviewType = "skill" | "coding" | "hr" | "comprehensive";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  preferences?: {
    theme: "light" | "dark";
  };
  profile?: {
    extractedSkills: string[];
    projects: string[];
    education: string[];
    keywords: string[];
    recommendedCategories: string[];
    weakAreaEstimation: string;
  } | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardSummary {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
  recentInterview: InterviewReport | null;
  performanceTrend: Array<{ name: string; score: number }>;
  weakArea: string;
  strongArea: string;
  weakestParameter: string;
  mostImprovedCategory: string;
  confidenceTrend: Array<{ name: string; score: number }>;
  avgDurationSec: number;
  fillerWordFrequency: Array<{ name: string; count: number }>;
}

export interface InterviewStartRequest {
  type: InterviewType;
  topic: string;
  language?: string;
  resumeText?: string;
}

export interface InterviewSessionData {
  interviewId: string;
  type: InterviewType;
  topic: string;
  language?: string;
  questions: string[];
  startedAt: string;
}

export interface InterviewBreakdown {
  relevance: number;
  coverage: number;
  completeness: number;
  structure: number;
  grammar: number;
  communication: number;
  confidence: number;
  eyeContact?: number;
}

export interface SpeechMetrics {
  wordsPerMinute: number;
  pauseDurationSec: number;
  fillerWords: number;
  clarityScore: number;
}

export interface InterviewReport {
  id: string;
  interviewId: string;
  interviewType: InterviewType;
  topic: string;
  durationSec: number;
  overallScore: number;
  breakdown: InterviewBreakdown;
  speechMetrics: {
    wordsPerMinuteAvg: number;
    pauseDurationTotalSec: number;
    fillerWordsTotal: number;
    clarityAvg: number;
  };
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  createdAt: string;
  questionBreakdown?: Array<{
    questionNumber: number;
    question: string;
    answer: string;
    status: "answered" | "unanswered";
    score: number;
    wordCount: number;
    metrics: {
      keywordCoverage: number;
      structure: number;
      clarity: number;
      communication: number;
      speechClarity: number;
      fillerWords: number;
      wordsPerMinute: number;
    };
    feedback: string[];
    improvements: string[];
  }>;
}

export interface InterviewAnswerInput {
  transcript?: string;
  speechMetrics?: SpeechMetrics;
  codeAnswer?: {
    code: string;
    language: "javascript" | "python" | "java" | "cpp";
    complexityNote?: string;
  };
}

export interface HistoryItem {
  id: string;
  interviewId: string;
  type: InterviewType;
  topic: string;
  score: number;
  durationSec: number;
  communication: number;
  confidence: number;
  createdAt: string;
}
