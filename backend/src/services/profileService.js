import pdfParse from "pdf-parse";

const knownSkills = [
  "react",
  "typescript",
  "javascript",
  "node",
  "express",
  "python",
  "java",
  "sql",
  "postgresql",
  "machine learning",
  "aws",
  "docker",
  "git",
  "data structures",
  "algorithms",
  "system design",
];

const safeWords = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

export const parseResumePdf = async (resumeBase64) => {
  try {
    const buffer = Buffer.from(resumeBase64, "base64");
    const rawText = buffer.toString("utf8");

    if (!rawText.includes("obj") || !rawText.includes("endobj")) {
      return rawText.trim();
    }

    const result = await pdfParse(buffer);
    return (result.text || "").trim();
  } catch {
    const fallback = Buffer.from(resumeBase64, "base64").toString("utf8");
    return fallback.trim();
  }
};

export const extractProfileFromResume = (resumeText) => {
  const normalized = (resumeText || "").toLowerCase();
  const words = safeWords(resumeText);
  const wordCounts = new Map();
  words.forEach((word) => wordCounts.set(word, (wordCounts.get(word) || 0) + 1));

  const extractedSkills = knownSkills.filter((skill) => normalized.includes(skill));

  const projectMatches = (resumeText || "")
    .split(/\n|\.|•/)
    .map((line) => line.trim())
    .filter((line) => /project|built|developed|implemented|designed/i.test(line) && line.length > 20)
    .slice(0, 5);

  const educationMatches = (resumeText || "")
    .split(/\n|\.|•/)
    .map((line) => line.trim())
    .filter((line) => /b\.tech|btech|bachelor|master|degree|university|college|cgpa/i.test(line) && line.length > 10)
    .slice(0, 3);

  const topKeywords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);

  const recommendedCategories = [
    extractedSkills.some((skill) => ["react", "typescript", "javascript", "python", "java", "sql"].includes(skill)) ? "skill" : null,
    extractedSkills.some((skill) => ["data structures", "algorithms", "python", "java"].includes(skill)) ? "coding" : null,
    "hr",
  ].filter(Boolean);

  const weakAreaEstimation = extractedSkills.length >= 6 ? "communication" : "technical_depth";

  return {
    extractedSkills,
    projects: projectMatches,
    education: educationMatches,
    keywords: topKeywords,
    recommendedCategories,
    weakAreaEstimation,
  };
};
