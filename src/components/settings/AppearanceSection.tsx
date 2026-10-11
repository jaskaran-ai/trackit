"use client";

import SectionHeading from "./SectionHeading";
import { ThemeSegmentedControl } from "@/components/theme/ThemeToggle";
import type { ThemePreference } from "@/components/theme/ThemeProvider";

export default function AppearanceSection({
  value,
  onChange,
}: {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
}) {
  return (
    <SectionHeading
      title="Appearance"
      description="System follows the light or dark setting on your device."
    >
      <ThemeSegmentedControl value={value} onChange={onChange} />
    </SectionHeading>
  );
}
