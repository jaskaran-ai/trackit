"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useThemePreferences } from "@/hooks/use-theme-preferences";
import {
  DEFAULT_ACCENT,
  normaliseAccent,
  type AccentId,
} from "@/lib/accents";
import {
  useLocalStorageValue,
  writeLocalStorage,
} from "@/lib/local-storage-store";

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

function parseTheme(raw: string | null): ThemePreference {
  return isTheme(raw) ? raw : "system";
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

/** Follows the OS preference. Only read while the theme is "system". */
function subscribeToSystemTheme(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const query = window.matchMedia("(prefers-color-scheme: light)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
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
  // The first client render must reproduce the server's markup. The stores
  // below return their SSR fallbacks during hydration and switch to the stored
  // values right after. The inline script in app/layout.tsx has already painted
  // the true theme on <html>, so this only reconciles React state with it.
  const theme = useLocalStorageValue(STORAGE_KEY, parseTheme, "system");
  const accent = useLocalStorageValue(
    ACCENT_STORAGE_KEY,
    (raw) => normaliseAccent(raw),
    DEFAULT_ACCENT,
  );
  const systemResolved = useSyncExternalStore(
    subscribeToSystemTheme,
    systemTheme,
    () => "dark" as ResolvedTheme,
  );
  const { data: preferences } = useThemePreferences();

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemResolved : theme;

  // The first run is skipped so the SSR fallback never overwrites the theme the
  // inline script already applied. Every later change is written to the DOM.
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

  // The database reconciles the local copy once the stored row arrives. Writing
  // to the store re-renders the provider, so nothing here sets state directly.
  useEffect(() => {
    const stored = preferences?.theme;
    if (isTheme(stored)) writeLocalStorage(STORAGE_KEY, stored);
  }, [preferences]);

  useEffect(() => {
    const stored = preferences?.accent;
    if (stored) writeLocalStorage(ACCENT_STORAGE_KEY, normaliseAccent(stored));
  }, [preferences]);

  const setTheme = useCallback((next: ThemePreference) => {
    // Apply immediately, then persist. A failed write leaves the local choice
    // in place so the UI never snaps back on a flaky connection.
    writeLocalStorage(STORAGE_KEY, next);

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
    writeLocalStorage(ACCENT_STORAGE_KEY, next);

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
