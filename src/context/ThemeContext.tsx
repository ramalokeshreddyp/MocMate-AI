/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = "interview_ai_theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const cached = localStorage.getItem(THEME_KEY);
    return cached === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const loadFromServer = async () => {
      if (!token) {
        return;
      }
      try {
        const response = await api.getPreferences(token);
        const serverTheme = response.preferences?.theme === "dark" ? "dark" : "light";
        setThemeState(serverTheme);
      } catch {
        void 0;
      }
    };

    void loadFromServer();
  }, [token]);

  const setTheme = useCallback(async (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    if (!token) return;
    try {
      await api.updatePreferences(token, { theme: nextTheme });
    } catch {
      void 0;
    }
  }, [token]);

  const toggleTheme = useCallback(async () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    await setTheme(nextTheme);
  }, [setTheme, theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used inside ThemeProvider");
  }
  return context;
};
