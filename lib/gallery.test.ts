import { describe, expect, test } from "vitest";
import { recommended, sortGallery } from "./gallery";

const items = [
  { id: 1, likes: 3, updatedAt: 10 },
  { id: 2, likes: 7, updatedAt: 20 },
  { id: 3, likes: 3, updatedAt: 30 },
  { id: 4, likes: 0, updatedAt: 40 },
];

describe("sortGallery", () => {
  test("most liked first, ties broken by the newer one", () => {
    expect(sortGallery(items, "likes").map((i) => i.id)).toEqual([2, 3, 1, 4]);
  });

  test("newest first", () => {
    expect(sortGallery(items, "recent").map((i) => i.id)).toEqual([4, 3, 2, 1]);
  });
});

describe("recommended", () => {
  test("ranks the top three", () => {
    expect([...recommended(items)]).toEqual([
      [2, 1],
      [3, 2],
      [1, 3],
    ]);
  });

  test("skips projects nobody liked", () => {
    expect([...recommended([{ id: 9, likes: 0, updatedAt: 1 }])]).toEqual([]);
  });
});
