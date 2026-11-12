import { createContext, useCallback, useContext, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "hl_admin_theme";
const VALID_MODES = new Set(["light", "dark", "system"]);

const ThemeContext = createContext(null);

function resolveTheme(mode) {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

function applyThemeToDom(mode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute("content", mode === "system" ? "light dark" : resolved);
  }
  return resolved;
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return VALID_MODES.has(saved) ? saved : "dark";
    } catch {
      return "dark";
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => applyThemeToDom(themeMode));

  useEffect(() => {
    setResolvedTheme(applyThemeToDom(themeMode));
  }, [themeMode]);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (themeMode === "system") {
        setResolvedTheme(applyThemeToDom("system"));
      }
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, [themeMode]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = VALID_MODES.has(event.newValue) ? event.newValue : "dark";
      setThemeModeState(next);
      setResolvedTheme(applyThemeToDom(next));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = useCallback((nextMode) => {
    const valid = VALID_MODES.has(nextMode) ? nextMode : "dark";
    setThemeModeState(valid);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, valid);
    } catch {
      // ignore private browsing quota errors
    }
    setResolvedTheme(applyThemeToDom(valid));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themeMode,
        isDark: resolvedTheme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
