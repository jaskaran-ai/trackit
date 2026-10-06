"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StatusBadge, TypeBadge, PriorityBadge, ProjectBadge } from "@/components/shared/Badges";
import { formatDate, PROJECT_LABELS } from "@/lib/utils";
import { Search, Paperclip, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { SubmissionWithUser } from "@/types";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";

type SortKey = "createdAt" | "status" | "type" | "priority" | "title";
type SortDir = "asc" | "desc";

export default function AdminTable({ submissions }: { submissions: SubmissionWithUser[] }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<SubmissionType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [filterProject, setFilterProject] = useState<Project | "ALL">("ALL");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "createdAt",
    dir: "desc",
  });

  const filtered = useMemo(() => {
    return submissions
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
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        return dir * String(a[sort.key]).localeCompare(String(b[sort.key]));
      });
  }, [submissions, search, filterType, filterStatus, filterPriority, filterProject, sort]);

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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-zinc-800 flex flex-wrap gap-2">
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

        {(
          [
            {
              label: "Type",
              value: filterType,
              onChange: setFilterType,
              options: ["ALL", "BUG", "FEATURE"],
              display: (o: string) => o === "ALL" ? "All Types" : o,
            },
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: ["ALL", "OPEN", "IN_PROGRESS", "REVIEW", "COMPLETE", "CANCELED"],
              display: (o: string) => o === "ALL" ? "All Statuses" : o.replace("_", " "),
            },
            {
              label: "Priority",
              value: filterPriority,
              onChange: setFilterPriority,
              options: ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
              display: (o: string) => o === "ALL" ? "All Priorities" : o,
            },
            {
              label: "Project",
              value: filterProject,
              onChange: setFilterProject,
              options: ["ALL", "IVALT_MOBILE", "DOCU_ID", "ONDEMAND_ID", "KEYCLOCK", "OTHER"],
              display: (o: string) => o === "ALL" ? "All Projects" : (PROJECT_LABELS[o] ?? o),
            },
          ] as const
        ).map(({ label, value, onChange, options, display }) => (
          <select
            key={label}
            value={value}
            onChange={(e) => onChange(e.target.value as any)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-indigo-500/60 transition-colors"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {display(o)}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* Count */}
      <div className="px-4 py-2 border-b border-zinc-800/50">
        <span className="text-xs text-zinc-600">{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
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
                Project
              </th>
              <th className="text-left text-xs font-500 text-zinc-500 px-4 py-2.5 whitespace-nowrap">
                Reporter
              </th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-zinc-600 text-sm">
                  No submissions match the current filters
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-zinc-800/40 transition-colors group"
                >
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
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500">
                    {formatDate(s.createdAt)}
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
