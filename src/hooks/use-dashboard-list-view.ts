"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "trackit-dashboard-list-view";

export type DashboardListView = "grid" | "table";

function readView(): DashboardListView {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "table" ? "table" : "grid";
  } catch {
    return "grid";
  }
}

/** Persists grid vs table on this device (localStorage). */
export function useDashboardListView() {
  const [view, setViewState] = useState<DashboardListView>("grid");

  useEffect(() => {
    setViewState(readView());
  }, []);

  const setView = useCallback((next: DashboardListView) => {
    setViewState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / quota */
    }
  }, []);

  return { view, setView };
}
