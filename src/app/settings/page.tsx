import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, queryKeys } from "@/lib/query-client";
import { getPreferences } from "@/db/preferences";
import { getUserById } from "@/db/users";
import Navbar from "@/components/shared/Navbar";
import PreferencesForm from "@/components/settings/PreferencesForm";
import { ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const [preferences, user] = await Promise.all([
    getPreferences(session.user.id),
    getUserById(session.user.id),
  ]);

  const profile = {
    name: user?.name ?? session.user.name,
    email: user?.email ?? session.user.email,
    image: user?.image ?? session.user.image ?? null,
    role: user?.role ?? session.user.role,
    createdAt: user?.createdAt ?? null,
  };

  const isAdmin = profile.role === "admin";

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
          {/* Profile */}
          <div className="bg-surface border border-[var(--border-subtle)] rounded-panel p-4 sm:p-5">
            <h2 className="font-display text-sm font-500 text-foreground mb-3">Profile</h2>

            <div className="flex items-center gap-3">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground font-500 shrink-0">
                  {profile.name?.[0]}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-500 text-foreground truncate">{profile.name}</p>
                <p className="text-xs text-muted truncate">{profile.email}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs bg-accent-subtle text-accent border border-border px-1.5 py-0.5 rounded">
                    <ShieldCheck size={10} /> Admin
                  </span>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-5 border-t border-[var(--border-subtle)]">
              <div>
                <dt className="text-xs text-muted mb-0.5">Role</dt>
                <dd className="text-sm font-500 text-foreground">
                  {isAdmin ? "Administrator" : "Member"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Member since</dt>
                <dd className="text-sm font-500 text-foreground">
                  {profile.createdAt ? formatDate(profile.createdAt) : "Not available"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Preferences */}
          <HydrationBoundary state={dehydrate(queryClient)}>
            <PreferencesForm initial={preferences} />
          </HydrationBoundary>
        </div>
      </main>
    </div>
  );
}
