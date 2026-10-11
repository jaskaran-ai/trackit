"use client";

import { useState } from "react";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/arc/button/button";
import AppearanceSection from "./AppearanceSection";
import AccentColorPicker from "./AccentColorPicker";
import NotificationsSection from "./NotificationsSection";
import type { Preferences } from "./types";

/* State, dirty tracking, and the save request live here; each section is a
   controlled view over one value. */
export default function PreferencesForm({ initial }: { initial: Preferences }) {
  const { toast } = useToastStack();
  const { setTheme, setAccent } = useTheme();

  const [theme, setThemeValue] = useState(initial.theme);
  const [accent, setAccentValue] = useState(initial.accent);
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
      <AppearanceSection value={theme} onChange={setThemeValue} />

      <div className="h-px bg-[var(--border-subtle)]" />

      <AccentColorPicker value={accent} onChange={setAccentValue} />

      <div className="h-px bg-[var(--border-subtle)]" />

      <NotificationsSection
        checked={inAppNotifications}
        onCheckedChange={setInAppNotifications}
      />

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
