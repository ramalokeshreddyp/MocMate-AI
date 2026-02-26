import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPassword.test(password)) {
      toast.error("Password must be 8+ chars with uppercase, lowercase, and number");
      return;
    }

    if (!resumeFile || !resumeFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Resume PDF upload is mandatory");
      return;
    }

    setSubmitting(true);
    try {
      const bytes = await resumeFile.arrayBuffer();
      const uint8Array = new Uint8Array(bytes);
      let binary = "";
      uint8Array.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      const resumeBase64 = btoa(binary);

      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: role || "student",
        resumeBase64,
        resumeFileName: resumeFile.name,
      });
      toast.success("Account created successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="relative max-w-md">
          <Brain className="h-16 w-16 text-primary mb-8" />
          <h1 className="text-4xl font-bold mb-4">Join <span className="text-gradient">MocMate AI</span></h1>
          <p className="text-muted-foreground text-lg">Start your journey to interview mastery. Practice with AI, get real-time feedback, and improve every session.</p>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">HireSense AI</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">Create account</h2>
          <p className="text-muted-foreground mb-8">Get started with your interview practice journey</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Resume (PDF) <span className="text-destructive">*</span></label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                required
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary/15 file:text-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Preferred Role <span className="text-muted-foreground">(optional)</span></label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                <option value="">Select a role</option>
                <option value="frontend">Frontend Developer</option>
                <option value="backend">Backend Developer</option>
                <option value="fullstack">Full Stack Developer</option>
                <option value="data">Data Scientist</option>
                <option value="devops">DevOps Engineer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button disabled={submitting} type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              Create Account <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
