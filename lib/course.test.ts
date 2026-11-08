import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { checkCourseInfo, INFO_LIMIT, parseOutline, parseParticipation, parsePrep, sectionLines } from "./course";

const outline = readFileSync("docs/00_전체목차.md", "utf8");
const notice = readFileSync("docs/교육생_배포/1_교육전_사전안내/00_사전안내.md", "utf8");

// These read the real documents, so a change in their tables shows up here before it breaks /course
describe("the outline in docs/00_전체목차.md", () => {
  const days = parseOutline(outline);
  test("has both days with their periods in order", () => {
    expect(days.map((d) => d.day)).toEqual([1, 2]);
    expect(days[0].slots.filter((s) => s.period).map((s) => s.period)).toEqual([1, 2, 3, 4]);
    expect(days[1].slots.filter((s) => s.period).map((s) => s.period)).toEqual([1, 2, 3, 4, 5]);
    expect(days[0].title).toBe("기관 업무 웹앱을 만들어 인터넷에 올린다");
    expect(days[0].hours).toBe("13:30–17:00");
  });
  test("keeps breaks as rows without a period and drops the code marks", () => {
    expect(days[1].slots.some((s) => s.period === null && s.title.includes("점심"))).toBe(true);
    expect(days[0].slots[0].gain).toBe("환경점검결과.md · api-notes.md · api-test.md");
  });
  test("lists the three ways to take part", () => {
    expect(parseParticipation(outline).map((p) => p.who)).toEqual(["1일차만", "2일차만", "이틀 모두"]);
  });
});

describe("the preparation list in 00_사전안내.md", () => {
  const prep = parsePrep(notice);
  test("reads every row with the days it is needed on", () => {
    expect(prep.length).toBeGreaterThanOrEqual(6);
    expect(prep[0]).toMatchObject({ ref: "2-2", label: "GitHub 계정", day1: true, day2: true, section: 2 });
    expect(prep.find((p) => p.ref === "3장")).toMatchObject({ section: 3 });
    expect(prep.find((p) => p.label.includes("setup.ps1"))).toMatchObject({ ref: "3장", day1: true, day2: true });
    expect(prep.find((p) => p.label.includes("GitHub"))?.label).toBe("GitHub 계정");
    expect(prep.find((p) => p.label.includes("공공데이터포털"))).toMatchObject({ day1: true, day2: false });
  });
  test("points each row at a section that exists", () => {
    const lines = sectionLines(notice);
    for (const p of prep) expect(notice.split("\n")[lines[p.section] - 1]).toMatch(new RegExp(`^## ${p.section}\\.`));
  });
});

describe("checkCourseInfo", () => {
  test("keeps the known fields, trimmed, and drops empty ones", () => {
    expect(checkCourseInfo({ when: "  11월 19일  ", place: "", other: "x" })).toEqual({ info: { when: "11월 19일" } });
  });
  test("refuses a field that is too long", () => {
    expect(checkCourseInfo({ contact: "가".repeat(INFO_LIMIT + 1) })).toHaveProperty("error");
  });
});
