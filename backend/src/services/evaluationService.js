import vm from "node:vm";

const keywordBank = {
  react: ["state", "props", "hooks", "component", "performance", "virtual dom"],
  python: ["function", "list", "dictionary", "complexity", "exception", "module"],
  java: ["class", "object", "inheritance", "interface", "collection", "thread"],
  ml: ["model", "feature", "training", "overfitting", "evaluation", "dataset"],
  sql: ["join", "index", "query", "normalization", "transaction", "constraint"],
  javascript: ["closure", "promise", "async", "scope", "event loop", "prototype"],
  nodejs: ["event loop", "middleware", "api", "stream", "async", "express"],
  "system-design": ["scalability", "latency", "cache", "availability", "load balancer", "database"],
  arrays: ["iteration", "index", "complexity", "edge case", "memory", "array"],
  "linked-lists": ["node", "pointer", "traversal", "complexity", "insertion", "deletion"],
  trees: ["traversal", "recursion", "height", "balanced", "node", "complexity"],
  dp: ["subproblem", "memoization", "tabulation", "state", "transition", "optimal"],
  sorting: ["comparison", "partition", "stability", "complexity", "pivot", "merge"],
  recursion: ["base case", "stack", "call", "termination", "depth", "backtracking"],
  behavioral: ["team", "challenge", "impact", "learning", "ownership", "result"],
  situational: ["conflict", "decision", "priority", "stakeholder", "result", "adapt"],
  resume: ["project", "impact", "responsibility", "achievement", "metric", "role"],
  culture: ["value", "collaboration", "growth", "ethics", "adaptability", "communication"],
  default: ["problem", "approach", "example", "result", "tradeoff", "clarity"],
};

const questionMap = {
  skill: {
    react: [
      "Explain virtual DOM and how React optimizes rendering.",
      "How would you prevent unnecessary re-renders in a large React app?",
      "When would you choose Context API vs external state management?",
      "How do hooks improve component design and reuse?",
      "How do you optimize bundle size in React applications?",
      "Explain React reconciliation and key usage in lists.",
      "How do you structure reusable component architecture?",
      "What are controlled vs uncontrolled components and tradeoffs?",
      "Explain useMemo and useCallback with practical examples.",
      "How would you design robust error boundaries in production?",
    ],
  },
  coding: {
    arrays: [
      "Write a function solve(nums) that returns the first non-repeating element in an integer array, or -1.",
      "Write solve(nums, target) to return the indices of two numbers that add up to target.",
      "Write solve(nums, k) to rotate an array to the right by k positions and return the rotated array.",
      "Write solve(nums) that returns a deduplicated array preserving first occurrence order.",
      "Write solve(nums) that returns the maximum subarray sum.",
      "Write solve(nums) that returns true if duplicates exist, else false.",
      "Write solve(intervals) that merges overlapping intervals and returns merged intervals.",
      "Write solve(str) that returns the length of the longest substring without repeating characters.",
      "Write solve(nums, k) that returns the kth largest element in nums.",
      "Write solve(nums) that returns the sorted array in ascending order.",
    ],
  },
  hr: {
    behavioral: [
      "Tell me about a time you resolved a team conflict.",
      "Describe a difficult deadline and how you handled it.",
      "Share a failure and what you learned from it.",
      "How do you communicate technical issues to non-technical stakeholders?",
      "Describe a situation where you had to prioritize multiple tasks.",
      "Tell me about a time you received tough feedback.",
      "How do you handle disagreements with leadership decisions?",
      "Describe a high-pressure situation and your response.",
      "How do you ensure accountability in team projects?",
      "What motivates you and how do you stay consistent?",
    ],
  },
  comprehensive: {
    intermediate: [
      "Explain one technical concept deeply and where you applied it.",
      "How do you debug complex production failures systematically?",
      "Describe how you improved performance of a system you built.",
      "Solve a medium coding problem and explain trade-offs.",
      "Explain your approach to handling edge cases in coding tasks.",
      "How would you optimize time and space complexity in your solution?",
      "Describe a behavioral challenge using STAR framework.",
      "Tell me about a conflict you resolved across teams.",
      "How do you communicate progress and blockers proactively?",
      "What will you improve in the next 30 days for interviews?",
    ],
  },
};

