/*
 * Link styling that matches Arc's buttons.
 *
 * Arc's `Button` renders a real `<button>` and takes no `href`, so navigation
 * has to stay a real link: nesting a link inside a button is invalid HTML and
 * breaks middle-click, open-in-new-tab, and keyboard activation.
 *
 * Rather than restate the recipe at each call site, which is how a nav ends up
 * with two different "primary" actions, these mirror the `.primary` and
 * `.secondary` rules in components/arc/button/button.module.css against the
 * same tokens. If Arc changes its button, change these two strings with it.
 *
 * Everything else about a button (press scale, the label width spring, the
 * loading state) belongs to the component and is deliberately not reproduced
 * here: a link that navigates has no pending state to show.
 */

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control border border-transparent text-sm font-500 transition-colors";

export const PRIMARY_LINK_CLASS = `${BASE} min-h-[var(--control-height-sm)] bg-foreground px-3 text-background hover:opacity-90`;

/* Secondary is the outlined variant, for links beside a primary action. */
export const SECONDARY_LINK_CLASS = `${BASE} min-h-[var(--control-height-sm)] border-border bg-surface px-3 text-foreground hover:bg-surface-muted`;

/* A navigation link in a bar, not an action: no border, no fill at rest. */
export const NAV_LINK_CLASS =
  "flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-surface-muted hover:text-foreground";
