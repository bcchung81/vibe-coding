import { describe, expect, test } from "vitest";
import { listTopics, parseTopic, topicBody, topicItems } from "./topics";

const card = "# 우산 챙겨?\n\n> 날씨 · 기상청 단기예보 · 난이도 중\n\n| 항목 | 내용 |\n";

describe("parseTopic", () => {
  test("reads the title and the one-line summary", () => {
    expect(parseTopic(card)).toEqual({ title: "우산 챙겨?", summary: "날씨 · 기상청 단기예보 · 난이도 중" });
  });

  test("leaves the summary empty when there is none", () => {
    expect(parseTopic("# 제목\n\n본문\n")).toEqual({ title: "제목", summary: "" });
  });
});

describe("topicBody", () => {
  test("drops the title and summary the band already shows", () => {
    expect(topicBody(card)).toBe("\n| 항목 | 내용 |\n");
  });
});

describe("listTopics", () => {
  const topics = listTopics();

  test("lists the ten topic cards in number order", () => {
    expect(topics.map((t) => t.slug)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
  });

  test("gives every card a title and a summary with its difficulty", () => {
    for (const t of topics) {
      expect(t.title).not.toBe("");
      expect(t.summary).toMatch(/난이도 (하|중)$/);
    }
  });
});

describe("topicItems", () => {
  test("gives the browser number, title and summary only", () => {
    expect(topicItems()[1]).toEqual({ slug: "02", title: "우산 챙겨?", summary: "날씨 · 기상청 단기예보 · 난이도 중" });
  });
});
