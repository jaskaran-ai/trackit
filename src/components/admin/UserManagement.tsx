"use client";

import { useMemo, useState } from "react";
import { Search, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { AdminUserRow } from "@/db/users";

export default function UserManagement({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState<AdminUserRow[]>(users);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const toggleRole = async (user: AdminUserRow) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    const snapshot = rows;
    setRows((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)),
    );
    setPendingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Could not update role");
      }
      toast.success(`${user.name} is now ${nextRole === "admin" ? "an admin" : "a user"}`);
    } catch (err) {
      setRows(snapshot);
      toast.error(err instanceof Error ? err.message : "Could not update role");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-fade-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-700 text-white flex items-center gap-2">
          <ShieldCheck size={18} className="text-indigo-400" />
          User management
        </h2>
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="w-56 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500/60"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["User", "Role", "Submissions", "Joined", ""].map((label) => (
                <th
                  key={label}
                  className="whitespace-nowrap px-3 py-2 text-left text-xs font-500 text-zinc-500 first:text-left last:text-right"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-zinc-600">
                  No users match your search
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isSelf = user.id === currentUserId;
                const isAdmin = user.role === "admin";
                return (
                  <tr key={user.id} className="transition-colors hover:bg-zinc-800/40">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-600 text-white">
                            {user.name?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-500 text-zinc-200">
                            {user.name}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-zinc-600">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-500",
                          isAdmin
                            ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400",
                        )}
                      >
                        {isAdmin ? (
                          <Shield size={10} />
                        ) : (
                          <UserIcon size={10} />
                        )}
                        {isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-zinc-400 tabular-nums">
                      {user.submissions}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-zinc-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleRole(user)}
                        disabled={isSelf || pendingId === user.id}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-500 transition-all",
                          isSelf
                            ? "cursor-not-allowed border-zinc-800 bg-zinc-800/50 text-zinc-600"
                            : "cursor-pointer border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100",
                        )}
                        title={
                          isSelf ? "You cannot change your own role" : undefined
                        }
                      >
                        {pendingId === user.id
                          ? "Saving…"
                          : isAdmin
                            ? "Make user"
                            : "Make admin"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
