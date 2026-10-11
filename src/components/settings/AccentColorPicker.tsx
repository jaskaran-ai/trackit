"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT_IDS, ACCENT_LABELS } from "@/lib/accents";
import type { AccentId } from "@/lib/accents";
import SectionHeading from "./SectionHeading";

export default function AccentColorPicker({
  value,
  onChange,
}: {
  value: AccentId;
  onChange: (accent: AccentId) => void;
}) {
  return (
    <SectionHeading
      title="Accent colour"
      description="Marks the active item, selected options, and your primary actions. Status badges keep their own colours."
    >
      <div
        role="radiogroup"
        aria-label="Accent colour"
        className="flex flex-wrap items-center gap-2"
        onKeyDown={(event) => {
          if (
            event.key !== "ArrowRight" &&
            event.key !== "ArrowLeft" &&
            event.key !== "ArrowUp" &&
            event.key !== "ArrowDown"
          ) {
            return;
          }
          event.preventDefault();
          const current = ACCENT_IDS.indexOf(value);
          const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
          const next =
            ACCENT_IDS[(current + step + ACCENT_IDS.length) % ACCENT_IDS.length];
          onChange(next);
          document
            .querySelector<HTMLElement>(`[data-testid="accent-${next}"]`)
            ?.focus();
        }}
      >
        {ACCENT_IDS.map((id) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={ACCENT_LABELS[id]}
              onClick={() => onChange(id)}
              /* Scoped to the swatch so the dot paints with the real Arc
                 tokens for this hue. The palette lives only in Arc's
                 foundation.css on generic `[data-accent]` selectors (not
                 `:root`), so there is no second copy of these colours in
                 JS to drift. */
              data-accent={id}
              data-testid={`accent-${id}`}
              className={cn(
                "flex h-11 w-11 cursor-pointer items-center justify-center rounded-control border transition-colors",
                selected
                  ? "border-foreground"
                  : "border-border hover:border-border-strong",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full bg-accent transition-transform",
                  selected && "scale-110",
                )}
              >
                {selected && (
                  <Check
                    size={12}
                    strokeWidth={3}
                    className="text-accent-foreground"
                    aria-hidden="true"
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </SectionHeading>
  );
}
