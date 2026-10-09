"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";
import { ThemeSegmentedControl } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/arc/button/button";
import { Switch } from "@/components/arc/switch/switch";
import { ACCENT_IDS, ACCENT_LABELS } from "@/lib/accents";
import type { AccentId } from "@/lib/accents";

export type Preferences = {
  theme: ThemePreference;
  accent: AccentId;
  inAppNotifications: boolean;
};

/** A section label, used three times on this form. */
function SectionHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-500 text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {children && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

export default function PreferencesForm({ initial }: { initial: Preferences }) {
  const { toast } = useToastStack();
  const { setTheme, setAccent } = useTheme();

  const [theme, setThemeValue] = useState<ThemePreference>(initial.theme);
  const [accent, setAccentValue] = useState<AccentId>(initial.accent);
  const [inAppNotifications, setInAppNotifications] = useState(
    initial.inAppNotifications,
  );
  const [saving, setSaving] = useState(false);

  const dirty =
    theme !== initial.theme ||
    accent !== initial.accent ||
    inAppNotifications !== initial.inAppNotifications;

  const revert = () => {
    setThemeValue(initial.theme);
    setAccentValue(initial.accent);
    setInAppNotifications(initial.inAppNotifications);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, accent, inAppNotifications }),
      });
      if (!res.ok) throw new Error("Failed to save");

      // The provider owns <html data-theme> and data-accent, so let it switch.
      if (theme !== initial.theme) setTheme(theme);
      if (accent !== initial.accent) setAccent(accent);

      /* The theme and accent are visibly applied by the provider before this,
         but "saved" is about persistence, which nothing on screen shows. */
      toast({ type: "success", title: "Preferences saved" });
    } catch {
      revert();
      toast({ type: "error", title: "Could not save your preferences" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-panel border border-border bg-surface p-4 sm:p-5">
      <SectionHeading
        title="Appearance"
        description="System follows the light or dark setting on your device."
      >
        <ThemeSegmentedControl value={theme} onChange={setThemeValue} />
      </SectionHeading>

      <div className="h-px bg-[var(--border-subtle)]" />

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
            const current = ACCENT_IDS.indexOf(accent);
            const step =
              event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
            const next =
              ACCENT_IDS[
                (current + step + ACCENT_IDS.length) % ACCENT_IDS.length
              ];
            setAccentValue(next);
            document
              .querySelector<HTMLElement>(`[data-testid="accent-${next}"]`)
              ?.focus();
          }}
        >
          {ACCENT_IDS.map((id) => {
            const selected = accent === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={ACCENT_LABELS[id]}
                onClick={() => setAccentValue(id)}
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

      <div className="h-px bg-[var(--border-subtle)]" />

      <SectionHeading title="Notifications">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-500 text-foreground">In-app notifications</p>
            <p className="mt-0.5 text-sm text-muted">
              Get a bell alert when someone comments on or updates a submission.
            </p>
          </div>

          <Switch
            checked={inAppNotifications}
            onCheckedChange={setInAppNotifications}
            aria-label="In-app notifications"
          />
        </div>
      </SectionHeading>

      <div className="flex items-center gap-2 pt-1">
        <Button onClick={handleSave} disabled={!dirty || saving} loading={saving}>
          {saving ? "Saving" : "Save changes"}
        </Button>

        {dirty && !saving && (
          <Button variant="ghost" onClick={revert}>
            Discard
          </Button>
        )}
      </div>
    </div>
  );
}