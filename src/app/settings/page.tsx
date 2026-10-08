import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-2xl font-700 text-white mb-1">Settings</h1>
          <p className="text-zinc-500 text-sm">Your profile and how TrackIt looks to you.</p>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 animate-fade-up animate-fade-up-delay-1">
            <h2 className="font-display text-sm font-600 text-zinc-200 mb-4">Profile</h2>

            <div className="flex items-center gap-4">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-lg text-white font-600 shrink-0">
                  {profile.name?.[0]}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-600 text-zinc-100 truncate">{profile.name}</p>
                <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                    <ShieldCheck size={10} /> Admin
                  </span>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-zinc-800">
              <div>
                <dt className="text-xs text-zinc-500 mb-0.5">Role</dt>
                <dd className="text-sm font-500 text-zinc-200">
                  {isAdmin ? "Administrator" : "Member"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500 mb-0.5">Member since</dt>
                <dd className="text-sm font-500 text-zinc-200">
                  {profile.createdAt ? formatDate(profile.createdAt) : "Not available"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Preferences */}
          <div className="animate-fade-up animate-fade-up-delay-2">
            <PreferencesForm initial={preferences} />
          </div>
        </div>
      </main>
    </div>
  );
}
