"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { getQueryClient } from "@/lib/query-client";

/**
 * Owns the QueryClient for the client tree. Built with useState so the server
 * gets a fresh client per request and the browser keeps one stable client
 * across re-renders and navigations.
 */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
