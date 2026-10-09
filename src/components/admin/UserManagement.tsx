"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import {
  SortableDataTable,
  type DataColumn,
} from "@/components/arc/sortable-data-table/sortable-data-table";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Badge } from "@/components/arc/badge/badge";
import { Avatar } from "@/components/arc/avatar/avatar";
import { Button } from "@/components/arc/button/button";
import { formatDate } from "@/lib/utils";
import type { AdminUserRow } from "@/db/users";

export default function UserManagement({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const { toast } = useToastStack();
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
        throw new Error(data.error || "Could not update the role");
      }
      /* The badge in this row already shows the new role, so there is nothing
         to confirm. */
    } catch (err) {
      setRows(snapshot);
      toast({
        type: "error",
        title: err instanceof Error ? err.message : "Could not update the role",
      });
    } finally {
      setPendingId(null);
    }
  };

  const columns: DataColumn<AdminUserRow>[] = [
    {
      key: "name",
      label: "User",
      sortable: true,
      render: (_value, row) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.name} src={row.image ?? undefined} />
          <span className="min-w-0">
            <span className="block truncate font-500 text-foreground">
              {row.name}
              {row.id === currentUserId && (
                <span className="ml-1.5 text-xs text-muted">you</span>
              )}
            </span>
            <span className="block truncate text-xs text-muted">{row.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (_value, row) => (
        <Badge tone={row.role === "admin" ? "info" : "neutral"} size="sm">
          {row.role === "admin" ? "Admin" : "User"}
        </Badge>
      ),
    },
    {
      key: "submissions",
      label: "Submissions",
      sortable: true,
      numeric: true,
      render: (_value, row) => (
        <span className="tabular-nums text-secondary">{row.submissions}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (_value, row) => (
        <span className="text-xs text-secondary">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      label: "Change role",
      render: (_value, row) => {
        const isSelf = row.id === currentUserId;
        const pending = pendingId === row.id;
        return (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleRole(row)}
            disabled={isSelf || pending}
            /* The reason is on the disabled control rather than only in a
               title, which a keyboard user never reaches. */
            title={isSelf ? "You cannot change your own role" : undefined}
          >
            {pending
              ? "Saving"
              : row.role === "admin"
                ? "Make user"
                : "Make admin"}
          </Button>
        );
      },
    },
  ];

  return (
    <section className="rounded-panel border border-border bg-surface p-3 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="flex items-center gap-2 font-display text-lg font-500 text-foreground">
          <ShieldCheck size={18} aria-hidden className="text-accent" />
          User management
        </h2>
        <div className="w-full sm:w-64">
          <SearchField
            label="Search users"
            value={query}
            onValueChange={setQuery}
            placeholder="Name or email"
          />
        </div>
      </div>

      <SortableDataTable
        rows={filtered}
        columns={columns}
        rowKey="id"
        caption="Users"
        itemName={{ one: "user", other: "users" }}
        emptyMessage="No users match your search"
        defaultSort={{ key: "name", direction: "asc" }}
      />
    </section>
  );
}