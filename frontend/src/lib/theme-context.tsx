"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "light" | "dark" | "solarized";

interface ThemeContextType {
  theme: Theme;
  dark: boolean;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_PRESETS: Record<string, { light: string; dark: string }> = {
  orange: { light: "#ea580c", dark: "#f97316" },
  blue: { light: "#2563eb", dark: "#3b82f6" },
  green: { light: "#16a34a", dark: "#22c55e" },
  purple: { light: "#9333ea", dark: "#a855f7" },
  red: { light: "#dc2626", dark: "#ef4444" },
  teal: { light: "#0d9488", dark: "#14b8a6" },
  pink: { light: "#db2777", dark: "#ec4899" },
};

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyPrimaryColor(color: string) {
  const hsl = hexToHSL(color);
  const [h, s, l] = hsl.split(" ");
  document.documentElement.style.setProperty("--primary-50", `${h} ${s} ${Math.min(97, parseInt(l) + 45)}%`);
  document.documentElement.style.setProperty("--primary-100", `${h} ${s} ${Math.min(95, parseInt(l) + 35)}%`);
  document.documentElement.style.setProperty("--primary-200", `${h} ${s} ${Math.min(90, parseInt(l) + 25)}%`);
  document.documentElement.style.setProperty("--primary-500", `${h} ${s} ${l}`);
  document.documentElement.style.setProperty("--primary-600", `${h} ${s} ${Math.max(20, parseInt(l) - 8)}%`);
  document.documentElement.style.setProperty("--primary-700", `${h} ${s} ${Math.max(15, parseInt(l) - 15)}%`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [primaryColor, setPrimaryColorState] = useState("#ea580c");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && ["light", "dark", "solarized"].includes(saved)) {
      applyTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme("dark");
    }
    const savedColor = localStorage.getItem("primary_color");
    if (savedColor) {
      setPrimaryColorState(savedColor);
      applyPrimaryColor(savedColor);
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

  const setPrimaryColor = (c: string) => {
    setPrimaryColorState(c);
    applyPrimaryColor(c);
    localStorage.setItem("primary_color", c);
  };

  return (
    <ThemeContext.Provider value={{ theme, dark: theme === "dark" || theme === "solarized", toggle, setTheme, primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export { COLOR_PRESETS };
