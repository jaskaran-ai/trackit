"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  StatusBadge,
  TypeBadge,
  PriorityBadge,
  ProjectBadge,
} from "@/components/shared/Badges";
import { formatDate, PROJECT_LABELS } from "@/lib/utils";
import {
  Search,
  Paperclip,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
} from "lucide-react";
import AgingBadge from "@/components/admin/AgingBadge";
import BulkActions, { type BulkAction } from "@/components/admin/BulkActions";
import SavedViews from "@/components/admin/SavedViews";
import VoteButton from "@/components/shared/VoteButton";
import type { SubmissionWithUser } from "@/types";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";
import type { SavedViewFilters } from "@/db/views";
import toast from "react-hot-toast";

type SortKey = "createdAt" | "status" | "type" | "priority" | "title";
type SortDir = "asc" | "desc";

// Rows arrive with vote state attached on the server, so the votes column
// renders from data instead of fetching a summary per row on mount.
type TableRow = SubmissionWithUser & {
  voteCount?: number;
  hasVoted?: boolean;
};

const PAGE_SIZES = [25, 50, 100] as const;

const STATUS_FILTERS = ["ALL", "OPEN", "IN_PROGRESS", "REVIEW", "COMPLETE", "CANCELED"] as const;
const TYPE_FILTERS = ["ALL", "BUG", "FEATURE"] as const;
const PRIORITY_FILTERS = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const PROJECT_FILTERS = [
  "ALL",
  "IVALT_MOBILE",
  "DOCU_ID",
  "ONDEMAND_ID",
  "KEYCLOCK",
  "OTHER",
] as const;

function prettyAction(action: BulkAction): string {
  switch (action) {
    case "status":
      return "Status updated";
    case "priority":
      return "Priority updated";
    case "archive":
      return "Archived";
    case "restore":
      return "Restored";
    case "delete":
      return "Deleted";
    default:
      return "Done";
  }
}

