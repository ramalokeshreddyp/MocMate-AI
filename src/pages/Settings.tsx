import { motion } from "framer-motion";
import { Moon, Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useThemeMode } from "@/context/ThemeContext";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const SettingToggle = ({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) => (
  <div className="flex items-center justify-between py-4">
    <div>
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
      <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
    </label>
  </div>
);

const SettingsPage = () => {
  const { theme, setTheme } = useThemeMode();

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="max-w-2xl space-y-8">
        <motion.div variants={fadeUp} custom={0}>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences</p>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Theme</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => void setTheme("light")}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-foreground"
              }`}
            >
              Light Mode
            </button>
            <button
              onClick={() => void setTheme("dark")}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-foreground"
              }`}
            >
              Dark Mode
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={2} className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Privacy & Security</h3>
          </div>
          <div className="divide-y divide-border">
            <SettingToggle label="Proctoring Consent" desc="Allow video & audio monitoring during interviews" defaultOn />
            <SettingToggle label="Save Recordings" desc="Keep video recordings of your interviews" />
            <SettingToggle label="Share Analytics" desc="Share anonymous performance data" />
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SettingsPage;
