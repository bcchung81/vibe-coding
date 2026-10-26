"use client";

import { useEffect, useState } from "react";
import type { Counts } from "../lib/topic-counts";

// Picks per topic from /api/topics/stats, asked again every 10 seconds while the tab is in view. null until the first answer.
export function useTopicCounts() {
  const [counts, setCounts] = useState<Counts | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/topics/stats")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => alive && data && setCounts(data.counts))
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 10_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);
  return [counts, setCounts] as const;
}
