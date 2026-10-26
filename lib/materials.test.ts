import { describe, expect, test } from "vitest";
import { guideItems, listMaterials, slugOf, stageOf } from "./materials";

describe("stageOf", () => {
  test("splits the step number from the folder title", () => {
    expect(stageOf("1_교육전_사전안내")).toEqual({ stage: "1", title: "교육전 사전안내" });
  });

  test("ignores folders without a step number", () => {
    expect(stageOf("참고")).toBeNull();
  });
});

describe("slugOf", () => {
  test.each([
    ["00_사전안내.md", "00"],
    ["AGENTS.global.md", "AGENTS.global"],
    ["setup.ps1", "setup"],
  ])("%s → %s", (name, slug) => {
    expect(slugOf(name)).toBe(slug);
  });
});

describe("listMaterials", () => {
  const items = listMaterials();

  test("finds the handouts in step order with markdown titles", () => {
    const guide = items.find((m) => m.stage === "1" && m.slug === "00");
    expect(guide).toMatchObject({ kind: "doc", name: "00_사전안내.md", title: "바이브코딩 중급교육 — 사전 안내" });
    expect(items[0].stage).toBe("1");
  });

  test("offers non-markdown files as downloads", () => {
    expect(items.find((m) => m.name === "setup.ps1")).toMatchObject({ stage: "2", slug: "setup", kind: "file", title: "설치 스크립트" });
  });

  test("uses a plain label where the heading is a file name", () => {
    expect(items.find((m) => m.name === "AGENTS.global.md")).toMatchObject({ title: "AI 에이전트 공통 규칙", short: "공통 규칙" });
  });

  test("puts the day 2 report tool hand-off in its own step", () => {
    expect(items.find((m) => m.name === "00_보고서도구.md")).toMatchObject({ stage: "3", stageTitle: "2일차 당일", slug: "00", kind: "doc", short: "보고서 도구 설치" });
  });

  test("gives every handout a short name for the next-step band", () => {
    expect(items.find((m) => m.stage === "1" && m.slug === "00")?.short).toBe("사전 안내");
  });
});

describe("guideItems", () => {
  test("keys each handout by stage/slug, the way the reading state remembers it, and leaves out the file path", () => {
    const guide = guideItems().find((m) => m.key === "1/00");
    expect(guide).toMatchObject({ stage: "1", short: "사전 안내", kind: "doc" });
    expect(guide).not.toHaveProperty("path");
  });
});
