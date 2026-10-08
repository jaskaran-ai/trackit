import { isServer, QueryClient } from "@tanstack/react-query";

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

/**
 * Every query key in the app lives here so a hook and the invalidation that
 * follows it can never drift apart. No hook should build an inline key.
 */
export const queryKeys = {
  notifications: {
    /** Prefix root, matches every notification query. */
    all: ["notifications"] as const,
    /** The bell's summary payload: rows plus the unread count. */
    list: ["notifications", "list"] as const,
  },
  preferences: ["preferences"] as const,
  adminViews: ["admin", "views"] as const,
  archived: ["admin", "archived"] as const,
  comments: (submissionId: string) => ["comments", submissionId] as const,
  history: (submissionId: string) => ["history", submissionId] as const,
  submissions: {
    /** Prefix root, matches every submissions query. */
    all: ["submissions"] as const,
    /** Debounced duplicate lookup used by the submit page. */
    search: (query: string) => ["submissions", "search", query] as const,
  },
} as const;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Short enough that a stale badge corrects itself, long enough that
        // navigating between pages does not refetch everything.
        staleTime: STALE_TIME,
        // Unmounted caches are dropped after five minutes.
        gcTime: GC_TIME,
        // Polls and explicit refetches already cover freshness, and focus
        // refetches thundering-herd on every tab switch.
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * The server renders each request with its own client so nothing leaks between
 * users, while the browser keeps one stable client for the lifetime of the tab.
 */
export function getQueryClient() {
  if (isServer) return createQueryClient();

  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}
