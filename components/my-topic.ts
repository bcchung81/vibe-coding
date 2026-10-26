import { pickTopic } from "../app/actions";

// The web app topic this browser picked. A logged-in pick is also saved in the database, where the live counts come from.
const KEY = "vibe-topic";

export function myTopic(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setMyTopic(slug: string | null): string | null {
  try {
    if (slug) localStorage.setItem(KEY, slug);
    else localStorage.removeItem(KEY);
  } catch {}
  return slug;
}

// Keeps the pick here and, when logged in, on the server. Resolves to whether it counted.
export function chooseTopic(slug: string | null): Promise<boolean> {
  setMyTopic(slug);
  return pickTopic(slug).catch(() => false);
}
