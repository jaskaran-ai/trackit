"use client";

import { ThemeSwitch } from "@/components/arc/theme-switch/theme-switch";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

/**
 * The three-way preference, for the settings form where there is room to name
 * each option. "System" only exists here: the Navbar switch has two states to
 * animate between, and offering a third would mean a control that cannot show
 * which one it is on.
 */
export function ThemeSegmentedControl({
  value,
  onChange,
  className,
}: {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
  className?: string;
}) {
  return (
    <SegmentedControl
      className={className}
      label="Theme"
      value={value}
      onValueChange={(next) => onChange(next as ThemePreference)}
      options={[
        { value: "system", label: THEME_LABELS.system },
        { value: "light", label: THEME_LABELS.light },
        { value: "dark", label: THEME_LABELS.dark },
      ]}
    />
  );
}

/**
 * Navbar switch. It shows the theme that is actually on screen, so a "system"
 * preference is displayed as the resolved theme it produced. Choosing one here
 * pins an explicit light or dark and stops following the OS.
 */
export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  function handleChange(next: "light" | "dark") {
    // The whole page repaints on this. A toast on top of that would only
    // confirm what is already on screen.
    if (next === resolvedTheme && theme === next) return;
    setTheme(next);
  }

  return (
    <ThemeSwitch
      theme={resolvedTheme}
      onThemeChange={handleChange}
      iconOnly
      label="Theme"
    />
  );
}