import { describe, expect, test } from "vitest";
import { appliesByDefault, canApply, parseTsv, planRoster, readRosterCells } from "./roster";

describe("parseTsv", () => {
  test("splits tabs and lines, and unquotes a cell holding a line break or a quote", () => {
    expect(parseTsv('이름\t팀\r\n가나다\t"1팀\n오전"\n"라""마"\t2팀')).toEqual([
      ["이름", "팀"],
      ["가나다", "1팀\n오전"],
      ['라"마', "2팀"],
    ]);
  });

  test("keeps a quote inside a cell as it is", () => {
    expect(parseTsv('가"나\t1팀')).toEqual([['가"나', "1팀"]]);
  });
});

describe("readRosterCells", () => {
  test("finds the columns by their headings in any order and drops the heading row", () => {
    expect(readRosterCells([["번호", "소속", "성명"], ["1", "1팀", "가나다"], ["2", "", "라마바"]])).toEqual([
      { name: "가나다", team: "1팀" },
      { name: "라마바", team: "" },
    ]);
  });

  test("without headings reads 이름, 팀; cleans spaces and line breaks; drops empty rows", () => {
    expect(readRosterCells([[" 가나다 ", "1팀\n오전"], ["", ""], ["사아자"]])).toEqual([
      { name: "가나다", team: "1팀 오전" },
      { name: "사아자", team: "" },
    ]);
  });
});

describe("planRoster", () => {
  const saved = [
    { name: "가나다", team: "1팀" },
    { name: "라마바", team: "2팀" },
  ];

  test("gives each row a verdict against the saved roster and the rows above", () => {
    const plan = planRoster(
      [
        { name: "사아자", team: "1팀" },
        { name: "가나다", team: "1팀" },
        { name: "라마바", team: "3팀" },
        { name: "사아자", team: "1팀" },
        { name: "", team: "" },
        { name: "", team: "2팀" },
        { name: "가".repeat(21), team: "1팀" },
        { name: "차카타", team: "" },
      ],
      saved,
    );
    expect(plan.map((p) => p?.state ?? null)).toEqual(["new", "exists", "check", "duplicate", null, "error", "error", "new"]);
    expect(plan[2]?.note).toBe("같은 이름이 2팀에도 있습니다");
    expect(plan[3]?.note).toBe("1번 줄과 같습니다");
    expect(plan[7]?.note).toBe("팀 없이 넣습니다");
  });

  test("the same name twice in the paste: the second one is to check", () => {
    expect(planRoster([{ name: "파하", team: "1팀" }, { name: "파하", team: "" }], []).map((p) => p?.note)).toEqual(["", "같은 이름이 1팀에도 있습니다"]);
  });

  test("a saved name without a team is named as 팀 없음", () => {
    expect(planRoster([{ name: "하늘", team: "1팀" }], [{ name: "하늘", team: "" }])[0]?.note).toBe("같은 이름이 팀 없음에도 있습니다");
  });

  test("ticks new rows, lets rows to check be ticked, never skipped ones", () => {
    const [fresh, check, exists] = planRoster([{ name: "새", team: "" }, { name: "가나다", team: "9팀" }, { name: "가나다", team: "1팀" }], saved);
    expect([fresh, check, exists].map(appliesByDefault)).toEqual([true, false, false]);
    expect([fresh, check, exists].map(canApply)).toEqual([true, true, false]);
  });
});
