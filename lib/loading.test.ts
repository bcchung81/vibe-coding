import { describe, expect, test } from "vitest";
import { settled, stepText } from "./loading";

describe("stepText", () => {
  test("counts the seconds of a running call", () => {
    expect(stepText({ state: "busy", started: 1000 }, 4250)).toEqual({ chip: "호출 중", tone: "next", detail: "3.3초" });
    expect(stepText({ state: "busy", started: 1000 }, 1500, "받는 중").chip).toBe("받는 중");
  });

  test("says what came back and how long it took", () => {
    expect(stepText({ state: "done", count: 359, ms: 5125 }, 0)).toEqual({ chip: "완료", tone: "done", detail: "359곳 · 5.1초" });
    expect(stepText({ state: "done", ms: 800 }, 0).detail).toBe("0.8초");
    expect(stepText({ state: "done", count: 24, ms: 12 }, 0).detail).toBe("24곳 · 0.1초 미만");
  });

  test("names the other outcomes in words, and only failure as a failure", () => {
    expect(stepText({ state: "sample" }, 0)).toMatchObject({ chip: "대체", tone: "todo" });
    expect(stepText({ state: "miss" }, 0).detail).toBe("주소를 찾지 못함");
    expect(stepText({ state: "wait" }, 0).chip).toBe("대기");
    expect(stepText({ state: "fail" }, 0).tone).toBe("fail");
  });
});

describe("settled", () => {
  test("is true only when nothing waits or runs", () => {
    expect(settled({ map: { state: "done" }, emf: { state: "sample" }, wifi: { state: "skip" } })).toBe(true);
    expect(settled({ map: { state: "done" }, emf: { state: "done" }, wifi: { state: "wait" } })).toBe(false);
    expect(settled({ map: { state: "busy" }, emf: { state: "done" }, wifi: { state: "done" } })).toBe(false);
  });
});
