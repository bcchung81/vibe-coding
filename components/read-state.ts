// Which handouts this browser has opened — a per-viewer convenience, so failures just mean "nothing read yet"
const KEY = "vibe-read";

export function readKeys(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function markRead(key: string): string[] {
  const keys = [...new Set([...readKeys(), key])];
  try {
    localStorage.setItem(KEY, JSON.stringify(keys));
  } catch {}
  return keys;
}
