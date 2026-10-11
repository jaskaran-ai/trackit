import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile } from "./types";

/** Read-only profile summary. Server component: no state or event handlers. */
export default function ProfileCard({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin";

  return (
    <div className="bg-surface border border-[var(--border-subtle)] rounded-panel p-4 sm:p-5">
      <h2 className="font-display text-sm font-500 text-foreground mb-3">Profile</h2>

      <div className="flex items-center gap-3">
        {profile.image ? (
          <Image
            src={profile.image}
            alt={profile.name}
            width={48}
            height={48}
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
  );
}
