import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, queryKeys } from "@/lib/query-client";
import { getPreferences } from "@/db/preferences";
import { getUserById } from "@/db/users";
import { requireUser } from "@/lib/session";
import Navbar from "@/components/shared/Navbar";
import ProfileCard from "@/components/settings/ProfileCard";
import PreferencesForm from "@/components/settings/PreferencesForm";
import type { Profile } from "@/components/settings/types";

export default async function SettingsPage() {
  const user = await requireUser();

  const [preferences, dbUser] = await Promise.all([
    getPreferences(user.id),
    // The session carries the basics; the users row may hold a fresher name or
    // avatar, so the card prefers it and falls back to the session.
    getUserById(user.id),
  ]);

  const profile: Profile = {
    name: dbUser?.name ?? user.name,
    email: dbUser?.email ?? user.email,
    image: dbUser?.image ?? user.image ?? null,
    role: dbUser?.role ?? user.role,
    createdAt: dbUser?.createdAt ?? null,
  };

  // The server already holds the preferences row, so seed the client cache
  // with it. ThemeProvider's useThemePreferences then reads fresh data on
  // mount instead of refetching GET /api/user/preferences (which would
  // re-validate the session and re-run the same query).
  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.preferences, {
    theme: preferences.theme,
    accent: preferences.accent,
    inAppNotifications: preferences.inAppNotifications,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-3 sm:px-5 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-500 text-foreground mb-1">Settings</h1>
          <p className="text-muted text-sm">Your profile and how TrackIt looks to you.</p>
        </div>

        <div className="space-y-3">
          <ProfileCard profile={profile} />

          <HydrationBoundary state={dehydrate(queryClient)}>
            <PreferencesForm initial={preferences} />
          </HydrationBoundary>
        </div>
      </main>
    </div>
  );
}
