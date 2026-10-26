// The web app topic this browser picked — a per-viewer convenience until login (S2) can keep it, so failures mean "none yet"
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
