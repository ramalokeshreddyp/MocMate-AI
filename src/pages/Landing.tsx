import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Target, Shield, BarChart3, ArrowRight, Sparkles, Code, Users, FileText, Brain } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import MocMateLogo from "@/components/MocMateLogo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const features = [
  { icon: Brain, title: "AI-Powered Evaluation", desc: "Get intelligent feedback on relevance, structure, and depth" },
  { icon: Shield, title: "Smart Proctoring", desc: "Video & audio monitoring ensures authentic practice" },
  { icon: BarChart3, title: "Performance Analytics", desc: "Track progress with detailed score breakdowns" },
  { icon: Target, title: "Targeted Practice", desc: "Domain-specific questions across multiple categories" },
];

const categories = [
  { icon: Code, title: "Skill-Based", desc: "React, Python, Java & more", color: "from-primary to-primary/60" },
  { icon: FileText, title: "Coding Interview", desc: "DSA, algorithms, problem solving", color: "from-accent to-accent/60" },
  { icon: Users, title: "HR Interview", desc: "Resume-driven behavioral Q&A", color: "from-success to-success/60" },
  { icon: Sparkles, title: "Comprehensive", desc: "Full 3-round simulation", color: "from-warning to-warning/60" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <MocMateLogo height={34} />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link to="/register" className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 opacity-20">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

        <div className="relative container mx-auto text-center max-w-4xl">
          <motion.div initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Interview Practice
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Ace Your Next
              <span className="text-gradient block">Interview</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Practice with AI-generated questions, get real-time proctoring, and receive structured feedback to improve your interview performance.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/register" className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Start Practicing
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="px-8 py-3.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors">
                I have an account
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold">
              Why <span className="text-gradient">MocMate AI</span>?
            </motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 glow-border"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold">
              Interview <span className="text-gradient">Categories</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mt-3">
              Choose your practice mode and start improving
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((c, i) => (
              <motion.div
                key={c.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group relative p-6 rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all duration-300 cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <c.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="p-12 rounded-3xl bg-card border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold mb-4 relative">
              Ready to ace your interview?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 relative">
              Join thousands of candidates who improved their interview performance with AI-powered practice.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="relative">
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <MocMateLogo height={22} />
          <span>© 2026 MocMate AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
