"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useThemePreferences } from "@/hooks/use-theme-preferences";
import {
  DEFAULT_ACCENT,
  normaliseAccent,
  type AccentId,
} from "@/lib/accents";

export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

type ThemeContextValue = {
  /** What the user picked. */
  theme: ThemePreference;
  /** What is actually on the <html> element. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  /** The accent id driving the `data-accent` attribute. */
  accent: AccentId;
  setAccent: (accent: AccentId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Mirrors the inline script in app/layout.tsx. */
const STORAGE_KEY = "trackit-theme";
const ACCENT_STORAGE_KEY = "trackit-accent";
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

function readStoredAccent(): AccentId {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  try {
    return normaliseAccent(window.localStorage.getItem(ACCENT_STORAGE_KEY));
  } catch {
    return DEFAULT_ACCENT;
  }
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
  // Arc's foundation.css keys every token off `data-theme`, while the class
  // above drives the Tailwind `light:` variant and the zinc ramp. Both
  // attributes are written together so they can never drift apart.
  root.setAttribute("data-theme", resolved);
}

/**
 * The attribute is what remaps `--color-indigo-*` in globals.css, which every
 * Tailwind indigo utility resolves through.
 */
function applyAccent(accent: AccentId) {
  document.documentElement.setAttribute("data-accent", accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The first client render must reproduce the server's markup, so state starts
  // at the SSR fallbacks (system, dark, default accent) instead of the real
  // stored values — reading localStorage or matchMedia here would hydrate a
  // different tree. The inline script in app/layout.tsx has already painted
  // the true theme on <html>; the effect below reconciles state with it.
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);
  const [systemResolved, setSystemResolved] = useState<ResolvedTheme>("dark");
  const { data: preferences } = useThemePreferences();

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemResolved : theme;

  // After hydration the stored choices land as an ordinary state update, which
  // ThemeSwitch's settled logic swaps in without animating.
  useEffect(() => {
    setThemeState(readStoredTheme());
    setAccentState(readStoredAccent());
  }, []);

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

  // The inline script owns the first paint: skipping each apply effect's
  // opening run keeps the SSR fallback from overwriting the real theme before
  // the reconciling update above lands it.
  const themeApplied = useRef(false);
  const accentApplied = useRef(false);

  // Applying the class is what switches every zinc utility in the app.
  useEffect(() => {
    if (!themeApplied.current) {
      themeApplied.current = true;
      return;
    }
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // …and the attribute is what switches the accent ramp.
  useEffect(() => {
    if (!accentApplied.current) {
      accentApplied.current = true;
      return;
    }
    applyAccent(accent);
  }, [accent]);

  // First paint comes from localStorage (see the inline script), so the
  // database only has to reconcile once, when the stored row arrives.
  useEffect(() => {
    const stored = preferences?.theme;
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
  }, [preferences]);

  useEffect(() => {
    const stored = preferences?.accent;
    if (!stored) return;

    setAccentState((current) => {
      const next = normaliseAccent(stored);
      if (current === next) return current;
      try {
        window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
      } catch {
        // Storage is optional; the attribute is applied from state anyway.
      }
      return next;
    });
  }, [preferences]);

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

  const setAccent = useCallback((next: AccentId) => {
    // Same order as setTheme: paint first, write second, never roll back the
    // visible choice because a request failed.
    setAccentState(next);

    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures.
    }

    fetch(PREFERENCES_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accent: next }),
    }).catch(() => {
      // The accent is applied locally regardless.
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, accent, setAccent }}>
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
