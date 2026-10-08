"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkPlus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { SavedViewFilters } from "@/db/views";

type SavedView = {
  id: string;
  name: string;
  filters: SavedViewFilters;
};

export default function SavedViews({
  filters,
  onApply,
}: {
  filters: SavedViewFilters;
  onApply: (filters: SavedViewFilters) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/views");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as SavedView[];
      setViews(Array.isArray(data) ? data : []);
    } catch {
      // Saved views are a convenience — silence failures.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, filters }),
      });
      if (!res.ok) throw new Error();
      const created = (await res.json()) as SavedView;
      setViews((prev) => [...prev, created]);
      setName("");
      setNaming(false);
      toast.success("View saved");
    } catch {
      toast.error("Could not save view");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = views;
    setViews((prev) => prev.filter((v) => v.id !== id));
    try {
      const res = await fetch(`/api/admin/views/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("View deleted");
    } catch {
      setViews(previous);
      toast.error("Could not delete view");
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] text-zinc-600 hidden sm:inline">Saved</span>

      {loading ? (
        <div className="h-6 w-16 rounded-lg bg-zinc-800 animate-pulse" />
      ) : (
        views.map((view) => (
          <span
            key={view.id}
            className="group inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 pl-2 pr-1 py-1 text-xs text-zinc-300"
          >
            <button
              type="button"
              onClick={() => onApply(view.filters)}
              className="flex cursor-pointer items-center gap-1 transition-colors hover:text-white"
            >
              <Bookmark size={11} />
              {view.name}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(view.id)}
              aria-label={`Delete ${view.name}`}
              className="ml-0.5 cursor-pointer text-zinc-600 transition-colors hover:text-red-400"
            >
              <X size={12} />
            </button>
          </span>
        ))
      )}

      {naming ? (
        <span className="inline-flex items-center gap-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setNaming(false);
                setName("");
              }
            }}
            placeholder="View name"
            className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-indigo-500/60"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className={cn(
              "cursor-pointer rounded-md p-1 transition-colors",
              saving || !name.trim()
                ? "text-zinc-600"
                : "text-emerald-400 hover:text-emerald-300"
            )}
            aria-label="Save view"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              setNaming(false);
              setName("");
            }}
            className="cursor-pointer rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label="Cancel"
          >
            <X size={13} />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setNaming(true)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          <BookmarkPlus size={12} />
          Save view
        </button>
      )}
    </div>
  );
}
