// The web app topic this browser picked — kept here only (the hub has no trainee login).
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
