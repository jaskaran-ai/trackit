"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/**
 * Three-way segmented control. Icon only by default so it fits in the Navbar
 * cluster; pass `showLabels` for the settings form.
 */
export function ThemeSegmentedControl({
  value,
  onChange,
  showLabels = false,
  className,
}: {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
  showLabels?: boolean;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-800 border border-zinc-700",
        className,
      )}
    >
      {THEME_OPTIONS.map(({ value: option, label, icon: Icon }) => {
        const active = option === value;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(option)}
            className={cn(
              "flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-500 transition-colors cursor-pointer",
              showLabels ? "flex-1 px-2.5" : "w-8",
              active
                ? "bg-zinc-900 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60",
            )}
          >
            <Icon size={13} />
            {showLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Compact theme switch for the Navbar. */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleChange = (next: ThemePreference) => {
    if (next === theme) return;
    setTheme(next);
    const label = THEME_OPTIONS.find((option) => option.value === next)?.label ?? next;
    toast.success(`Theme set to ${label.toLowerCase()}`);
  };

  return <ThemeSegmentedControl value={theme} onChange={handleChange} />;
}
