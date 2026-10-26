import { describe, expect, test } from "vitest";
import { parseRoster } from "./roster";

describe("parseRoster", () => {
  test("reads spreadsheet rows and skips the header", () => {
    expect(parseRoster("이름\t팀\n가나다\t1팀\n라마바\t2팀\n").rows).toEqual([
      { name: "가나다", team: "1팀" },
      { name: "라마바", team: "2팀" },
    ]);
  });

  test("reads CSV, trims cells, drops blank lines, allows a missing team", () => {
    expect(parseRoster(" 가나다 , 1팀 \r\n\r\n사아자").rows).toEqual([
      { name: "가나다", team: "1팀" },
      { name: "사아자", team: "" },
    ]);
  });

  test("flags the same name in the same team once", () => {
    expect(parseRoster("가나다\t1팀\n가나다\t2팀\n가나다\t1팀\n가나다\t1팀").duplicates).toEqual(["가나다 · 1팀"]);
  });
});
