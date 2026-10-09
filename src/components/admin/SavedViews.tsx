"use client";

import { useState } from "react";
import { Bookmark, BookmarkPlus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import type { SavedViewFilters } from "@/db/views";
import {
  useCreateSavedView,
  useDeleteSavedView,
  useSavedViews,
} from "@/hooks/use-saved-views";

/**
 * Named filter presets. Creating one is a foreground action, so it is confirmed
 * in place; deleting one is a destructive action on a row that will not come
 * back, so it asks before it removes rather than after.
 */
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
        onError: () => toast.error("Could not save the view"),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteView.mutate(id, {
      onSuccess: () => toast.success("View deleted"),
      onError: () => toast.error("Could not delete the view"),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="hidden text-xs text-muted sm:inline">Saved</span>

      {loading ? (
        <div className="skeleton h-7 w-16 rounded-control" />
      ) : (
        views.map((view) => (
          <span
            key={view.id}
            className="inline-flex items-center rounded-control border border-border bg-surface-muted"
          >
            <button
              type="button"
              onClick={() => onApply(view.filters)}
              className="flex cursor-pointer items-center gap-1 py-1 pl-2 pr-1.5 text-xs text-secondary transition-colors hover:text-foreground"
            >
              <Bookmark size={11} aria-hidden />
              {view.name}
            </button>
            {/* The control is icon only, so its resting label is the accessible
                name. There is no `aria-label` prop to reach for. */}
            <ConfirmMorph
              className="mr-1.5"
              label={<span className="sr-only">Delete</span>}
              icon={<Trash2 size={11} aria-hidden />}
              prompt={`Delete "${view.name}"?`}
              confirmLabel="Delete"
              onConfirm={() => handleDelete(view.id)}
            />
          </span>
        ))
      )}

      {naming ? (
        <form
          className="flex items-end gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <Input
            autoFocus
            label="View name"
            className="w-36"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Open bugs"
          />
          <Button
            type="submit"
            size="sm"
            loading={createView.isPending}
            disabled={!name.trim()}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setNaming(false);
              setName("");
            }}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setNaming(true)}>
          <BookmarkPlus size={12} aria-hidden />
          Save view
        </Button>
      )}
    </div>
  );
}