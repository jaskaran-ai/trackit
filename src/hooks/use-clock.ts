"use client";

import { useEffect, useState } from "react";

/**
 * The current time for labels like "2m ago", or null until the client mounts.
 *
 * `Date.now()` cannot run during render: the server and the browser disagree,
 * and React treats an impure render as a bug. The first reading is taken in a
 * timeout right after mount, so the server and first client render both see null.
 * With `tickMs` set, the clock re-reads on that interval. With null it is read
 * once and never refreshed.
 */
export function useClock(tickMs: number | null): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const read = () => setNow(Date.now());
    const first = setTimeout(read, 0);
    const timer = tickMs === null ? null : setInterval(read, tickMs);
    return () => {
      clearTimeout(first);
      if (timer !== null) clearInterval(timer);
    };
  }, [tickMs]);

  return now;
}
