import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { UserPreference } from "@/db/types";

const PREFERENCES_URL = "/api/user/preferences";

/** Wire shape of GET /api/user/preferences. */
export type ThemePreferences = Pick<UserPreference, "theme" | "inAppNotifications">;

/**
 * Reads the stored preference row once. Signed out and offline responses come
 * back as null so the caller keeps whatever the local choice was.
 */
export function useThemePreferences() {
  return useQuery({
    queryKey: queryKeys.preferences,
    queryFn: async () => {
      const res = await fetch(PREFERENCES_URL, { headers: { Accept: "application/json" } });
      if (!res.ok) return null;
      return (await res.json()) as ThemePreferences | null;
    },
  });
}
