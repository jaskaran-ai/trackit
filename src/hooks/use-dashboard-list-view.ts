"use client";

import { useCallback } from "react";
import {
  useLocalStorageValue,
  writeLocalStorage,
} from "@/lib/local-storage-store";

const STORAGE_KEY = "trackit-dashboard-list-view";

export type DashboardListView = "grid" | "table";

function parseView(raw: string | null): DashboardListView {
  return raw === "table" ? "table" : "grid";
}

/** Persists grid vs table on this device (localStorage). */
export function useDashboardListView() {
  const view = useLocalStorageValue(STORAGE_KEY, parseView, "grid");

  const setView = useCallback((next: DashboardListView) => {
    writeLocalStorage(STORAGE_KEY, next);
  }, []);

  return { view, setView };
}
