// Live topic picks — shared by the browser and the server, so no file system here (lib/topics.ts reads the cards).
export type Counts = Record<string, number>;

// A pick sent by the browser: a two-digit card number
export function isTopicSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^\d{2}$/.test(slug);
}

// The most picked topics right now (ties all count); none until someone picks
export function topTopics(counts: Counts): string[] {
  const max = Math.max(0, ...Object.values(counts));
  return max > 0 ? Object.keys(counts).filter((slug) => counts[slug] === max).sort() : [];
}

// My own pick shows at once, before the next poll brings the server's count
export function movePick(counts: Counts, from: string | null, to: string | null): Counts {
  if (from === to) return counts;
  const next = { ...counts };
  if (from && next[from]) next[from] -= 1;
  if (to) next[to] = (next[to] ?? 0) + 1;
  return next;
}
