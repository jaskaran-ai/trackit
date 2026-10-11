"use client";

import { useSyncExternalStore } from "react";

const CHANGE_EVENT = "trackit:local-storage";

/**
 * Values written this session. Used when localStorage is unavailable (private
 * mode, storage disabled) so the UI still reflects the user's choice.
 */
const memory = new Map<string, string>();

export function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export function writeLocalStorage(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is optional; the in-memory copy above still holds the value.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Reads a localStorage value without a set-state-in-effect round trip.
 * The server and the first client render both use `fallback`, so hydration
 * matches; React then re-renders with the stored value.
 *
 * `parse` must return primitives so the snapshot stays referentially stable.
 */
export function useLocalStorageValue<T extends string>(
  key: string,
  parse: (raw: string | null) => T,
  fallback: T,
): T {
  return useSyncExternalStore(
    subscribe,
    () => parse(readLocalStorage(key)),
    () => fallback,
  );
}
