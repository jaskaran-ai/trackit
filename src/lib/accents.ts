/**
 * Accent ids for the design system.
 *
 * Colour values deliberately live in `src/app/globals.css` only. A picker
 * swatch is previewed by scoping `data-accent` on the swatch element itself, so
 * it renders with the real remapped `--color-indigo-*` variables rather than a
 * duplicated hex. Keeping the palette in one place is what stops the settings
 * UI from drifting away from the app.
 */

export const ACCENT_IDS = [
  "indigo",
  "violet",
  "blue",
  "green",
  "amber",
  "orange",
  "coral",
  "rose",
  "neutral",
] as const;

export type AccentId = (typeof ACCENT_IDS)[number];

export const DEFAULT_ACCENT: AccentId = "indigo";

export function isAccentId(value: unknown): value is AccentId {
  return (
    typeof value === "string" &&
    (ACCENT_IDS as readonly string[]).includes(value)
  );
}

export function normaliseAccent(value: unknown): AccentId {
  return isAccentId(value) ? value : DEFAULT_ACCENT;
}

export const ACCENT_LABELS: Record<AccentId, string> = {
  indigo: "Indigo",
  violet: "Violet",
  blue: "Blue",
  green: "Green",
  amber: "Amber",
  orange: "Orange",
  coral: "Coral",
  rose: "Rose",
  neutral: "Neutral",
};
