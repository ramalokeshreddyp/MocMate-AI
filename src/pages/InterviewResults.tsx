import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Award, Target, BookOpen, MessageSquare, TrendingUp, ArrowRight, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { InterviewReport } from "@/lib/types";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const scoreRemark = (label: string, value: number) => {
  if (label === "Coverage" && value < 75) return "Missing key concepts; add domain terms";
  if (label === "Confidence" && value < 75) return "Minor pauses detected; improve stability";
  if (label === "Eye Contact" && value < 75) return "Face visibility is low; maintain direct visual focus";
  if (label === "Communication" && value < 75) return "Reduce filler words and tighten delivery";
  if (value >= 85) return "Strong alignment and performance";
  if (value >= 70) return "Good baseline with room to improve";
  return "Needs focused improvement";
};

const InterviewResults = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const reportId = searchParams.get("reportId") || "";

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  useEffect(() => {
    if (!token || !reportId) {
      navigate("/history");
      return;
    }

    const loadReport = async () => {
      setLoading(true);
      try {
        const response = await api.getReport(token, reportId);
        setReport(response.report);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load report");
        navigate("/history");
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [navigate, reportId, token]);

  const scores = useMemo(() => {
    if (!report) return [];
    return [
      { label: "Relevance", value: report.breakdown.relevance, icon: Target },
      { label: "Coverage", value: report.breakdown.coverage, icon: BookOpen },
      { label: "Structure", value: report.breakdown.structure, icon: MessageSquare },
      { label: "Grammar", value: report.breakdown.grammar, icon: CheckCircle },
      { label: "Communication", value: report.breakdown.communication, icon: TrendingUp },
      { label: "Confidence", value: report.breakdown.confidence, icon: Award },
      ...(typeof report.breakdown.eyeContact === "number"
        ? [{ label: "Eye Contact", value: report.breakdown.eyeContact, icon: Target }]
        : []),
    ];
  }, [report]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center text-muted-foreground">Loading interview results...</div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center text-muted-foreground">Report not available.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="text-center relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="h-20 w-20 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center pulse-glow"
          >
            <Award className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold">Interview Complete!</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s your detailed feedback report from MocMate AI</p>
        </motion.div>

        {/* Overall Score */}
        <motion.div 
          variants={fadeUp} 
          custom={1} 
          className={`p-8 rounded-2xl bg-card border text-center ${
            report.overallScore >= 80 ? "border-success pulse-glow" : "border-border"
          }`}
        >
          <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
          <motion.p 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.5 }}
            className={`text-6xl font-extrabold ${report.overallScore >= 80 ? "text-success" : report.overallScore >= 60 ? "text-warning" : "text-destructive"}`}
          >
            {report.overallScore}%
          </motion.p>
          <p className="text-muted-foreground mt-2 capitalize">{report.interviewType} Interview • {Math.round(report.durationSec / 60)} min</p>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={fadeUp} custom={2} className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Category Breakdown</h3>
          <div className="space-y-4">
            {scores.map((score) => (
              <div key={score.label} className="flex items-center gap-4">
                <score.icon className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{score.label}</span>
                    <span className={score.value >= 80 ? "text-success" : score.value >= 60 ? "text-warning" : "text-destructive"}>{score.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score.value}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${score.value >= 80 ? "bg-success" : score.value >= 60 ? "bg-warning" : "bg-destructive"}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={3} className="p-6 rounded-2xl bg-card border border-border overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Detailed Parameter Report</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2">Parameter</th>
                <th className="text-left py-2">Score</th>
                <th className="text-left py-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr key={score.label} className="border-b border-border/60">
                  <td className="py-2 font-medium text-foreground">{score.label}</td>
                  <td className="py-2 text-foreground">{score.value}%</td>
                  <td className="py-2 text-muted-foreground">{scoreRemark(score.label, score.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Per-Question Feedback */}
        {report.questionBreakdown && report.questionBreakdown.length > 0 && (
          <motion.div variants={fadeUp} custom={3.5} className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-semibold mb-4">Per-Question Breakdown</h3>
            <div className="space-y-3">
              {report.questionBreakdown.map((item, index) => {
                const isExpanded = expandedQuestions.has(index);
                const isUnanswered = item.status === "unanswered";
                
                return (
                  <div key={index} className={`rounded-xl border ${isUnanswered ? "border-destructive/30 bg-destructive/5" : "border-border bg-secondary/20"} overflow-hidden`}>
                    <button
                      onClick={() => toggleQuestion(index)}
                      className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-foreground">Q{item.questionNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            isUnanswered ? "bg-destructive/20 text-destructive" : 
                            item.score >= 70 ? "bg-success/20 text-success" : 
                            item.score >= 50 ? "bg-warning/20 text-warning" : 
                            "bg-destructive/20 text-destructive"
                          }`}>
                            {item.score}%
                          </span>
                          {isUnanswered && <span className="text-xs text-destructive font-medium">⚠️ Unanswered</span>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.question}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>
                    
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border px-4 pb-4"
                      >
                        <div className="space-y-3 pt-4">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Question</p>
                            <p className="text-sm text-foreground">{item.question}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Your Answer ({item.wordCount} words)</p>
                            <p className={`text-sm ${isUnanswered ? "text-destructive italic" : "text-foreground"}`}>
                              {item.answer}
                            </p>
                          </div>
                          
                          {!isUnanswered && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                              <div className="p-2 rounded bg-secondary/50">
                                <p className="text-xs text-muted-foreground">Keywords</p>
                                <p className="text-sm font-semibold text-foreground">{item.metrics.keywordCoverage}%</p>
                              </div>
                              <div className="p-2 rounded bg-secondary/50">
                                <p className="text-xs text-muted-foreground">Structure</p>
                                <p className="text-sm font-semibold text-foreground">{item.metrics.structure}%</p>
                              </div>
                              <div className="p-2 rounded bg-secondary/50">
                                <p className="text-xs text-muted-foreground">Clarity</p>
                                <p className="text-sm font-semibold text-foreground">{item.metrics.clarity}%</p>
                              </div>
                              <div className="p-2 rounded bg-secondary/50">
                                <p className="text-xs text-muted-foreground">Speech</p>
                                <p className="text-sm font-semibold text-foreground">{item.metrics.speechClarity}%</p>
                              </div>
                              <div className="p-2 rounded bg-secondary/50">
                                <p className="text-xs text-muted-foreground">WPM</p>
                                <p className="text-sm font-semibold text-foreground">{item.metrics.wordsPerMinute}</p>
                              </div>
                              <div className="p-2 rounded bg-secondary/50">
                                <p className="text-xs text-muted-foreground">Fillers</p>
                                <p className="text-sm font-semibold text-foreground">{item.metrics.fillerWords}</p>
                              </div>
                            </div>
                          )}
                          
                          {item.feedback.length > 0 && (
                            <div className="pt-2">
                              <p className="text-xs font-semibold text-foreground mb-2">Evaluation Feedback</p>
                              <ul className="space-y-1">
                                {item.feedback.map((fb, i) => (
                                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                    <span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                    {fb}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {item.improvements.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-warning mb-2">⚠ Areas to Improve</p>
                              <ul className="space-y-1">
                                {item.improvements.map((imp, i) => (
                                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                    <span className="h-1 w-1 rounded-full bg-warning mt-1.5 shrink-0" />
                                    {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp} custom={4} className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-2">Feedback Summary</h3>
          <p className="text-sm text-muted-foreground leading-6">{report.summary}</p>
        </motion.div>

        {/* Feedback Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} custom={5} className="p-5 rounded-2xl bg-success/5 border border-success/20">
            <h4 className="font-semibold text-success mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Strengths</h4>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={fadeUp} custom={6} className="p-5 rounded-2xl bg-warning/5 border border-warning/20">
            <h4 className="font-semibold text-warning mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Improve</h4>
            <ul className="space-y-2">
              {report.improvements.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={fadeUp} custom={7} className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
            <h4 className="font-semibold text-primary mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Suggestions</h4>
            <ul className="space-y-2">
              {report.suggestions.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div variants={fadeUp} custom={8} className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate("/dashboard")} className="px-8 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors">
            Back to Dashboard
          </button>
          <button onClick={() => navigate(`/interview/${type || report.interviewType}`)} className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">
            Practice Again <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default InterviewResults;
