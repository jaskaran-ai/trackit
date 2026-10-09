"use client";

import { useMemo, useState } from "react";
import { Inbox, LayoutGrid, Table2 } from "lucide-react";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Select } from "@/components/arc/select/select";
import { FilterToolbar, type FilterChip } from "@/components/arc/filter-toolbar/filter-toolbar";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Button } from "@/components/arc/button/button";
import DashboardSubmissionsTable from "@/components/dashboard/DashboardSubmissionsTable";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import SubmissionCard from "@/components/shared/SubmissionCard";
import { useDashboardListView } from "@/hooks/use-dashboard-list-view";
import { PRIORITY_LABELS, PROJECT_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/labels";
import {
  PRIORITIES,
  PROJECTS,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
  type Priority,
  type Project,
  type SubmissionStatus,
  type SubmissionType,
} from "@/db/types";
import type { SubmissionWithUser } from "@/types";

type SortKey = "newest" | "oldest" | "title" | "priority" | "status";

/* Rank comes from the canonical member order, so a status added to the database
   sorts into the sequence instead of falling to the end of every list. */
const STATUS_RANK = new Map(SUBMISSION_STATUSES.map((value, index) => [value, index]));
const PRIORITY_RANK = new Map(PRIORITIES.map((value, index) => [value, index]));

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A to Z" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
];

type Filters = {
  search: string;
  status: string;
  type: string;
  priority: string;
  project: string;
  sort: SortKey;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  type: "",
  priority: "",
  project: "",
  sort: "newest",
};

const FILTER_FIELDS = [
  {
    id: "status",
    label: "Status",
    options: SUBMISSION_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
    read: (value: string) => STATUS_LABELS[value as SubmissionStatus] ?? value,
  },
  {
    id: "type",
    label: "Type",
    options: SUBMISSION_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] })),
    read: (value: string) => TYPE_LABELS[value as SubmissionType] ?? value,
  },
  {
    id: "priority",
    label: "Priority",
    options: PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] })),
    read: (value: string) => PRIORITY_LABELS[value as Priority] ?? value,
  },
  {
    id: "project",
    label: "Project",
    options: PROJECTS.map((value) => ({ value, label: PROJECT_LABELS[value] })),
    read: (value: string) => PROJECT_LABELS[value as Project] ?? value,
  },
] as const;


export default function DashboardFilters({
  submissions,
}: {
  submissions: SubmissionWithUser[];
}) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const { view, setView } = useDashboardListView();

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

    const time = (value: SubmissionWithUser["createdAt"]) =>
      new Date(value).getTime();

    return [...rows].sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return time(a.createdAt) - time(b.createdAt);
        case "title":
          return a.title.localeCompare(b.title);
        case "priority":
          return (
            (PRIORITY_RANK.get(a.priority) ?? 99) -
              (PRIORITY_RANK.get(b.priority) ?? 99) ||
            time(b.createdAt) - time(a.createdAt)
          );
        case "status":
          return (
            (STATUS_RANK.get(a.status) ?? 99) -
              (STATUS_RANK.get(b.status) ?? 99) ||
            time(b.createdAt) - time(a.createdAt)
          );
        case "newest":
        default:
          return time(b.createdAt) - time(a.createdAt);
      }
    });
  }, [submissions, filters]);

  /* Only the facet filters become chips. The search text and the sort order are
     not a filter and showing them as removable chips reads as if they were. */
  const activeChips: FilterChip[] = FILTER_FIELDS.flatMap((field) => {
    const value = filters[field.id] as string;
    // Each field's chip reads "Critical", not "CRITICAL".
    return value ? [{ id: field.id, label: field.label, value: field.read(value) }] : [];
  });

  const isFiltered =
    filters.search.trim() !== "" || activeChips.length > 0;

  return (
    <>
      <div className="mb-3 rounded-panel border border-border bg-surface p-3 sm:p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <SearchField
              label="Search submissions"
              value={filters.search}
              onValueChange={(search) => setFilters((f) => ({ ...f, search }))}
              placeholder="Search by title"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              label="Status"
              className="min-w-36"
              value={filters.status}
              placeholder="All statuses"
              onValueChange={(status) => setFilters((f) => ({ ...f, status }))}
              options={[
                { value: "", label: "All statuses" },
                ...SUBMISSION_STATUSES.map((value) => ({
                  value,
                  label: STATUS_LABELS[value],
                })),
              ]}
            />
            <Select
              label="Type"
              className="min-w-32"
              value={filters.type}
              placeholder="All types"
              onValueChange={(type) => setFilters((f) => ({ ...f, type }))}
              options={[
                { value: "", label: "All types" },
                ...Object.entries(TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <Select
              label="Priority"
              className="min-w-36"
              value={filters.priority}
              placeholder="All priorities"
              onValueChange={(priority) => setFilters((f) => ({ ...f, priority }))}
              options={[
                { value: "", label: "All priorities" },
                ...PRIORITIES.map((value) => ({
                  value,
                  label: PRIORITY_LABELS[value],
                })),
              ]}
            />
            <Select
              label="Project"
              className="min-w-40"
              value={filters.project}
              placeholder="All projects"
              onValueChange={(project) => setFilters((f) => ({ ...f, project }))}
              options={[
                { value: "", label: "All projects" },
                ...PROJECTS.map((value) => ({
                  value,
                  label: PROJECT_LABELS[value],
                })),
              ]}
            />
            <Select
              label="Sort"
              className="min-w-36"
              value={filters.sort}
              onValueChange={(sort) =>
                setFilters((f) => ({ ...f, sort: sort as SortKey }))
              }
              options={SORT_OPTIONS}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-[var(--border-subtle)] pt-3">
          <p className="text-xs text-muted">
            Showing <span className="font-500 text-secondary">{filtered.length}</span>{" "}
            of {submissions.length} submissions
          </p>

          <SegmentedControl
            className="ml-auto shrink-0"
            label="Layout"
            value={view}
            onValueChange={(next) => setView(next as "grid" | "table")}
            options={[
              {
                value: "grid",
                label: "Grid",
                accessory: <LayoutGrid size={13} aria-hidden className="ml-1.5 inline" />,
              },
              {
                value: "table",
                label: "Table",
                accessory: <Table2 size={13} aria-hidden className="ml-1.5 inline" />,
              },
            ]}
          />

          {activeChips.length > 0 && (
            <div className="min-w-0 w-full basis-full sm:w-auto sm:flex-1">
              <FilterToolbar
                filters={activeChips}
                onRemove={(id) =>
                  setFilters((f) => ({ ...f, [id]: "" }))
                }
                onClearAll={() =>
                  setFilters((f) => ({
                    ...EMPTY_FILTERS,
                    search: f.search,
                    sort: f.sort,
                  }))
                }
              />
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-panel border border-border bg-surface">
          <EmptyState
            className="py-12"
            icon={<Inbox size={20} aria-hidden />}
            title="No matches"
            description="Nothing matches these filters. Try widening the search."
            action={
              <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        </div>
      ) : view === "table" ? (
        <DashboardSubmissionsTable submissions={filtered} />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {filtered.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </>
  );
}