import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, useThemeMode } from "@/context/ThemeContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ token: null }),
}));

const ThemeProbe = () => {
  const { theme, toggleTheme } = useThemeMode();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={() => void toggleTheme()}>toggle</button>
    </div>
  );
};

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to light mode", () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-value").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggles to dark mode and persists locally", async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByText("toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("theme-value").textContent).toBe("dark");
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("interview_ai_theme")).toBe("dark");
  });
});
