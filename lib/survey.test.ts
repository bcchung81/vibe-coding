import { describe, expect, test } from "vitest";
import { asked, attends, checkAnswers, QUESTIONS, tally, toDraft, type Draft, type Response } from "./survey";

const q = (no: number) => QUESTIONS.find((x) => x.no === no)!;

// A full answer sheet for someone who comes both days; each test changes only what it checks
const full = (): Draft => ({
  "1": { picked: ["이틀 모두"], text: "" },
  "2": { picked: ["자료 조사", "문서 작성 · 요약"], text: "회의록 정리" },
  "3": { picked: ["Codex"], text: "" },
  "4": { picked: ["이미 구독 중"], text: "" },
  "5": { picked: ["검토 보고"], text: "" },
  "6": { picked: ["해당 없음"], text: "" },
  "7": { picked: ["우산 챙겨?", "버스 몇 분?"], text: "" },
  "8": { picked: [], text: "" },
  "9": { picked: ["특별히 없음"], text: "" },
  "10": { picked: [], text: "  엑셀 자동화  " },
});

describe("checkAnswers", () => {
  test("keeps options in form order, then the written-in 기타; trims written answers; skips an empty optional one", () => {
    const r = checkAnswers(full());
    expect("answers" in r && r.answers).toEqual({
      "1": ["이틀 모두"],
      "2": ["문서 작성 · 요약", "자료 조사", "회의록 정리"],
      "3": ["Codex"],
      "4": ["이미 구독 중"],
      "5": ["검토 보고"],
      "6": ["해당 없음"],
      "7": ["버스 몇 분?", "우산 챙겨?"],
      "9": ["특별히 없음"],
      "10": ["엑셀 자동화"],
    });
  });

  test("drops the other day's question, even if it was answered before question 1 changed", () => {
    const d = full();
    d["1"].picked = ["2일차만"];
    const r = checkAnswers(d);
    expect("answers" in r && Object.keys(r.answers)).not.toContain("7");
    expect("answers" in r && r.answers["5"]).toEqual(["검토 보고"]);
  });

  test("names the first question that needs fixing", () => {
    const cases: [(d: Draft) => void, number, RegExp][] = [
      [(d) => (d["1"].picked = []), 1, /답해 주세요/],
      [(d) => (d["5"].picked = []), 5, /답해 주세요/],
      [(d) => (d["3"].picked = ["Codex", "Claude Code"]), 3, /하나만/],
      [(d) => (d["7"].picked = ["버스 몇 분?", "우산 챙겨?", "새 가족 찾기"]), 7, /2개까지/],
      [(d) => (d["6"].picked = ["해당 없음", "GitHub에 올리기"]), 6, /함께 고르지 않습니다/],
      [(d) => (d["9"] = { picked: ["특별히 없음"], text: "노트북이 느림" }), 9, /함께 고르지 않습니다/],
      [(d) => (d["4"].picked = ["<script>"]), 4, /없는 선택지/],
      [(d) => (d["10"].text = "가".repeat(301)), 10, /300자/],
    ];
    for (const [change, no, message] of cases) {
      const d = full();
      change(d);
      const r = checkAnswers(d);
      expect(r).toMatchObject({ no });
      expect("error" in r && r.error).toMatch(message);
    }
  });

  test("turns anything that is not a draft into a missing answer", () => {
    expect(checkAnswers(null)).toMatchObject({ no: 1 });
    expect(checkAnswers({ "1": { picked: "이틀 모두" } })).toMatchObject({ no: 1 });
  });
});

describe("asked", () => {
  test("shows a day question until question 1 says the person does not come that day", () => {
    const d = full();
    expect(asked(q(7), { ...d, "1": { picked: [], text: "" } })).toBe(true);
    expect(asked(q(7), { ...d, "1": { picked: ["2일차만"], text: "" } })).toBe(false);
    expect(asked(q(5), { ...d, "1": { picked: ["2일차만"], text: "" } })).toBe(true);
    expect(asked(q(2), { ...d, "1": { picked: ["1일차만"], text: "" } })).toBe(true);
  });
});

describe("toDraft", () => {
  test("puts saved answers back into the form unchanged", () => {
    const r = checkAnswers(full());
    if (!("answers" in r)) throw new Error(r.error);
    const again = checkAnswers(toDraft(r.answers));
    expect(again).toEqual(r);
    expect(toDraft(null)["2"]).toEqual({ picked: [], text: "" });
  });
});

const responses: Response[] = [
  { "1": ["이틀 모두"], "2": ["문서 작성 · 요약", "자료 조사"], "10": ["엑셀 자동화"] },
  { "1": ["1일차만"], "2": ["자료 조사", "우리 부서 회계 정리"] },
  { "1": ["2일차만"], "2": ["보고서 · 기안 초안"], "10": ["보고서 양식 맞추기"] },
];

describe("attends", () => {
  test("splits respondents by the day they come; both days count for each", () => {
    expect(responses.filter((r) => attends(r, "all"))).toHaveLength(3);
    expect(responses.filter((r) => attends(r, "day1")).map((r) => r["1"][0])).toEqual(["이틀 모두", "1일차만"]);
    expect(responses.filter((r) => attends(r, "day2")).map((r) => r["1"][0])).toEqual(["이틀 모두", "2일차만"]);
  });
});

describe("tally", () => {
  test("counts options and keeps a written-in 기타, even one that contains an option's words", () => {
    const t = tally([...responses, { "1": ["1일차만"], "2": ["자료 조사 결과 요약"] }], q(2));
    expect(t.answered).toBe(4);
    expect(t.bars.find((b) => b.label === "자료 조사")?.n).toBe(2);
    expect(t.bars.find((b) => b.label === "기타")).toEqual({ label: "기타", n: 2 });
    expect(t.others).toEqual(["우리 부서 회계 정리", "자료 조사 결과 요약"]);
  });

  test("keeps written answers as they are", () => {
    expect(tally(responses, q(10))).toEqual({ no: 10, answered: 2, bars: [], others: ["엑셀 자동화", "보고서 양식 맞추기"] });
  });
});
