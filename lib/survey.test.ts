import { describe, expect, test } from "vitest";
import { attends, QUESTIONS, readSurvey, tally } from "./survey";

const q = (no: number) => QUESTIONS.find((x) => x.no === no)!;
// Header as Google Forms writes it (question titles), with the name and timestamp columns that must not be kept
const CSV = [
  "타임스탬프,이름 · 소속,1. 어느 날 참여하나요?,2. 업무에서 AI를 주로 어디에 쓰나요? 모두 골라 주세요,7. (1일차 참여자) 웹앱 주제 중 만들어 보고 싶은 것을 2개까지 골라 주세요,10. 이 과정에서 꼭 듣고 싶은 교육 내용을 자유롭게 적어 주세요",
  '2026/10/27,가나다 · 기획팀,이틀 모두,"문서 작성 · 요약, 자료 조사","버스 몇 분?(버스 도착), 우산 챙겨?(날씨 예보)",엑셀 자동화',
  '2026/10/27,라마바 · 운영팀,1일차만,"자료 조사, 우리 부서 회계 정리",숨쉬기 괜찮아?(미세먼지),',
  "2026/10/27,사아자 · 총무팀,2일차만,보고서 · 기안 초안,,보고서 양식 맞추기",
].join("\n");

describe("readSurvey", () => {
  test("keeps answers by question number and drops name and time", () => {
    const { responses, missing } = readSurvey(CSV);
    expect(responses).toHaveLength(3);
    expect(responses[0]).toEqual({ "1": "이틀 모두", "2": "문서 작성 · 요약, 자료 조사", "7": "버스 몇 분?(버스 도착), 우산 챙겨?(날씨 예보)", "10": "엑셀 자동화" });
    expect(JSON.stringify(responses)).not.toMatch(/가나다|기획팀|2026\/10\/27/);
    expect(missing).toEqual([3, 4, 5, 6, 8, 9]);
  });
});

describe("attends", () => {
  test("splits respondents by the day they come; both days count for each", () => {
    const { responses } = readSurvey(CSV);
    expect(responses.filter((r) => attends(r, "all"))).toHaveLength(3);
    expect(responses.filter((r) => attends(r, "day1")).map((r) => r["1"])).toEqual(["이틀 모두", "1일차만"]);
    expect(responses.filter((r) => attends(r, "day2")).map((r) => r["1"])).toEqual(["이틀 모두", "2일차만"]);
  });
});

describe("tally", () => {
  const { responses } = readSurvey(CSV);

  test("counts checkbox options and keeps a written-in 기타", () => {
    const t = tally(responses, q(2));
    expect(t.answered).toBe(3);
    expect(t.bars.find((b) => b.label === "자료 조사")?.n).toBe(2);
    expect(t.bars.find((b) => b.label === "기타")).toEqual({ label: "기타", n: 1 });
    expect(t.others).toEqual(["우리 부서 회계 정리"]);
  });

  test("matches an option even with the form's note in brackets", () => {
    const t = tally(responses, q(7));
    expect(t.answered).toBe(2);
    expect(t.bars.filter((b) => b.n > 0).map((b) => b.label)).toEqual(["버스 몇 분?", "우산 챙겨?", "숨쉬기 괜찮아?"]);
    expect(t.others).toEqual([]);
  });

  test("keeps written answers as they are", () => {
    expect(tally(responses, q(10))).toEqual({ no: 10, answered: 2, bars: [], others: ["엑셀 자동화", "보고서 양식 맞추기"] });
  });
});
