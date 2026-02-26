import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Code, Mic, Users, Sparkles, ChevronRight, Download } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5 } }),
};

const iconMap: Record<string, LucideIcon> = { skill: Mic, coding: Code, hr: Users, comprehensive: Sparkles };

const formatType = (value: string) => {
  if (value === "hr") return "HR";
  if (value === "skill") return "Skill-Based";
  if (value === "coding") return "Coding";
  if (value === "comprehensive") return "Comprehensive";
  return value;
};

const InterviewHistory = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await api.getHistory(token);
        setHistory(response.history);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [token]);

  const downloadReport = async (reportId: string) => {
    if (!token) return;

    try {
      const response = await api.getReport(token, reportId);
      const report = response.report;
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("AI Interview Feedback Report", 14, 18);
      doc.setFontSize(11);
      doc.text(`Report ID: ${report.id}`, 14, 28);
      doc.text(`Interview Type: ${report.interviewType}`, 14, 35);
      doc.text(`Topic: ${report.topic}`, 14, 42);
      doc.text(`Overall Score: ${report.overallScore}%`, 14, 49);
      doc.text(`Duration: ${Math.round(report.durationSec / 60)} min`, 14, 56);

      doc.text("Breakdown", 14, 68);
      doc.text(`Relevance: ${report.breakdown.relevance}%`, 14, 75);
      doc.text(`Coverage: ${report.breakdown.coverage}%`, 14, 82);
      doc.text(`Completeness: ${report.breakdown.completeness}%`, 14, 89);
      doc.text(`Structure: ${report.breakdown.structure}%`, 14, 96);
      doc.text(`Grammar: ${report.breakdown.grammar}%`, 14, 103);
      doc.text(`Communication: ${report.breakdown.communication}%`, 14, 110);
      doc.text(`Confidence: ${report.breakdown.confidence}%`, 14, 117);

      doc.text("Feedback Summary", 14, 130);
      const summaryLines = doc.splitTextToSize(report.summary, 180);
      doc.text(summaryLines, 14, 137);

      doc.text("Strengths", 14, 160);
      report.strengths.forEach((item: string, index: number) => doc.text(`- ${item}`, 14, 167 + index * 7));

      doc.text("Areas for Improvement", 14, 195);
      report.improvements.forEach((item: string, index: number) => doc.text(`- ${item}`, 14, 202 + index * 7));

      doc.save(`interview-report-${report.id}.pdf`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download report");
    }
  };

  const trendData = history
    .slice()
    .reverse()
    .map((item, index) => ({ name: `#${index + 1}`, score: item.score }));

  const scoreDelta = history.length > 1 ? history[0].score - history[history.length - 1].score : 0;
  const averageScore = history.length ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length) : 0;

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeUp} custom={0}>
          <h1 className="text-3xl font-bold">Interview History</h1>
          <p className="text-muted-foreground mt-1">Review your past interviews and track progress</p>
        </motion.div>

        {!loading && history.length > 0 && (
          <motion.div variants={fadeUp} custom={1} className="p-6 rounded-2xl bg-card border border-border">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-secondary/40">
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{averageScore}%</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/40">
                <p className="text-xs text-muted-foreground">Latest vs Oldest</p>
                <p className={`text-2xl font-bold ${scoreDelta >= 0 ? "text-success" : "text-warning"}`}>{scoreDelta >= 0 ? "+" : ""}{scoreDelta}%</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/40">
                <p className="text-xs text-muted-foreground">Attempts</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "10px",
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp} custom={2} className="rounded-2xl bg-card border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading interview reports...</div>
          ) : !history.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No completed interviews yet.</div>
          ) : (
            history.map((item, i) => {
              const Icon = iconMap[item.type] || Mic;
              return (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  custom={i + 2}
                  className="flex items-center justify-between p-5 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{formatType(item.type)}</p>
                      <p className="text-sm text-muted-foreground">{item.topic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Clock className="h-3 w-3" />{Math.round(item.durationSec / 60)} min</p>
                    </div>
                    <div className={`text-lg font-bold min-w-[48px] text-right ${item.score >= 80 ? "text-success" : item.score >= 60 ? "text-warning" : "text-destructive"}`}>
                      {item.score}%
                    </div>
                    <button onClick={() => void downloadReport(item.id)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Download report">
                      <Download className="h-4 w-4" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default InterviewHistory;
