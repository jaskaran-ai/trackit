"use client";

import { useState } from "react";
import { Bookmark, BookmarkPlus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { SavedViewFilters } from "@/db/views";
import {
  useCreateSavedView,
  useDeleteSavedView,
  useSavedViews,
  type SavedViewListItem as SavedView,
} from "@/hooks/use-saved-views";

export default function SavedViews({
  filters,
  onApply,
}: {
  filters: SavedViewFilters;
  onApply: (filters: SavedViewFilters) => void;
}) {
  const viewsQuery = useSavedViews();
  const createView = useCreateSavedView();
  const deleteView = useDeleteSavedView();

  const views = viewsQuery.data ?? [];
  const loading = viewsQuery.isPending;

  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createView.mutate(
      { name: trimmed, filters },
      {
        onSuccess: () => {
          setName("");
          setNaming(false);
          toast.success("View saved");
        },
        onError: () => toast.error("Could not save view"),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteView.mutate(id, {
      onSuccess: () => toast.success("View deleted"),
      onError: () => toast.error("Could not delete view"),
    });
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
            disabled={createView.isPending || !name.trim()}
            className={cn(
              "cursor-pointer rounded-md p-1 transition-colors",
              createView.isPending || !name.trim()
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
