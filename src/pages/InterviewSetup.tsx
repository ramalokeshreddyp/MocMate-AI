import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, Code, Users, Sparkles, ArrowRight, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { InterviewType } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const configs: Record<string, { title: string; icon: LucideIcon; description: string; options: { label: string; value: string }[]; optionLabel: string }> = {
  skill: {
    title: "Skill-Based Interview",
    icon: Mic,
    description: "Test your domain knowledge with AI-generated questions tailored to your chosen skill.",
    optionLabel: "Select Primary Skill",
    options: [
      { label: "React.js", value: "react" },
      { label: "Python", value: "python" },
      { label: "Java", value: "java" },
      { label: "Machine Learning", value: "ml" },
      { label: "SQL & Databases", value: "sql" },
      { label: "JavaScript", value: "javascript" },
      { label: "Node.js", value: "nodejs" },
      { label: "System Design", value: "system-design" },
    ],
  },
  coding: {
    title: "Coding Interview",
    icon: Code,
    description: "Solve algorithmic problems through spoken reasoning. Audio transcript is evaluated for logic, edge cases, and complexity explanation.",
    optionLabel: "Select Topic",
    options: [
      { label: "Arrays & Strings", value: "arrays" },
      { label: "Linked Lists", value: "linked-lists" },
      { label: "Trees & Graphs", value: "trees" },
      { label: "Dynamic Programming", value: "dp" },
      { label: "Sorting & Searching", value: "sorting" },
      { label: "Recursion", value: "recursion" },
    ],
  },
  hr: {
    title: "HR Interview",
    icon: Users,
    description: "Behavioral and resume-driven questions with spoken responses only. Resume insights personalize the question set.",
    optionLabel: "Interview Focus",
    options: [
      { label: "Behavioral Questions", value: "behavioral" },
      { label: "Situational Questions", value: "situational" },
      { label: "Resume Walkthrough", value: "resume" },
      { label: "Culture Fit", value: "culture" },
    ],
  },
  comprehensive: {
    title: "Comprehensive Interview",
    icon: Sparkles,
    description: "A full 3-round spoken simulation combining Skill, Coding, and HR rounds.",
    optionLabel: "Difficulty Level",
    options: [
      { label: "Beginner", value: "beginner" },
      { label: "Intermediate", value: "intermediate" },
      { label: "Advanced", value: "advanced" },
      { label: "Expert", value: "expert" },
    ],
  },
};

const InterviewSetup = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [selected, setSelected] = useState("");
  const [codingLanguage, setCodingLanguage] = useState("javascript");
  const [resumeText, setResumeText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const config = configs[type || "skill"];

  if (!config) return null;

  const Icon = config.icon;

  const handleStart = async () => {
    if (!selected || !token || !type) {
      toast.error("Please select an option before starting");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.startInterview(token, {
        type: type as InterviewType,
        topic: selected,
        language: type === "coding" ? codingLanguage : undefined,
        resumeText: type === "hr" ? resumeText : undefined,
      });

      navigate(`/interview/${type}/session?interviewId=${response.interviewId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start interview");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeUpload = async (file: File | null) => {
    if (!file) return;

    const isTextFile = ["text/plain", "text/markdown", "application/json"].includes(file.type) || file.name.endsWith(".txt");
    if (!isTextFile) {
      toast.error("Please upload a text-based resume file (.txt/.md)");
      return;
    }

    try {
      const content = await file.text();
      setResumeText(content.slice(0, 4000));
      toast.success("Resume content loaded for HR question generation");
    } catch {
      toast.error("Unable to read the uploaded resume file");
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="max-w-2xl mx-auto space-y-8">
        <motion.div variants={fadeUp} custom={0} className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">{config.description}</p>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-4">{config.optionLabel}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {config.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 hover-lift ${
                  selected === opt.value
                    ? "border-primary bg-primary/5 text-foreground pulse-glow"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{opt.label}</span>
                  <ChevronRight className={`h-4 w-4 transition-colors ${selected === opt.value ? "text-primary" : "text-muted-foreground/50"}`} />
                </div>
              </button>
            ))}
          </div>

          {type === "hr" && (
            <div className="mt-4">
              <label className="text-sm text-muted-foreground block mb-2">Resume Highlights (optional)</label>
              <input
                type="file"
                accept=".txt,.md"
                onChange={(event) => void handleResumeUpload(event.target.files?.[0] || null)}
                className="w-full mb-3 text-sm text-muted-foreground file:mr-4 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-secondary file:text-foreground"
              />
              <textarea
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                rows={4}
                placeholder="Paste key resume points to generate better HR questions"
                className="w-full p-3 rounded-xl bg-secondary/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          {type === "coding" && (
            <div className="mt-4">
              <label className="text-sm text-muted-foreground block mb-2">Select Language</label>
              <select
                value={codingLanguage}
                onChange={(event) => setCodingLanguage(event.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} custom={2} className="text-center">
          <button
            onClick={handleStart}
            disabled={!selected || submitting}
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              selected && !submitting ? "pulse-glow" : ""
            }`}
          >
            Start Interview <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default InterviewSetup;
