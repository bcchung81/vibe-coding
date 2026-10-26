import { describe, expect, test } from "vitest";
import { isTopicSlug, movePick, topTopics } from "./topic-counts";

describe("isTopicSlug", () => {
  test("takes a two-digit card number only", () => {
    expect(isTopicSlug("03")).toBe(true);
    expect(isTopicSlug("3")).toBe(false);
    expect(isTopicSlug("03; drop")).toBe(false);
    expect(isTopicSlug(3)).toBe(false);
    expect(isTopicSlug(null)).toBe(false);
  });
});

describe("topTopics", () => {
  test("names the most picked topic, every one on a tie, and none before anyone picks", () => {
    expect(topTopics({ "01": 2, "03": 5, "07": 1 })).toEqual(["03"]);
    expect(topTopics({ "07": 4, "02": 4, "05": 1 })).toEqual(["02", "07"]);
    expect(topTopics({})).toEqual([]);
    expect(topTopics({ "01": 0 })).toEqual([]);
  });
});

describe("movePick", () => {
  test("moves one count from the old pick to the new one", () => {
    expect(movePick({ "01": 2, "03": 1 }, "01", "03")).toEqual({ "01": 1, "03": 2 });
    expect(movePick({}, null, "05")).toEqual({ "05": 1 });
    expect(movePick({ "05": 1 }, "05", null)).toEqual({ "05": 0 });
  });

  test("never goes below zero and leaves a repeated pick alone", () => {
    expect(movePick({}, "01", "02")).toEqual({ "02": 1 });
    const same = { "02": 3 };
    expect(movePick(same, "02", "02")).toBe(same);
  });
});
