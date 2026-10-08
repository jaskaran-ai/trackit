import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { queryKeys } from "@/lib/query-client";

/** Matches DUPLICATE_MIN_CHARS in src/app/submit/page.tsx. */
export const SUBMISSION_SEARCH_MIN_CHARS = 4;

const DEBOUNCE_MS = 400;
const LIMIT = 5;

/** Shape of one possible duplicate, trimmed to what the panel renders. */
export type SubmissionSearchMatch = {
  id: string;
  title: string;
  status: string;
};

/**
 * Debounced duplicate lookup for the submit page's title field.
 *
 * Keystrokes collapse into a single request after 400ms of quiet, and the
 * controller in the ref aborts whichever request is still in flight for older
 * text, so a slow response can never overwrite newer input. placeholderData
 * keeps the previous matches on screen while the next lookup runs, so the
 * panel does not blank out between keystrokes. Short queries never hit the
 * network and resolve to an empty list.
 *
 * NOT WIRED UP YET. src/app/submit/page.tsx still owns its own useEffect
 * duplicate check. To move it over, delete that effect and the local
 * DuplicateMatch type, then in the component do:
 *
 *   const { data: duplicates, isLoading } = useSubmissionSearch(title);
 *
 * `duplicates` already arrives as { id, title, status } rows, so the existing
 * mapping of the API response can go away too. Keep the local
 * `duplicatesDismissed` guard and the "Use this title anyway" button as they
 * are; they are UI state, not request state.
 */
export function useSubmissionSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < SUBMISSION_SEARCH_MIN_CHARS) {
      controllerRef.current = null;
      setDebouncedQuery("");
      return;
    }

    const timer = setTimeout(() => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setDebouncedQuery(trimmed);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      // The text the user is typing over makes any in-flight lookup stale.
      controllerRef.current?.abort();
    };
  }, [query]);

  const trimmed = debouncedQuery.trim();
  const searchEnabled = trimmed.length >= SUBMISSION_SEARCH_MIN_CHARS;

  const searchQuery = useQuery({
    queryKey: queryKeys.submissions.search(searchEnabled ? trimmed : ""),
    enabled: searchEnabled,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const controller = controllerRef.current ?? new AbortController();
      controllerRef.current = controller;

      const res = await fetch(
        `/api/submissions?search=${encodeURIComponent(trimmed)}&limit=${LIMIT}`,
        { signal: controller.signal },
      );
      if (!res.ok) return [];

      const data = (await res.json()) as { submissions?: SubmissionSearchMatch[] | null };
      return data.submissions ?? [];
    },
  });

  return {
    data: searchEnabled ? (searchQuery.data ?? []) : [],
    isLoading: searchEnabled ? searchQuery.isLoading : false,
  };
}
