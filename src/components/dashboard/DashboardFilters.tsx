"use client";

import { useMemo, useState } from "react";
import { Inbox, Search, SlidersHorizontal, X } from "lucide-react";
import { PRIORITY_COLORS, PROJECT_LABELS, STATUS_LABELS, TYPE_COLORS } from "@/lib/utils";
import SubmissionCard from "@/components/shared/SubmissionCard";
import type { SubmissionWithUser } from "@/types";

type SortKey = "newest" | "oldest" | "title" | "priority" | "status";

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
const PRIORITY_OPTIONS = Object.keys(PRIORITY_COLORS);
const PROJECT_OPTIONS = Object.keys(PROJECT_LABELS);
const TYPE_OPTIONS = Object.keys(TYPE_COLORS);

// Token → label without a second hardcoded map: LOW → Low, IN_PROGRESS → In progress.
function humanise(token: string) {
  const words = token.toLowerCase().split("_");
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// Rank comes from the shared label maps so ordering can never drift from them.
const STATUS_RANK = new Map(STATUS_OPTIONS.map((s, i) => [s, i]));
const PRIORITY_RANK = new Map(PRIORITY_OPTIONS.map((p, i) => [p, i]));

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
];

const SELECT_CLASS =
  "bg-zinc-900 border border-zinc-800 focus:border-indigo-500/60 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none transition-colors cursor-pointer";

const EMPTY_FILTERS = {
  search: "",
  status: "",
  type: "",
  priority: "",
  project: "",
  sort: "newest" as SortKey,
};

export default function DashboardFilters({ submissions }: { submissions: SubmissionWithUser[] }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    const rows = submissions.filter((submission) => {
      if (filters.status && submission.status !== filters.status) return false;
      if (filters.type && submission.type !== filters.type) return false;
      if (filters.priority && submission.priority !== filters.priority) return false;
      if (filters.project && submission.project !== filters.project) return false;
      if (query && !submission.title.toLowerCase().includes(query)) return false;
      return true;
    });

    const time = (value: SubmissionWithUser["createdAt"]) => new Date(value).getTime();

    return [...rows].sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return time(a.createdAt) - time(b.createdAt);
        case "title":
          return a.title.localeCompare(b.title);
        case "priority":
          return (
            (PRIORITY_RANK.get(a.priority) ?? 99) - (PRIORITY_RANK.get(b.priority) ?? 99) ||
            time(b.createdAt) - time(a.createdAt)
          );
        case "status":
          return (
            (STATUS_RANK.get(a.status) ?? 99) - (STATUS_RANK.get(b.status) ?? 99) ||
            time(b.createdAt) - time(a.createdAt)
          );
        case "newest":
        default:
          return time(b.createdAt) - time(a.createdAt);
      }
    });
  }, [submissions, filters]);

  const isFiltered =
    filters.search.trim() !== "" ||
    filters.status !== "" ||
    filters.type !== "" ||
    filters.priority !== "" ||
    filters.project !== "";

  return (
    <>
      {/* Filter bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-4 animate-fade-up animate-fade-up-delay-1">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search submissions by title…"
              aria-label="Search submissions"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/60 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <SlidersHorizontal size={13} className="text-zinc-600 shrink-0 hidden sm:block" />

            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              aria-label="Filter by status"
              className={SELECT_CLASS}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              aria-label="Filter by type"
              className={SELECT_CLASS}
            >
              <option value="">All types</option>
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {humanise(type)}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              aria-label="Filter by priority"
              className={SELECT_CLASS}
            >
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {humanise(priority)}
                </option>
              ))}
            </select>

            <select
              value={filters.project}
              onChange={(e) => setFilters((f) => ({ ...f, project: e.target.value }))}
              aria-label="Filter by project"
              className={SELECT_CLASS}
            >
              <option value="">All projects</option>
              {PROJECT_OPTIONS.map((project) => (
                <option key={project} value={project}>
                  {PROJECT_LABELS[project]}
                </option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortKey }))}
              aria-label="Sort submissions"
              className={SELECT_CLASS}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            Showing <span className="text-zinc-300 font-500">{filtered.length}</span> of{" "}
            {submissions.length} submissions
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X size={11} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4">
            <Inbox size={20} className="text-zinc-600" />
          </div>
          <h3 className="font-display text-base font-600 text-zinc-300 mb-2">No matches</h3>
          <p className="text-sm text-zinc-600 mb-5">
            Nothing matches these filters. Try widening the search.
          </p>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-500 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-up animate-fade-up-delay-2">
          {filtered.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </>
  );
}
