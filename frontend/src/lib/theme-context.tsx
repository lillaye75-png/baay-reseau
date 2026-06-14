"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "light" | "dark" | "solarized";

interface ThemeContextType {
  theme: Theme;
  dark: boolean;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && ["light", "dark", "solarized"].includes(saved)) {
      applyTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.remove("dark", "solarized");
    if (t === "dark") document.documentElement.classList.add("dark");
    if (t === "solarized") document.documentElement.classList.add("dark", "solarized");
    localStorage.setItem("theme", t);
  };

  const toggle = () => {
    const order: Theme[] = ["light", "dark", "solarized"];
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length];
    applyTheme(next);
  };

  const setTheme = (t: Theme) => applyTheme(t);

  return (
    <ThemeContext.Provider value={{ theme, dark: theme === "dark" || theme === "solarized", toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
