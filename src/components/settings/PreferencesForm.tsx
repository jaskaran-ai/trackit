"use client";

import { useState } from "react";
import { Check, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";
import { ThemeSegmentedControl } from "@/components/theme/ThemeToggle";

export type Preferences = {
  theme: ThemePreference;
  inAppNotifications: boolean;
};

export default function PreferencesForm({ initial }: { initial: Preferences }) {
  const { setTheme } = useTheme();

  const [theme, setThemeValue] = useState<ThemePreference>(initial.theme);
  const [inAppNotifications, setInAppNotifications] = useState(
    initial.inAppNotifications,
  );
  const [saving, setSaving] = useState(false);

  const dirty = theme !== initial.theme || inAppNotifications !== initial.inAppNotifications;

  const revert = () => {
    setThemeValue(initial.theme);
    setInAppNotifications(initial.inAppNotifications);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, inAppNotifications }),
      });
      if (!res.ok) throw new Error("Failed to save");

      // The provider owns the <html> class, so let it do the switch.
      if (theme !== initial.theme) setTheme(theme);

      toast.success("Preferences saved");
    } catch {
      revert();
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-6">
      {/* Theme */}
      <div>
        <h2 className="font-display text-sm font-600 text-zinc-200 mb-1">Appearance</h2>
        <p className="text-xs text-zinc-500 mb-3">
          System follows the light or dark setting on your device.
        </p>
        <ThemeSegmentedControl
          value={theme}
          onChange={setThemeValue}
          showLabels
          className="w-full sm:w-auto sm:inline-flex"
        />
      </div>

      <div className="h-px bg-zinc-800" />

      {/* In-app notifications */}
      <div>
        <h2 className="font-display text-sm font-600 text-zinc-200 mb-1">
          Notifications
        </h2>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <Bell size={13} className="text-zinc-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-500 text-zinc-200">In-app notifications</p>
            <p className="text-xs text-zinc-500">
              Get a bell alert when someone comments on or updates a submission.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={inAppNotifications}
            aria-label="In-app notifications"
            onClick={() => setInAppNotifications((value) => !value)}
            className={cn(
              "relative w-10 h-6 rounded-full transition-colors cursor-pointer shrink-0",
              inAppNotifications ? "bg-indigo-500" : "bg-zinc-600",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                inAppNotifications && "translate-x-4",
              )}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-500 transition-colors",
            dirty && !saving
              ? "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed",
          )}
        >
          {saving ? (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {saving ? "Saving…" : "Save changes"}
        </button>

        {dirty && !saving && (
          <button
            type="button"
            onClick={revert}
            className="px-3 py-2 rounded-lg text-sm font-500 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  );
}
