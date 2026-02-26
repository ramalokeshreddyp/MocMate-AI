import { describe, expect, it } from "vitest";
import { evaluateInterview, generateQuestions } from "./evaluationService.js";

describe("evaluation service", () => {
  it("generates fallback questions for unknown topics", () => {
    const questions = generateQuestions({ type: "skill", topic: "unknown-topic" });
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(10);
  });

  it("generates HR questions using resume keywords", () => {
    const questions = generateQuestions({
      type: "hr",
      topic: "resume",
      resumeText:
        "Built scalable React dashboard for analytics, improved performance by 40 percent, collaborated with product team and deployed Node API services.",
    });

    expect(questions.length).toBe(10);
    expect(questions[0].toLowerCase()).toContain("experience");
  });

  it("returns structured report breakdown", () => {
    const report = evaluateInterview({
      type: "skill",
      topic: "javascript",
      questions: [
        "How do hash maps help reduce lookup complexity?",
        "How do you handle edge cases in array problems?",
      ],
      answers: [
        {
          transcript: "First I clarify constraints, then I iterate and track seen values using a hash map for O(n).",
          speechMetrics: { wordsPerMinute: 116, pauseDurationSec: 3, fillerWords: 1, clarityScore: 82 },
        },
        {
          transcript: "For example, I handle empty arrays and duplicate numbers as edge cases.",
          speechMetrics: { wordsPerMinute: 124, pauseDurationSec: 2, fillerWords: 0, clarityScore: 86 },
        },
      ],
      durationSec: 420,
      proctoringSignals: { tabSwitches: 0, longSilenceEvents: 0, micOnRatio: 1, faceDetectedRatio: 1 },
    });

    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.breakdown.coverage).toBeGreaterThanOrEqual(0);
    expect(report.breakdown.communication).toBeGreaterThanOrEqual(0);
    expect(report.speechMetrics.fillerWordsTotal).toBeGreaterThanOrEqual(0);
    expect(report.summary.length).toBeGreaterThan(10);
    expect(report.strengths.length).toBeGreaterThan(0);
    expect(report.suggestions.length).toBeGreaterThan(0);
    expect(Array.isArray(report.questionBreakdown)).toBe(true);
    expect(report.questionBreakdown.length).toBe(2);
    expect(report.questionBreakdown[0].questionNumber).toBe(1);
  });

  it("penalizes unanswered responses and flags them in question breakdown", () => {
    const report = evaluateInterview({
      type: "hr",
      topic: "behavioral",
      questions: ["Tell me about yourself", "Describe a conflict you resolved"],
      answers: [
        {
          transcript: "[UNANSWERED - TIMEOUT]",
          speechMetrics: { wordsPerMinute: 0, pauseDurationSec: 60, fillerWords: 0, clarityScore: 0 },
        },
        {
          transcript: "",
          speechMetrics: { wordsPerMinute: 0, pauseDurationSec: 60, fillerWords: 0, clarityScore: 0 },
        },
      ],
      durationSec: 120,
      proctoringSignals: { tabSwitches: 1, longSilenceEvents: 2, micOnRatio: 0.5, faceDetectedRatio: 0.6 },
    });

    expect(report.unansweredCount).toBe(2);
    expect(report.overallScore).toBeLessThan(35);
    expect(report.questionBreakdown[0].status).toBe("unanswered");
    expect(report.questionBreakdown[1].status).toBe("unanswered");
    expect(report.questionBreakdown[0].score).toBe(0);
    expect(report.improvements.some((item) => item.includes("unanswered") || item.includes("timed out"))).toBe(true);
  });

  it("forces very low score for semantically wrong answers", () => {
    const report = evaluateInterview({
      type: "skill",
      topic: "react",
      questions: [
        "Explain React virtual DOM and reconciliation.",
        "How do hooks help component reuse?",
      ],
      answers: [
        {
          transcript: "I like football and cooking recipes on weekends.",
          speechMetrics: { wordsPerMinute: 120, pauseDurationSec: 1, fillerWords: 0, clarityScore: 80 },
        },
        {
          transcript: "Mountains are beautiful and weather is nice today.",
          speechMetrics: { wordsPerMinute: 118, pauseDurationSec: 1, fillerWords: 0, clarityScore: 82 },
        },
      ],
      durationSec: 120,
      proctoringSignals: { tabSwitches: 0, longSilenceEvents: 0, micOnRatio: 1, faceDetectedRatio: 1 },
    });

    expect(report.breakdown.relevance).toBe(0);
    expect(report.breakdown.coverage).toBe(0);
    expect(report.overallScore).toBeLessThanOrEqual(12);
  });

  it("evaluates coding answers using code validation tests", () => {
    const report = evaluateInterview({
      type: "coding",
      topic: "arrays",
      questions: [
        "Write a function solve(nums) that returns the first non-repeating element in an integer array, or -1.",
      ],
      answers: [
        {
          transcript: "",
          codeAnswer: {
            language: "javascript",
            code: `function solve(nums){ const map = new Map(); for (const n of nums) map.set(n, (map.get(n) || 0) + 1); for (const n of nums) if (map.get(n) === 1) return n; return -1; }`,
            complexityNote: "Uses frequency map in O(n) time and O(n) space.",
          },
          speechMetrics: { wordsPerMinute: 0, pauseDurationSec: 0, fillerWords: 0, clarityScore: 0 },
        },
      ],
      durationSec: 120,
      proctoringSignals: { tabSwitches: 0, longSilenceEvents: 0, micOnRatio: 1, faceDetectedRatio: 1 },
    });

    expect(report.overallScore).toBeGreaterThan(65);
    expect(report.questionBreakdown?.[0]?.feedback?.[0]).toContain("Correct");
  });
});
