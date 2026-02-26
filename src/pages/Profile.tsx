import { motion } from "framer-motion";
import { User, Mail, Award, BarChart3, Edit, Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const Profile = () => {
  const { user } = useAuth();
  const skills = (user?.profile?.extractedSkills || []).slice(0, 6).map((name, index) => ({
    name,
    level: Math.max(55, 90 - index * 6),
  }));

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8">
        <motion.div variants={fadeUp} custom={0}>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and view skill analytics</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div variants={fadeUp} custom={1} className="p-6 rounded-2xl bg-card border border-border text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">{user?.name || "Student"}</h2>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Mail className="h-3.5 w-3.5" /> {user?.email || "--"}
            </p>
            <p className="text-sm text-primary mt-2 capitalize">{user?.role || "student"}</p>
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
              <div>
                <p className="text-2xl font-bold">{user?.profile?.recommendedCategories?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Recommended Tracks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning capitalize">{user?.profile?.weakAreaEstimation || "n/a"}</p>
                <p className="text-xs text-muted-foreground">Estimated Weak Area</p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <button className="w-full py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2">
                <Edit className="h-4 w-4" /> Edit Profile
              </button>
              <button className="w-full py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" /> Upload Resume
              </button>
            </div>
          </motion.div>

          {/* Skill Analytics */}
          <motion.div variants={fadeUp} custom={2} className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-semibold mb-6">Skill Analytics</h3>
            {!skills.length ? (
              <p className="text-sm text-muted-foreground">Resume profile not available yet.</p>
            ) : (
            <div className="space-y-5">
              {skills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground">{skill.name}</span>
                    <span className={skill.level >= 80 ? "text-success" : skill.level >= 60 ? "text-warning" : "text-destructive"}>{skill.level}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className={`h-full rounded-full ${skill.level >= 80 ? "bg-success" : skill.level >= 60 ? "bg-warning" : "bg-destructive"}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Strengths/Weaknesses */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-success" />
                  <span className="text-sm font-semibold text-success">Strongest Area</span>
                </div>
                <p className="text-foreground font-medium">{user?.profile?.extractedSkills?.[0] || "Not enough data"}</p>
                <p className="text-xs text-muted-foreground">Top resume-aligned technical area</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">Needs Improvement</span>
                </div>
                <p className="text-foreground font-medium capitalize">{user?.profile?.weakAreaEstimation || "n/a"}</p>
                <p className="text-xs text-muted-foreground">Needs improvement based on resume profile</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Profile;
