import type { ThemePreference } from "@/components/theme/ThemeProvider";
import type { AccentId } from "@/lib/accents";

/** The preferences row as the settings screen edits it. */
export type Preferences = {
  theme: ThemePreference;
  accent: AccentId;
  inAppNotifications: boolean;
};

/** The signed-in user's profile as shown on the settings screen. */
export type Profile = {
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: Date | null;
};
