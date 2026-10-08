import { eq } from "drizzle-orm";
import { db } from "./index";
import { userPreference } from "./schema";

export type UserPreferences = {
  theme: "dark" | "light" | "system";
  inAppNotifications: boolean;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  inAppNotifications: true,
};

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const row = await db.query.userPreference.findFirst({
    where: eq(userPreference.userId, userId),
  });

  if (!row) return DEFAULT_PREFERENCES;

  return {
    theme: (row.theme as UserPreferences["theme"]) ?? "dark",
    inAppNotifications: row.inAppNotifications ?? true,
  };
}

/**
 * Upserts preferences — the row is created on first read/write so existing
 * users don't need a backfill.
 */
export async function updatePreferences(
  userId: string,
  patch: Partial<UserPreferences>,
) {
  const [row] = await db
    .insert(userPreference)
    .values({
      userId,
      theme: patch.theme ?? DEFAULT_PREFERENCES.theme,
      inAppNotifications:
        patch.inAppNotifications ?? DEFAULT_PREFERENCES.inAppNotifications,
    })
    .onConflictDoUpdate({
      target: userPreference.userId,
      set: {
        ...(patch.theme ? { theme: patch.theme } : {}),
        ...(patch.inAppNotifications !== undefined
          ? { inAppNotifications: patch.inAppNotifications }
          : {}),
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!row) return DEFAULT_PREFERENCES;

  return {
    theme: (row.theme as UserPreferences["theme"]) ?? "dark",
    inAppNotifications: row.inAppNotifications ?? true,
  };
}
