import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Clock, Award, ArrowUpRight, ArrowDownRight, Code, Mic, Users, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { DashboardSummary } from "@/lib/types";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const interviewTypes = [
  { title: "Skill-Based", desc: "Test your domain knowledge", icon: Mic, path: "/interview/skill", color: "text-primary" },
  { title: "Coding", desc: "Solve algorithmic problems", icon: Code, path: "/interview/coding", color: "text-accent" },
  { title: "HR Interview", desc: "Behavioral & resume-based", icon: Users, path: "/interview/hr", color: "text-success" },
  { title: "Comprehensive", desc: "Full 3-round simulation", icon: Sparkles, path: "/interview/comprehensive", color: "text-warning" },
];

const Dashboard = () => {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; type: string; topic: string; score: number; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoading(true);
      try {
        const [dashboardData, historyResponse] = await Promise.all([api.getDashboardSummary(token), api.getHistory(token)]);
        setSummary(dashboardData);
        setHistory(historyResponse.history.slice(0, 3));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const stats = useMemo(
    () => [
      {
        label: "Total Interviews",
        value: `${summary?.totalInterviews ?? 0}`,
        change: `${summary?.completedInterviews ?? 0} completed`,
        up: true,
        icon: BarChart3,
      },
      {
        label: "Average Score",
        value: `${summary?.averageScore ?? 0}%`,
        change: "Across all interviews",
        up: true,
        icon: TrendingUp,
      },
      {
        label: "Strong / Weak",
        value: summary?.strongArea ? summary.strongArea : "--",
        change: summary?.weakArea ? `Weak: ${summary.weakArea}` : "No data yet",
        up: true,
        icon: Clock,
      },
      {
        label: "Best / Avg Duration",
        value: `${summary?.bestScore ?? 0}%`,
        change: summary?.avgDurationSec ? `${Math.round(summary.avgDurationSec / 60)} min avg` : "No attempts yet",
        up: true,
        icon: Award,
      },
    ],
    [summary],
  );

  const chartData = summary?.performanceTrend?.length
    ? summary.performanceTrend
    : [
        { name: "Round 1", score: 0 },
        { name: "Round 2", score: 0 },
      ];

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8">
        {/* Header */}
        <motion.div variants={fadeUp} custom={0}>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! MocMate AI interview intelligence summary.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i + 1} className="p-5 rounded-2xl bg-card border border-border glow-border hover-lift cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="h-5 w-5 text-primary" />
                <span className={`text-xs flex items-center gap-1 ${stat.up ? "text-success" : "text-destructive"}`}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Chart + Quick Start */}
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div variants={fadeUp} custom={5} className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(190, 95%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(190, 95%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(222, 44%, 8%)", border: "1px solid hsl(222, 30%, 16%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(190, 95%, 50%)" fill="url(#scoreGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
            <div className="space-y-3">
              {interviewTypes.map((t) => (
                <Link key={t.path} to={t.path} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all hover-lift group">
                  <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${t.color} group-hover:bg-primary/10`}>
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Interviews */}
        <motion.div variants={fadeUp} custom={7} className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Interviews</h3>
            <Link to="/history" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {!history.length ? (
            <p className="text-sm text-muted-foreground">No interview reports yet. Start one from Quick Start.</p>
          ) : (
            <div className="space-y-3">
              {history.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <div>
                    <p className="font-medium text-foreground capitalize">{interview.type}</p>
                    <p className="text-sm text-muted-foreground">{interview.topic} • {new Date(interview.createdAt).toLocaleString()}</p>
                  </div>
                  <div className={`text-lg font-bold ${interview.score >= 80 ? "text-success" : interview.score >= 60 ? "text-warning" : "text-destructive"}`}>
                    {interview.score}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div variants={fadeUp} custom={8} className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confidence Trend</h3>
              <span className="text-xs text-muted-foreground">Most improved: {summary?.mostImprovedCategory || "n/a"}</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary?.confidenceTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(222, 44%, 8%)", border: "1px solid hsl(222, 30%, 16%)", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(150, 80%, 45%)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={9} className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-semibold mb-4">Filler Word Frequency</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary?.fillerWordFrequency || []}>
                  <defs>
                    <linearGradient id="fillerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(222, 44%, 8%)", border: "1px solid hsl(222, 30%, 16%)", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(38, 92%, 55%)" fill="url(#fillerGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