const stopWords = new Set([
  "the",
  "and",
  "with",
  "from",
  "that",
  "this",
  "have",
  "were",
  "your",
  "for",
  "you",
  "has",
  "had",
  "are",
  "was",
  "our",
  "their",
  "about",
  "into",
  "over",
  "under",
  "using",
  "used",
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && token.length > 2 && !stopWords.has(token));

const semanticSimilarity = (answer = "", question = "") => {
  const answerTokens = new Set(tokenize(answer));
  const questionTokens = tokenize(question);
  if (!answerTokens.size || !questionTokens.length) return 0;
  const overlap = questionTokens.filter((token) => answerTokens.has(token)).length;
  return overlap / questionTokens.length;
};

const scoreStructure = (answers) => {
  const joined = answers.join(" ").toLowerCase();
  if (!joined || joined.includes("[unanswered")) return 0;

  const indicators = ["first", "then", "because", "for example", "therefore", "finally", "however", "additionally"];
  const hits = indicators.filter((i) => joined.includes(i)).length;

  if (hits === 0) return 15;
  if (hits === 1) return 30;
  if (hits === 2) return 50;
  if (hits === 3) return 65;
  return Math.min(90, 65 + hits * 5);
};

const scoreGrammarClarity = (answers) => {
  const joined = answers.join(" ");
  if (!joined || joined.includes("[UNANSWERED")) return 0;

  const punctuationCount = (joined.match(/[.,;:!?]/g) || []).length;
  const sentences = joined.split(/[.!?]+/).filter(Boolean).length;

  let score = 40;
  if (punctuationCount > 0 && sentences > 0) {
    const avgPuncPerSentence = punctuationCount / sentences;
    score += Math.min(25, avgPuncPerSentence * 8);
  }

  if (sentences > 2) score += 15;
  if (sentences > 4) score += 10;

  return Math.min(95, score);
};

const scoreConfidence = (signals = {}) => {
  const {
    tabSwitches = 0,
    longSilenceEvents = 0,
    micOnRatio = 1,
    faceDetectedRatio = 1,
    backgroundNoiseEvents = 0,
    multipleFaceEvents = 0,
  } = signals;

  let score = 70;
  score -= tabSwitches * 10;
  score -= longSilenceEvents * 7;
  score -= backgroundNoiseEvents * 4;
  score -= multipleFaceEvents * 15;
  score += micOnRatio * 15;
  score += faceDetectedRatio * 15;

  return Math.max(5, Math.min(97, score));
};

const extractResumeKeywords = (resumeText = "") => {
  const words = resumeText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  const counts = new Map();
  words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
};

const normalizeAnswers = (answers = []) =>
  answers.map((item) => {
    if (typeof item === "string") {
      return { transcript: item, speechMetrics: { fillerWords: 0, pauseDurationSec: 0, wordsPerMinute: 0, clarityScore: 0 } };
    }

    return {
      transcript: item.transcript || "",
      codeAnswer: item.codeAnswer || null,
      speechMetrics: item.speechMetrics || { fillerWords: 0, pauseDurationSec: 0, wordsPerMinute: 0, clarityScore: 0 },
    };
  });

const codingValidators = {
  0: {
    tests: [
      (fn) => fn([4, 5, 1, 2, 1, 2, 4]) === 5,
      (fn) => fn([7, 7, 9]) === 9,
      (fn) => fn([1, 1, 2, 2]) === -1,
    ],
    requiredKeywords: ["frequency", "map", "count"],
  },
  1: {
    tests: [
      (fn) => JSON.stringify(fn([2, 7, 11, 15], 9)) === JSON.stringify([0, 1]),
      (fn) => JSON.stringify(fn([3, 2, 4], 6)) === JSON.stringify([1, 2]),
      (fn) => JSON.stringify(fn([3, 3], 6)) === JSON.stringify([0, 1]),
    ],
    requiredKeywords: ["hash", "map", "target"],
  },
  2: {
    tests: [
      (fn) => JSON.stringify(fn([1, 2, 3, 4, 5], 2)) === JSON.stringify([4, 5, 1, 2, 3]),
      (fn) => JSON.stringify(fn([1, 2], 3)) === JSON.stringify([2, 1]),
      (fn) => JSON.stringify(fn([], 4)) === JSON.stringify([]),
    ],
    requiredKeywords: ["mod", "slice", "length"],
  },
  3: {
    tests: [
      (fn) => JSON.stringify(fn([1, 2, 2, 3, 1, 4])) === JSON.stringify([1, 2, 3, 4]),
      (fn) => JSON.stringify(fn([5, 5, 5])) === JSON.stringify([5]),
      (fn) => JSON.stringify(fn([])) === JSON.stringify([]),
    ],
    requiredKeywords: ["set", "order", "unique"],
  },
  4: {
    tests: [
      (fn) => fn([-2, 1, -3, 4, -1, 2, 1, -5, 4]) === 6,
      (fn) => fn([1]) === 1,
      (fn) => fn([5, 4, -1, 7, 8]) === 23,
    ],
    requiredKeywords: ["kadane", "sum", "max"],
  },
  5: {
    tests: [(fn) => fn([1, 2, 3, 1]) === true, (fn) => fn([1, 2, 3, 4]) === false, (fn) => fn([]) === false],
    requiredKeywords: ["set", "duplicate", "seen"],
  },
  6: {
    tests: [
      (fn) => JSON.stringify(fn([[1, 3], [2, 6], [8, 10], [15, 18]])) === JSON.stringify([[1, 6], [8, 10], [15, 18]]),
      (fn) => JSON.stringify(fn([[1, 4], [4, 5]])) === JSON.stringify([[1, 5]]),
      (fn) => JSON.stringify(fn([])) === JSON.stringify([]),
    ],
    requiredKeywords: ["sort", "merge", "overlap"],
  },
  7: {
    tests: [(fn) => fn("abcabcbb") === 3, (fn) => fn("bbbbb") === 1, (fn) => fn("") === 0],
    requiredKeywords: ["window", "set", "substring"],
  },
  8: {
    tests: [
      (fn) => fn([3, 2, 1, 5, 6, 4], 2) === 5,
      (fn) => fn([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) === 4,
      (fn) => fn([1], 1) === 1,
    ],
    requiredKeywords: ["heap", "sort", "partition"],
  },
  9: {
    tests: [
      (fn) => JSON.stringify(fn([3, 1, 2])) === JSON.stringify([1, 2, 3]),
      (fn) => JSON.stringify(fn([])) === JSON.stringify([]),
      (fn) => JSON.stringify(fn([5])) === JSON.stringify([5]),
    ],
    requiredKeywords: ["sort", "compare", "ascending"],
  },
};

const evaluateJavaScriptCode = (code = "", questionIndex = 0) => {
  const validator = codingValidators[questionIndex];
  if (!validator) {
    return {
      passed: false,
      passedCount: 0,
      totalTests: 0,
      passRate: 0,
      errorFreeExecution: false,
      syntaxError: false,
      message: "Coding validator missing for this question.",
    };
  }

  try {
    const script = new vm.Script(`${code}\n;typeof solve === 'function' ? solve : null;`);
    const context = vm.createContext({});
    const exported = script.runInContext(context, { timeout: 1200 });

    if (typeof exported !== "function") {
      return {
        passed: false,
        passedCount: 0,
        totalTests: validator.tests.length,
        passRate: 0,
        errorFreeExecution: false,
        syntaxError: false,
        message: "Define a function named solve(...) in your code.",
      };
    }

    let passedCount = 0;
    for (const test of validator.tests) {
      try {
        if (test(exported)) {
          passedCount += 1;
        }
      } catch {
        void 0;
      }
    }

    const totalTests = validator.tests.length;
    const passRate = totalTests ? passedCount / totalTests : 0;
    const passed = passedCount === totalTests;

    return {
      passed,
      passedCount,
      totalTests,
      passRate,
      errorFreeExecution: true,
      syntaxError: false,
      message: passed ? `All ${totalTests} test cases passed.` : `${passedCount}/${totalTests} test cases passed.`,
    };
  } catch (error) {
    return {
      passed: false,
      passedCount: 0,
      totalTests: validator.tests.length,
      passRate: 0,
      errorFreeExecution: false,
      syntaxError: true,
      message: `Syntax/runtime error: ${error instanceof Error ? error.message : "Invalid code"}`,
    };
  }
};

const evaluateCodingAnswer = ({ answer, questionIndex, questionText }) => {
  const code = answer?.codeAnswer?.code || "";
  const language = answer?.codeAnswer?.language || "javascript";
  const complexityNote = answer?.codeAnswer?.complexityNote || "";

  if (!code.trim() || code.includes("[UNANSWERED")) {
    return {
      questionScore: 0,
      relevance: 0,
      coverage: 0,
      structure: 0,
      communication: 0,
      grammar: 0,
      correctness: 0,
      testPassPercent: 0,
      executionQuality: 0,
      passed: false,
      feedback: ["Incorrect: no valid code submitted."],
      improvements: ["Submit a working solve(...) function for this question."],
    };
  }

  if (language !== "javascript") {
    return {
      questionScore: 0,
      relevance: 0,
      coverage: 0,
      structure: 0,
      communication: 0,
      grammar: 0,
      correctness: 0,
      testPassPercent: 0,
      executionQuality: 0,
      passed: false,
      feedback: ["Incorrect: current runtime validates only JavaScript `solve(...)` submissions."],
      improvements: ["Switch language to JavaScript and submit executable code to run test cases."],
    };
  }

  const execution = evaluateJavaScriptCode(code, questionIndex);
  const semantic = semanticSimilarity(`${code} ${complexityNote}`, questionText);
  const requiredKeywords = codingValidators[questionIndex]?.requiredKeywords || ["algorithm", "complexity"];
  const keywordHits = requiredKeywords.filter((word) => `${code} ${complexityNote}`.toLowerCase().includes(word)).length;
  const keywordRatio = requiredKeywords.length ? keywordHits / requiredKeywords.length : 0;

  const testPassPercent = Math.round(clamp(execution.passRate * 100, 0, 100));
  const logicalCorrectness = Math.round(clamp(semantic * 70 + keywordRatio * 30, 0, 100));
  const executionQuality = execution.errorFreeExecution ? 100 : 0;

  if (testPassPercent === 0 || semantic < 0.12) {
    return {
      questionScore: execution.syntaxError ? 0 : Math.min(12, Math.round(testPassPercent * 0.2 + logicalCorrectness * 0.1)),
      relevance: 0,
      coverage: 0,
      structure: execution.syntaxError ? 0 : Math.round(clamp(keywordRatio * 40, 0, 40)),
      communication: 0,
      grammar: execution.syntaxError ? 0 : 20,
      correctness: 0,
      testPassPercent,
      executionQuality,
      passed: false,
      feedback: [`Incorrect: ${execution.message}`],
      improvements: [
        "Fix logic so test cases pass for expected outputs.",
        "Handle edge cases and ensure `solve(...)` returns correct values.",
      ],
    };
  }

  const relevance = Math.round(clamp(semantic * 100, 0, 100));
  const coverage = Math.round(clamp(keywordRatio * 100, 0, 100));
  const structure = Math.round(clamp(55 + keywordRatio * 35, 0, 95));
  const communication = 0;
  const grammar = 0;
  const correctness = Math.round(testPassPercent * 0.7 + logicalCorrectness * 0.3);
  const questionScore = Math.round(testPassPercent * 0.65 + logicalCorrectness * 0.25 + executionQuality * 0.1);

  return {
    questionScore,
    relevance,
    coverage,
    structure,
    communication,
    grammar,
    correctness,
    testPassPercent,
    executionQuality,
    passed: true,
    feedback: [`Correct: ${execution.message}`],
    improvements: coverage < 50 ? ["Add concise complexity and edge-case notes with algorithm keywords."] : [],
  };
};

export const generateQuestions = ({ type, topic, resumeText = "" }) => {
  if (type === "hr" && resumeText.trim().length > 20) {
    const resumeKeywords = extractResumeKeywords(resumeText);
    if (resumeKeywords.length) {
      return [
        `Walk me through your experience with ${resumeKeywords[0]} and its measurable impact.`,
        `Tell me about a challenge you solved while working on ${resumeKeywords[1] || "a key project"}.`,
        `How did your work on ${resumeKeywords[2] || "your recent projects"} improve outcomes for stakeholders?`,
        "How do you prioritize responsibilities when deadlines overlap?",
        "Tell me about one achievement you are most proud of and why.",
        "How do you handle critical feedback from mentors or managers?",
        "Describe a scenario where you had to adapt quickly.",
        "How do your project experiences align with this role?",
        "What communication strategy do you use in cross-functional teams?",
        "What is your 6-month professional growth plan?",
      ];
    }
  }

  const byType = questionMap[type] || {};
  const selectedQuestions = byType[topic] || byType.intermediate || byType.behavioral;

  if (selectedQuestions?.length) {
    return selectedQuestions.slice(0, 10);
  }

  return [
    "Explain your approach to solving this interview problem.",
    "What trade-offs did you consider in your answer?",
    "How would you improve your solution under production constraints?",
    "Summarize your final recommendation clearly.",
    "How do you validate correctness and reliability?",
    "How do you handle edge cases?",
    "What assumptions did you make?",
    "How do you communicate this to non-technical stakeholders?",
    "What metrics would you track post-implementation?",
    "What would be your next iteration?",
  ];
};

const evaluateCodingInterview = ({ type, topic, questions, normalizedAnswers, durationSec, proctoringSignals }) => {
  const codingResults = normalizedAnswers.map((answer, index) =>
    evaluateCodingAnswer({ answer, questionIndex: index, questionText: questions[index] || `Question ${index + 1}` }),
  );

  const relevance = Math.round(codingResults.reduce((sum, item) => sum + item.relevance, 0) / Math.max(1, codingResults.length));
  const coverage = Math.round(codingResults.reduce((sum, item) => sum + item.coverage, 0) / Math.max(1, codingResults.length));
  const structure = Math.round(codingResults.reduce((sum, item) => sum + item.structure, 0) / Math.max(1, codingResults.length));
  const grammar = 0;
  const communication = 0;
  const confidence = 0;
  const eyeContact = Math.round(clamp((proctoringSignals?.faceDetectedRatio ?? 0) * 100, 0, 100));
  const completeness = Math.round(clamp((relevance + coverage + structure) / 3, 0, 100));

  const correctnessAvg = Math.round(codingResults.reduce((sum, item) => sum + item.correctness, 0) / Math.max(1, codingResults.length));
  const avgTestPassPercent = Math.round(codingResults.reduce((sum, item) => sum + (item.testPassPercent || 0), 0) / Math.max(1, codingResults.length));
  const avgExecutionQuality = Math.round(codingResults.reduce((sum, item) => sum + (item.executionQuality || 0), 0) / Math.max(1, codingResults.length));

  const overallScore = Math.round(avgTestPassPercent * 0.6 + correctnessAvg * 0.25 + avgExecutionQuality * 0.15);

  const passedCount = codingResults.filter((item) => item.passed).length;
  const unansweredCount = normalizedAnswers.filter((item) => !item.codeAnswer?.code || item.codeAnswer.code.includes("[UNANSWERED")).length;

  const strengths = [];
  const improvements = [];

  if (avgTestPassPercent >= 80) strengths.push("High test-case pass percentage across coding questions.");
  if (correctnessAvg >= 75) strengths.push("Strong logical correctness in implemented solutions.");
  if (avgExecutionQuality >= 90) strengths.push("Submissions executed without syntax/runtime failures.");

  if (passedCount < 5) improvements.push("CRITICAL: Most coding answers failed automated test cases.");
  if (correctnessAvg < 60) improvements.push("CRITICAL: Solution logic does not match required problem behavior.");
  if (coverage < 50) improvements.push("Missing algorithmic concepts and edge-case handling in explanations.");
  if (unansweredCount > 0) improvements.push(`⚠️ ${unansweredCount} coding question(s) unanswered.`);

  const questionBreakdown = codingResults.map((result, index) => ({
    questionNumber: index + 1,
    question: questions[index] || `Question ${index + 1}`,
    answer: normalizedAnswers[index]?.codeAnswer?.code || "[No code provided]",
    status: normalizedAnswers[index]?.codeAnswer?.code ? "answered" : "unanswered",
    score: result.questionScore,
    wordCount: (normalizedAnswers[index]?.codeAnswer?.code || "").split(/\s+/).filter(Boolean).length,
    metrics: {
      keywordCoverage: result.coverage,
      structure: result.structure,
      clarity: result.grammar,
      communication: result.communication,
      speechClarity: 0,
      fillerWords: 0,
      wordsPerMinute: 0,
    },
    feedback: result.feedback,
    improvements: result.improvements,
  }));

  return {
    interviewType: type,
    topic: topic || "default",
    durationSec,
    overallScore,
    breakdown: {
      relevance,
      coverage,
      completeness,
      structure,
      grammar,
      communication,
      confidence,
      eyeContact,
    },
    speechMetrics: {
      wordsPerMinuteAvg: 0,
      pauseDurationTotalSec: 0,
      fillerWordsTotal: 0,
      clarityAvg: 0,
    },
    summary:
      overallScore >= 75
        ? "Strong coding interview performance based on test-case passes and logic correctness."
        : "Coding performance needs improvement: automated test validation and execution reliability are mandatory.",
    strengths: strengths.length ? strengths : ["No strong areas identified in this attempt."],
    improvements: improvements.length ? improvements : ["Improve test pass rate and logical correctness."],
    suggestions: [
      "Write solve(...) with exact problem intent before optimization.",
      "Validate edge cases explicitly (empty input, duplicates, boundaries).",
      "Add concise complexity notes to strengthen technical communication.",
    ],
    unansweredCount,
    questionBreakdown,
  };
};

const evaluateTheoryInterview = ({ type, topic, questions, normalizedAnswers, durationSec, proctoringSignals }) => {
  const normalizedTopic = topic || "default";
  const topicKeywords = keywordBank[normalizedTopic] || keywordBank.default;
  const semanticThreshold = 0.2;

  const perQuestion = normalizedAnswers.map((answerObj, index) => {
    const questionText = questions[index] || `Question ${index + 1}`;
    const transcript = (answerObj.transcript || "").trim();
    const isUnanswered = !transcript || transcript.includes("[UNANSWERED");

    const semantic = isUnanswered ? 0 : semanticSimilarity(transcript, questionText);
    const semanticPercent = Math.round(clamp(semantic * 100, 0, 100));

    const questionTokens = tokenize(questionText).slice(0, 8);
    const requiredKeywords = Array.from(new Set([...topicKeywords.slice(0, 6), ...questionTokens]));
    const keywordHits = requiredKeywords.filter((word) => transcript.toLowerCase().includes(word.toLowerCase())).length;
    const keywordCoverage = requiredKeywords.length ? Math.round(clamp((keywordHits / requiredKeywords.length) * 100, 0, 100)) : 0;

    const structureScore = isUnanswered ? 0 : Math.round(scoreStructure([transcript]));
    const grammarScore = isUnanswered ? 0 : Math.round(scoreGrammarClarity([transcript]));
    const { wordsPerMinute = 0, fillerWords = 0, clarityScore = 0, pauseDurationSec = 0 } = answerObj.speechMetrics || {};

    const communicationScore = isUnanswered
      ? 0
      : Math.round(
          clamp(
            clarityScore * 0.6 +
              clamp(100 - fillerWords * 12, 0, 100) * 0.25 +
              clamp(100 - pauseDurationSec * 1.5, 0, 100) * 0.15,
            0,
            100,
          ),
        );

    const isCorrect = !isUnanswered && semantic >= semanticThreshold && keywordCoverage >= 20;
    const questionScore = isCorrect
      ? Math.round(
          semanticPercent * 0.5 +
            keywordCoverage * 0.2 +
            structureScore * 0.12 +
            grammarScore * 0.1 +
            communicationScore * 0.08,
        )
      : Math.round(clamp(semanticPercent * 0.1 + keywordCoverage * 0.05, 0, 15));

    const feedback = [];
    const improvements = [];

    if (isUnanswered) {
      feedback.push("Incorrect: unanswered (timeout or empty response).");
      improvements.push("Provide a complete response within the question timer.");
    } else if (!isCorrect) {
      feedback.push("Incorrect: response is not sufficiently relevant to the asked question.");
      if (semantic < semanticThreshold) improvements.push("Explain the exact concept asked before adding extra details.");
      if (keywordCoverage < 20) improvements.push(`Include core concepts like: ${requiredKeywords.slice(0, 5).join(", ")}.`);
      if (structureScore < 50) improvements.push("Use a clear structure: definition, approach, and practical example.");
    } else {
      if (semanticPercent >= 75) feedback.push("Correct: strong semantic alignment with the question.");
      if (keywordCoverage >= 70) feedback.push("Correct: key concepts are covered adequately.");
      if (structureScore < 60) improvements.push("Improve structure using step-wise explanation.");
      if (communicationScore < 60) improvements.push("Reduce filler words and improve clarity of delivery.");
      if (grammarScore < 60) improvements.push("Improve sentence clarity and grammar quality.");
    }

    const wordCount = transcript.split(/\s+/).filter(Boolean).length;

    return {
      questionNumber: index + 1,
      question: questionText,
      answer: transcript || "[No answer provided]",
      status: isUnanswered ? "unanswered" : "answered",
      score: questionScore,
      wordCount,
      metrics: {
        keywordCoverage,
        structure: structureScore,
        clarity: grammarScore,
        communication: communicationScore,
        speechClarity: Math.round(clarityScore),
        fillerWords,
        wordsPerMinute: Math.round(wordsPerMinute),
      },
      feedback,
      improvements,
      isCorrect,
      semanticPercent,
    };
  });

  const answeredCount = perQuestion.filter((item) => item.status === "answered").length;
  const unansweredCount = perQuestion.length - answeredCount;
  const correctCount = perQuestion.filter((item) => item.isCorrect).length;
  const correctnessRatio = perQuestion.length ? correctCount / perQuestion.length : 0;

  let relevance = Math.round(perQuestion.reduce((sum, item) => sum + item.semanticPercent, 0) / Math.max(1, perQuestion.length));
  let coverage = Math.round(perQuestion.reduce((sum, item) => sum + item.metrics.keywordCoverage, 0) / Math.max(1, perQuestion.length));
  const structure = Math.round(perQuestion.reduce((sum, item) => sum + item.metrics.structure, 0) / Math.max(1, perQuestion.length));
  const grammar = Math.round(perQuestion.reduce((sum, item) => sum + item.metrics.clarity, 0) / Math.max(1, perQuestion.length));
  const communication = Math.round(perQuestion.reduce((sum, item) => sum + item.metrics.communication, 0) / Math.max(1, perQuestion.length));

  if (correctnessRatio < 0.35) {
    relevance = 0;
    coverage = 0;
  }

  const fillerWordsTotal = normalizedAnswers.reduce((sum, item) => sum + (item.speechMetrics.fillerWords || 0), 0);
  const pauseDurationTotal = normalizedAnswers.reduce((sum, item) => sum + (item.speechMetrics.pauseDurationSec || 0), 0);
  const wordsPerMinuteAvg = normalizedAnswers.length
    ? normalizedAnswers.reduce((sum, item) => sum + (item.speechMetrics.wordsPerMinute || 0), 0) / normalizedAnswers.length
    : 0;
  const clarityAvg = normalizedAnswers.length
    ? normalizedAnswers.reduce((sum, item) => sum + (item.speechMetrics.clarityScore || 0), 0) / normalizedAnswers.length
    : 0;

  const confidenceRaw = Math.round(scoreConfidence(proctoringSignals));
  const eyeContactRaw = Math.round(clamp((proctoringSignals?.faceDetectedRatio ?? 0) * 100, 0, 100));
  const confidence = correctnessRatio < 0.35 ? 0 : confidenceRaw;
  const eyeContact = correctnessRatio < 0.35 ? 0 : eyeContactRaw;

  const completeness = Math.round(clamp((answeredCount / Math.max(1, perQuestion.length)) * 100, 0, 100));

  const weightedScore = Math.round(
    relevance * 0.4 +
      coverage * 0.18 +
      structure * 0.12 +
      grammar * 0.1 +
      communication * 0.1 +
      confidence * 0.06 +
      eyeContact * 0.04,
  );

  const overallScore = correctnessRatio < 0.35 ? Math.min(weightedScore, 12) : weightedScore;

  const strengths = [];
  const improvements = [];

  if (relevance >= 75) strengths.push("Strong semantic correctness against asked questions.");
  if (coverage >= 70) strengths.push("Good concept coverage using relevant domain terms.");
  if (structure >= 70) strengths.push("Answers are generally structured and coherent.");
  if (communication >= 70) strengths.push("Clear delivery with controlled speech quality.");

  if (correctnessRatio < 0.35) improvements.push("CRITICAL: Most answers are incorrect or irrelevant to the actual questions.");
  if (coverage < 60) improvements.push("CRITICAL: Concept coverage is low; include core technical terms and mechanisms.");
  if (structure < 60) improvements.push("Improve answer structure using clear step-wise explanation.");
  if (grammar < 60) improvements.push("Improve grammar and sentence clarity for professional communication.");
  if (communication < 60) improvements.push("Reduce pauses/fillers and improve speaking clarity.");
  if (unansweredCount > 0) improvements.push(`⚠️ ${unansweredCount} question(s) were unanswered.`);

  const suggestions = overallScore < 50
    ? [
        "Practice answering with direct semantic focus on what is asked.",
        "Build topic-wise keyword sheets and use them in mock responses.",
        "Use a strict 3-step response: concept, method, example.",
      ]
    : [
        "Continue timed mocks and maintain semantic precision.",
        "Improve weak metrics shown in per-question feedback.",
      ];

  const summary = overallScore >= 75
    ? "Strong interview performance driven by correct, relevant and structured answers."
    : overallScore >= 50
      ? "Moderate performance: some answers are correct, but consistency and depth need improvement."
      : "Low performance: many answers are incorrect/irrelevant or incomplete; focus on correctness first.";

  const questionBreakdown = perQuestion.map(({ isCorrect: _isCorrect, semanticPercent: _semanticPercent, ...item }) => ({
    ...item,
    feedback: item.feedback.length ? item.feedback : ["Incorrect: response quality is below required threshold."],
    improvements: item.improvements,
  }));

  return {
    interviewType: type,
    topic: normalizedTopic,
    durationSec,
    overallScore,
    breakdown: {
      relevance,
      coverage,
      completeness,
      structure,
      grammar,
      communication,
      confidence,
      eyeContact,
    },
    speechMetrics: {
      wordsPerMinuteAvg: Math.round(wordsPerMinuteAvg),
      pauseDurationTotalSec: Math.round(pauseDurationTotal),
      fillerWordsTotal,
      clarityAvg: Math.round(clarityAvg),
    },
    summary,
    strengths: strengths.length ? strengths : ["No strong areas identified in this attempt."],
    improvements: improvements.length ? improvements : ["Improve semantic correctness and keyword coverage."],
    suggestions,
    unansweredCount,
    questionBreakdown,
  };
};

export const evaluateInterview = ({ type, topic, questions = [], answers, durationSec, proctoringSignals }) => {
  const normalizedAnswers = normalizeAnswers(answers || []);

  if (type === "coding") {
    return evaluateCodingInterview({
      type,
      topic,
      questions,
      normalizedAnswers,
      durationSec,
      proctoringSignals,
    });
  }

  return evaluateTheoryInterview({
    type,
    topic,
    questions,
    normalizedAnswers,
    durationSec,
    proctoringSignals,
  });
};