export default function AdminTable({ submissions }: { submissions: TableRow[] }) {
  const [rows, setRows] = useState<TableRow[]>(submissions);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<SubmissionType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [filterProject, setFilterProject] = useState<Project | "ALL">("ALL");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "createdAt",
    dir: "desc",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);

  const filtered = useMemo(() => {
    return rows
      .filter((s) => {
        if (filterType !== "ALL" && s.type !== filterType) return false;
        if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
        if (filterPriority !== "ALL" && s.priority !== filterPriority) return false;
        if (filterProject !== "ALL" && s.project !== filterProject) return false;
        if (
          search &&
          !s.title.toLowerCase().includes(search.toLowerCase()) &&
          !s.user.name.toLowerCase().includes(search.toLowerCase()) &&
          !s.user.email.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sort.dir === "asc" ? 1 : -1;
        if (sort.key === "createdAt") {
          return (
            dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
        }
        return dir * String(a[sort.key]).localeCompare(String(b[sort.key]));
      });
  }, [rows, search, filterType, filterStatus, filterPriority, filterProject, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => filtered.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [filtered, safePage, pageSize],
  );

  useEffect(() => {
    setPage(0);
  }, [search, filterType, filterStatus, filterPriority, filterProject]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort.key !== k) return <ChevronsUpDown size={12} className="text-zinc-700" />;
    return sort.dir === "asc" ? (
      <ChevronUp size={12} className="text-indigo-400" />
    ) : (
      <ChevronDown size={12} className="text-indigo-400" />
    );
  };

  const currentFilters: SavedViewFilters = useMemo(
    () => ({
      search: search || undefined,
      type: filterType !== "ALL" ? filterType : undefined,
      status: filterStatus !== "ALL" ? filterStatus : undefined,
      priority: filterPriority !== "ALL" ? filterPriority : undefined,
      project: filterProject !== "ALL" ? filterProject : undefined,
      sort: { key: sort.key, dir: sort.dir },
    }),
    [search, filterType, filterStatus, filterPriority, filterProject, sort],
  );

  const applySavedView = (filters: SavedViewFilters) => {
    setSearch(filters.search ?? "");
    setFilterType((filters.type as SubmissionType) ?? "ALL");
    setFilterStatus((filters.status as SubmissionStatus) ?? "ALL");
    setFilterPriority((filters.priority as Priority) ?? "ALL");
    setFilterProject((filters.project as Project) ?? "ALL");
    const key = (filters.sort?.key ?? "createdAt") as SortKey;
    setSort({ key, dir: filters.sort?.dir ?? "desc" });
  };

  const exportCSV = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (filterStatus !== "ALL") params.set("status", filterStatus);
    if (filterType !== "ALL") params.set("type", filterType);
    if (filterPriority !== "ALL") params.set("priority", filterPriority);
    if (filterProject !== "ALL") params.set("project", filterProject);
    window.location.href = `/api/admin/export?${params.toString()}`;
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const pageIds = useMemo(() => paged.map((s) => s.id), [paged]);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleDispatch = async (action: BulkAction, value?: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const snapshot = rows;

    setRows((current) =>
      current
        .map((s) => {
          if (!ids.includes(s.id)) return s;
          if (action === "status") return { ...s, status: value as SubmissionStatus };
          if (action === "priority") return { ...s, priority: value as Priority };
          return s;
        })
        .filter((s) =>
          action === "archive" || action === "delete" ? !ids.includes(s.id) : true
        )
    );
    clearSelection();

    try {
      const res = await fetch("/api/submissions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, ...(value ? { value } : {}) }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { changed?: number };
      toast.success(
        `${prettyAction(action)}${data.changed ? ` · ${data.changed} updated` : ""}`,
      );
    } catch {
      setRows(snapshot);
      toast.error(`Failed to ${action}`);
    }
  };

  const selectClass =
    "cursor-pointer bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-indigo-500/60 transition-colors";

  const colSpan = 10;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-zinc-800 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, user…"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as SubmissionType | "ALL")}
            className={selectClass}
          >
            {TYPE_FILTERS.map((o) => (
              <option key={o} value={o}>
                {o === "ALL" ? "All Types" : o}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as SubmissionStatus | "ALL")}
            className={selectClass}
          >
            {STATUS_FILTERS.map((o) => (
              <option key={o} value={o}>
                {o === "ALL" ? "All Statuses" : o.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | "ALL")}
            className={selectClass}
          >
            {PRIORITY_FILTERS.map((o) => (
              <option key={o} value={o}>
                {o === "ALL" ? "All Priorities" : o}
              </option>
            ))}
          </select>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value as Project | "ALL")}
            className={selectClass}
          >
            {PROJECT_FILTERS.map((o) => (
              <option key={o} value={o}>
                {o === "ALL" ? "All Projects" : (PROJECT_LABELS[o] ?? o)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 text-sm font-500 text-indigo-300 transition-colors hover:bg-indigo-500/25"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>

        <SavedViews filters={currentFilters} onApply={applySavedView} />
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <BulkActions
          count={selectedIds.length}
          onDispatch={handleDispatch}
          onClear={clearSelection}
        />
      )}

      {/* Count + pagination */}
      <div className="px-4 py-2 border-b border-zinc-800/50 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-zinc-600">
          {filtered.length} submission{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <label className="flex items-center gap-1.5">
            <span className="text-zinc-600">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 outline-none focus:border-indigo-500/60"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            Prev
          </button>
          <span className="tabular-nums">
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            Next
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                  aria-label="Select all on this page"
                  className="h-3.5 w-3.5 cursor-pointer accent-indigo-500"
                />
              </th>
              {[
                { key: "title" as SortKey, label: "Title" },
                { key: "type" as SortKey, label: "Type" },
                { key: "priority" as SortKey, label: "Priority" },
                { key: "status" as SortKey, label: "Status" },
                { key: "createdAt" as SortKey, label: "Date" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left text-xs font-500 text-zinc-500 px-4 py-2.5 cursor-pointer hover:text-zinc-300 transition-colors whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon k={key} />
                  </span>
                </th>
              ))}
              <th className="text-left text-xs font-500 text-zinc-500 px-4 py-2.5 whitespace-nowrap">
                Votes
              </th>
              <th className="text-left text-xs font-500 text-zinc-500 px-4 py-2.5 whitespace-nowrap">
                Project
              </th>
              <th className="text-left text-xs font-500 text-zinc-500 px-4 py-2.5 whitespace-nowrap">
                Reporter
              </th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="text-center py-12 text-zinc-600 text-sm">
                  No submissions match the current filters
                </td>
              </tr>
            ) : (
              paged.map((s) => (
                <tr
                  key={s.id}
                  className={`transition-colors group ${
                    selected.has(s.id) ? "bg-indigo-500/5" : "hover:bg-zinc-800/40"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleRow(s.id)}
                      aria-label={`Select ${s.title}`}
                      className="h-3.5 w-3.5 cursor-pointer accent-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-zinc-200 line-clamp-1 text-sm">{s.title}</span>
                    {s.attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-zinc-600 mt-0.5">
                        <Paperclip size={10} /> {s.attachments.length}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <TypeBadge type={s.type} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <PriorityBadge priority={s.priority} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-zinc-500">
                        {formatDate(s.createdAt)}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <AgingBadge
                          createdAt={s.createdAt}
                          dueDate={s.dueDate}
                          status={s.status}
                          resolvedAt={s.resolvedAt}
                        />
                        {s.dueDate && (
                          <span className="text-[11px] text-zinc-600">
                            due {formatDate(s.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {s.type === "FEATURE" ? (
                      <VoteButton
                        submissionId={s.id}
                        initialCount={s.voteCount}
                        initialHasVoted={s.hasVoted}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ProjectBadge project={s.project} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {s.user.image ? (
                        <img
                          src={s.user.image}
                          alt={s.user.name}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-600">
                          {s.user.name?.[0]}
                        </div>
                      )}
                      <span className="text-xs text-zinc-400 max-w-[100px] truncate">
                        {s.user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/submission/${s.id}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
