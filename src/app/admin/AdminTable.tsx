"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import {
  SortableDataTable,
  type DataColumn,
  type SortState,
} from "@/components/arc/sortable-data-table/sortable-data-table";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Select } from "@/components/arc/select/select";
import { Button } from "@/components/arc/button/button";
import { Avatar } from "@/components/arc/avatar/avatar";
import {
  StatusBadge,
  TypeBadge,
  PriorityBadge,
  ProjectBadge,
} from "@/components/shared/Badges";
import AgingBadge from "@/components/admin/AgingBadge";
import BulkActions, { type BulkAction } from "@/components/admin/BulkActions";
import SavedViews from "@/components/admin/SavedViews";
import VoteButton from "@/components/shared/VoteButton";
import { formatDate } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  PROJECT_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
} from "@/lib/labels";
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
import type { SavedViewFilters } from "@/db/views";

/* Rows arrive with vote state attached on the server, so the votes column
   renders from data instead of fetching a summary per row on mount. */
type TableRow = SubmissionWithUser & {
  voteCount?: number;
  hasVoted?: boolean;
};

const PAGE_SIZES = [25, 50, 100];

const ALL = "ALL";

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
  const [filterType, setFilterType] = useState<SubmissionType | typeof ALL>(ALL);
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | typeof ALL>(ALL);
  const [filterPriority, setFilterPriority] = useState<Priority | typeof ALL>(ALL);
  const [filterProject, setFilterProject] = useState<Project | typeof ALL>(ALL);
  const [sort, setSort] = useState<SortState>({ key: "createdAt", direction: "desc" });
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((s) => {
      if (filterType !== ALL && s.type !== filterType) return false;
      if (filterStatus !== ALL && s.status !== filterStatus) return false;
      if (filterPriority !== ALL && s.priority !== filterPriority) return false;
      if (filterProject !== ALL && s.project !== filterProject) return false;
      if (
        query &&
        !s.title.toLowerCase().includes(query) &&
        !s.user.name.toLowerCase().includes(query) &&
        !s.user.email.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, search, filterType, filterStatus, filterPriority, filterProject]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => filtered.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [filtered, safePage, pageSize],
  );

  /* Any change to the result set can leave the current page past the end, which
     is why the page resets on the filters but not on the sort. */
  useEffect(() => {
    setPage(0);
  }, [search, filterType, filterStatus, filterPriority, filterProject]);

  const currentFilters: SavedViewFilters = useMemo(
    () => ({
      search: search || undefined,
      type: filterType !== ALL ? filterType : undefined,
      status: filterStatus !== ALL ? filterStatus : undefined,
      priority: filterPriority !== ALL ? filterPriority : undefined,
      project: filterProject !== ALL ? filterProject : undefined,
      // Arc's table calls the direction "direction"; the saved-view shape calls it
      // "dir". Translate at the boundary rather than renaming stored filters.
      sort: { key: sort.key, dir: sort.direction },
    }),
    [search, filterType, filterStatus, filterPriority, filterProject, sort],
  );

  const applySavedView = (filters: SavedViewFilters) => {
    setSearch(filters.search ?? "");
    setFilterType((filters.type as SubmissionType) ?? ALL);
    setFilterStatus((filters.status as SubmissionStatus) ?? ALL);
    setFilterPriority((filters.priority as Priority) ?? ALL);
    setFilterProject((filters.project as Project) ?? ALL);
    setSort({
      key: filters.sort?.key ?? "createdAt",
      direction: filters.sort?.dir ?? "desc",
    });
  };

  function exportCSV() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (filterStatus !== ALL) params.set("status", filterStatus);
    if (filterType !== ALL) params.set("type", filterType);
    if (filterPriority !== ALL) params.set("priority", filterPriority);
    if (filterProject !== ALL) params.set("project", filterProject);
    window.location.href = `/api/admin/export?${params.toString()}`;
  }

  const selectedIds = useMemo(() => Array.from(new Set(selected)), [selected]);

  async function handleDispatch(action: BulkAction, value?: string) {
    const ids = selectedIds;
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
          action === "archive" || action === "delete" ? !ids.includes(s.id) : true,
        ),
    );
    setSelected([]);

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
  }

  const columns: DataColumn<TableRow>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (_value, row) => (
        <span className="block max-w-[220px]">
          <span className="line-clamp-1 text-foreground">{row.title}</span>
          {row.attachments.length > 0 && (
            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <Paperclip size={10} aria-hidden />
              {row.attachments.length}
              <span className="sr-only"> attachments</span>
            </span>
          )}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (_value, row) => <TypeBadge type={row.type} />,
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (_value, row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_value, row) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (_value, row) => (
        <span className="flex flex-col gap-1">
          <span className="text-xs text-secondary">
            {formatDate(row.createdAt)}
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            <AgingBadge
              createdAt={row.createdAt}
              dueDate={row.dueDate}
              status={row.status}
              resolvedAt={row.resolvedAt}
            />
            {row.dueDate && (
              <span className="text-xs text-muted">
                due {formatDate(row.dueDate)}
              </span>
            )}
          </span>
        </span>
      ),
    },
    {
      key: "votes",
      label: "Votes",
      render: (_value, row) =>
        row.type === "FEATURE" ? (
          <VoteButton
            submissionId={row.id}
            initialCount={row.voteCount}
            initialHasVoted={row.hasVoted}
            size="sm"
          />
        ) : (
          <span className="text-muted">Not votable</span>
        ),
    },
    {
      key: "project",
      label: "Project",
      sortable: true,
      render: (_value, row) => <ProjectBadge project={row.project} />,
    },
    {
      key: "reporter",
      label: "Reporter",
      render: (_value, row) => (
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar
            name={row.user.name ?? "Unknown"}
            src={row.user.image ?? undefined}
            size="sm"
          />
          <span className="max-w-[120px] truncate text-xs text-secondary">
            {row.user.name}
          </span>
        </span>
      ),
    },
    {
      key: "actions",
      label: "Detail",
      render: (_value, row) => (
        <Link
          href={`/admin/submission/${row.id}`}
          className="text-xs text-accent transition-opacity hover:underline"
        >
          View
          <span className="sr-only"> {row.title}</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-panel border border-border bg-surface">
      {/* Facets */}
      <div className="space-y-3 border-b border-[var(--border-subtle)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[180px] flex-1">
            <SearchField
              label="Search submissions"
              value={search}
              onValueChange={setSearch}
              placeholder="Title, name, or email"
            />
          </div>

          <Select
            label="Type"
            className="min-w-32"
            value={filterType}
            onValueChange={(next) => setFilterType(next as SubmissionType | typeof ALL)}
            options={[
              { value: ALL, label: "All types" },
              ...SUBMISSION_TYPES.map((value) => ({
                value,
                label: TYPE_LABELS[value],
              })),
            ]}
          />
          <Select
            label="Status"
            className="min-w-36"
            value={filterStatus}
            onValueChange={(next) => setFilterStatus(next as SubmissionStatus | typeof ALL)}
            options={[
              { value: ALL, label: "All statuses" },
              ...SUBMISSION_STATUSES.map((value) => ({
                value,
                label: STATUS_LABELS[value],
              })),
            ]}
          />
          <Select
            label="Priority"
            className="min-w-36"
            value={filterPriority}
            onValueChange={(next) => setFilterPriority(next as Priority | typeof ALL)}
            options={[
              { value: ALL, label: "All priorities" },
              ...PRIORITIES.map((value) => ({
                value,
                label: PRIORITY_LABELS[value],
              })),
            ]}
          />
          <Select
            label="Project"
            className="min-w-40"
            value={filterProject}
            onValueChange={(next) => setFilterProject(next as Project | typeof ALL)}
            options={[
              { value: ALL, label: "All projects" },
              ...PROJECTS.map((value) => ({
                value,
                label: PROJECT_LABELS[value],
              })),
            ]}
          />

          <Button variant="secondary" onClick={exportCSV}>
            <Download size={13} aria-hidden />
            Export CSV
          </Button>
        </div>

        <SavedViews filters={currentFilters} onApply={applySavedView} />
      </div>

      {selectedIds.length > 0 && (
        <BulkActions
          count={selectedIds.length}
          onDispatch={handleDispatch}
          onClear={() => setSelected([])}
        />
      )}

      {/* Paging. The table itself does not paginate, so the page window is
          applied above and these controls move that window. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-2">
        <span className="text-xs text-muted">
          Showing {paged.length} of {filtered.length} submissions
        </span>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <label className="flex items-center gap-1.5">
            <span className="text-muted">Rows</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
              className="cursor-pointer rounded-control border border-border bg-surface-muted px-1.5 py-0.5 text-xs text-secondary"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
            Previous
          </Button>
          <span className="tabular-nums">
            Page {safePage + 1} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>

      <SortableDataTable
        rows={paged}
        columns={columns}
        rowKey="id"
        caption="Submissions"
        itemName={{ one: "submission", other: "submissions" }}
        emptyMessage="No submissions match the current filters"
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        defaultSort={sort}
        onSortChange={setSort}
      />
    </div>
  );
}