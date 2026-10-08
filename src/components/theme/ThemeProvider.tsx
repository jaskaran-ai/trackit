"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

type ThemeContextValue = {
  /** What the user picked. */
  theme: ThemePreference;
  /** What is actually on the <html> element. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Mirrors the inline script in app/layout.tsx. */
const STORAGE_KEY = "trackit-theme";
const PREFERENCES_URL = "/api/user/preferences";

const THEMES: ThemePreference[] = ["dark", "light", "system"];

function isTheme(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEMES as string[]).includes(value);
}

function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Private mode or storage disabled — the fallback below still applies.
  }
  return "system";
}

function prefersLight(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function systemTheme(): ResolvedTheme {
  return prefersLight() ? "light" : "dark";
}

/** The server renders `class="dark"`, so keep both classes in sync with that. */
function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme);
  const [systemResolved, setSystemResolved] = useState<ResolvedTheme>(systemTheme);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemResolved : theme;

  // Follow the OS preference, which only matters while theme is "system".
  // The listener is registered once and torn down with the provider.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const query = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event: MediaQueryListEvent) => {
      setSystemResolved(event.matches ? "light" : "dark");
    };

    setSystemResolved(query.matches ? "light" : "dark");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Applying the class is what switches every zinc utility in the app.
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // First paint comes from localStorage (see the inline script), so the
  // database only has to reconcile once, when the session is known.
  useEffect(() => {
    let cancelled = false;

    fetch(PREFERENCES_URL, { headers: { Accept: "application/json" } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { theme?: unknown } | null) => {
        if (cancelled || !data) return;

        const stored = data.theme;
        if (!isTheme(stored)) return;

        setThemeState((current) => {
          if (current === stored) return current;
          try {
            window.localStorage.setItem(STORAGE_KEY, stored);
          } catch {
            // Storage is optional; the class is applied from state anyway.
          }
          return stored;
        });
      })
      .catch(() => {
        // Offline or signed out — keep the local choice.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    // Apply immediately, then persist. A failed write leaves the local choice
    // in place so the UI never snaps back on a flaky connection.
    setThemeState(next);

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures.
    }

    fetch(PREFERENCES_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {
      // The theme is applied locally regardless.
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }
  return context;
}
