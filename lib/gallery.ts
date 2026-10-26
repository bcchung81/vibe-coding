export type GalleryItem = { id: number; likes: number; updatedAt: number };
export type SortKey = "likes" | "recent";

// Most liked first (ties: most recent), or most recent first
export function sortGallery<T extends GalleryItem>(items: T[], key: SortKey): T[] {
  return [...items].sort((a, b) => (key === "likes" ? b.likes - a.likes : 0) || b.updatedAt - a.updatedAt);
}

// 추천 1·2·3: the three most liked projects that have at least one like
export function recommended(items: GalleryItem[]): Map<number, number> {
  return new Map(
    sortGallery(items, "likes")
      .filter((item) => item.likes > 0)
      .slice(0, 3)
      .map((item, i) => [item.id, i + 1]),
  );
}
