/**
 * Accent ids for the design system.
 *
 * The ids are exactly the ones Arc's foundation.css defines on `:root`, which
 * is what keeps this picker honest: choosing an id selects a whole validated
 * palette (accent, strong, subtle, accent-foreground, and the selection
 * control fills), not one hex value. Adding an id here without a matching
 * block in foundation.css would fall back to Arc's neutral ramp.
 *
 * The colour values themselves live in components/arc/foundation.css only. A
 * picker swatch is previewed by scoping `data-accent` on the swatch element
 * itself, so it renders with the real remapped variables rather than a
 * duplicated hex. Keeping the palette in one place is what stops the settings
 * UI from drifting away from the app.
 */

export const ACCENT_IDS = [
  "neutral",
  "violet",
  "blue",
  "green",
  "amber",
  "orange",
  "coral",
  "rose",
] as const;

export type AccentId = (typeof ACCENT_IDS)[number];

export const DEFAULT_ACCENT: AccentId = "neutral";

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
  neutral: "Neutral",
  violet: "Violet",
  blue: "Blue",
  green: "Green",
  amber: "Amber",
  orange: "Orange",
  coral: "Coral",
  rose: "Rose",
};
