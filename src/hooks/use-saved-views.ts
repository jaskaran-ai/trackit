import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { SavedView } from "@/db/types";
import type { SavedViewFilters } from "@/db/views";

const VIEWS_URL = "/api/admin/views";

/** A stored view with its jsonb filters narrowed to the real filter shape. */
export type SavedViewListItem = Omit<SavedView, "filters"> & {
  filters: SavedViewFilters;
};

/** Saved views are a convenience, so a failed read resolves to an empty list. */
export function useSavedViews() {
  return useQuery({
    queryKey: queryKeys.adminViews,
    queryFn: async () => {
      try {
        const res = await fetch(VIEWS_URL);
        if (!res.ok) return [];
        const data = (await res.json()) as SavedViewListItem[] | null;
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });
}

export function useCreateSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; filters: SavedViewFilters }) => {
      const res = await fetch(VIEWS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Could not save view");
      return (await res.json()) as SavedViewListItem;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<SavedViewListItem[]>(queryKeys.adminViews, (current) =>
        current ? [...current, created] : [created],
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminViews });
    },
  });
}

/** Deletes optimistically and puts the row back if the server says no. */
export function useDeleteSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${VIEWS_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete view");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.adminViews });

      const previous = queryClient.getQueryData<SavedViewListItem[]>(queryKeys.adminViews);
      queryClient.setQueryData<SavedViewListItem[]>(queryKeys.adminViews, (current) =>
        current ? current.filter((view) => view.id !== id) : current,
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.adminViews, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminViews });
    },
  });
}
