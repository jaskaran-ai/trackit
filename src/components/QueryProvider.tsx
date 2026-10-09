"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { getQueryClient } from "@/lib/query-client";

/**
 * Owns the QueryClient for the client tree. Built with useState so the server
 * gets a fresh client per request and the browser keeps one stable client
 * across re-renders and navigations.
 *
 * Pages that already fetched data server side seed the cache with
 * `HydrationBoundary` around their client subtree, rather than passing it here:
 * this provider sits in the root layout and cannot see a page's props.
 */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
