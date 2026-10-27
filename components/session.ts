"use client";

import { useEffect, useState } from "react";

export type Who = { student: { name: string; team: string } | null; admin: boolean };

const EVENT = "vibe-session";

// Call after logging in or out, so the top bar asks again
export function sessionChanged() {
  window.dispatchEvent(new Event(EVENT));
}

// Who is looking (/api/session). null until the first answer; a failed ask counts as just looking around.
export function useWho() {
  const [who, setWho] = useState<Who | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/session", { cache: "no-store" })
        .then((r) => r.json())
        .then((data: Who) => alive && setWho(data))
        .catch(() => alive && setWho({ student: null, admin: false }));
    load();
    window.addEventListener(EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, load);
    };
  }, []);
  return who;
}
