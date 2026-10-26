import { parseCsv } from "./csv";

// The pre-course survey (docs/05_사전수요조사_초안.md). Keep titles and options in step with that file and the form.
// A CSV column belongs to a question when its header contains `match`; name, 소속 and timestamp columns are never read.
export type Question = { no: number; title: string; match: string; kind: "single" | "multi" | "text"; options: string[]; who?: "day1" | "day2" };

export const QUESTIONS: Question[] = [
  { no: 1, title: "어느 날 참여하나요?", match: "어느 날 참여", kind: "single", options: ["1일차만", "2일차만", "이틀 모두"] },
  { no: 2, title: "업무에서 AI를 주로 어디에 쓰나요?", match: "AI를 주로 어디에", kind: "multi", options: ["문서 작성 · 요약", "자료 조사", "엑셀 · 데이터 정리", "보고서 · 기안 초안", "간단한 자동화 · 스크립트"] },
  { no: 3, title: "교육에서 쓸 코드 에이전트", match: "코드 에이전트를 골라", kind: "single", options: ["Codex", "Claude Code", "Antigravity", "아직 못 정함"] },
  { no: 4, title: "그 에이전트의 구독 상태", match: "구독 상태", kind: "single", options: ["이미 구독 중", "교육 전에 구독할 예정", "아직 모르겠음"] },
  { no: 5, title: "만들어 보고 싶은 보고서 종류", match: "보고서 종류", kind: "single", who: "day2", options: ["정책 · 동향 보고", "현황 · 실태 분석", "검토 보고", "결과 보고", "계획 보고"] },
  { no: 6, title: "이미 익숙해서 짧게 넘어가도 되는 것", match: "짧게 넘어가도", kind: "multi", options: ["코드 에이전트 설치 · 로그인", "규칙 파일(AGENTS.md) 쓰기", "스킬 · MCP 붙이기", "GitHub에 올리기", "웹사이트 배포", "해당 없음"] },
  { no: 7, title: "만들어 보고 싶은 웹앱 주제", match: "웹앱 주제 중", kind: "multi", who: "day1", options: ["버스 몇 분?", "우산 챙겨?", "숨쉬기 괜찮아?", "이거 몇 칼로리?", "약 설명서 쉽게", "밤에 여는 소아과", "새 가족 찾기", "이번 주말 축제", "우리 동네 실거래가", "오늘 장바구니 시세"] },
  { no: 8, title: "AI에게 맡기고 싶은 반복 업무", match: "반복하는 일", kind: "text", options: [] },
  { no: 9, title: "교육 전에 걱정되거나 도움이 필요한 것", match: "걱정되거나", kind: "multi", options: ["설치 · 보안 프로그램 차단", "구독 비용 · 사용 한도", "오류가 났을 때 혼자 고치기", "어떤 자료를 AI에 넣어도 되는지", "특별히 없음"] },
  { no: 10, title: "꼭 듣고 싶은 교육 내용", match: "꼭 듣고 싶은", kind: "text", options: [] },
];

// One respondent's answers by question number, as written in the form
export type Response = Record<string, string>;

export function readSurvey(csv: string): { responses: Response[]; missing: number[] } {
  const [header = [], ...rows] = parseCsv(csv);
  const columns = QUESTIONS.map((q) => header.findIndex((h) => h.replace(/\s+/g, " ").includes(q.match)));
  const responses = rows
    .map((row) => Object.fromEntries(QUESTIONS.flatMap((q, i) => (columns[i] >= 0 && row[columns[i]]?.trim() ? [[String(q.no), row[columns[i]].trim()]] : []))))
    .filter((r) => Object.keys(r).length > 0);
  return { responses, missing: QUESTIONS.filter((_, i) => columns[i] < 0).map((q) => q.no) };
}

export type Day = "all" | "day1" | "day2";

// Question 1 decides the day: 이틀 모두 counts for both days; no answer counts only under 전체
export function attends(r: Response, day: Day) {
  if (day === "all") return true;
  return r["1"] === "이틀 모두" || r["1"] === (day === "day1" ? "1일차만" : "2일차만");
}

export type Tally = { no: number; answered: number; bars: { label: string; n: number }[]; others: string[] };

// Counts per option. An option counts when the answer contains it (Google Forms joins checkboxes with ", ");
// whatever is left over is a 기타 answer, kept as text.
export function tally(responses: Response[], q: Question): Tally {
  const answers = responses.map((r) => r[String(q.no)]).filter((a): a is string => Boolean(a));
  if (q.kind === "text") return { no: q.no, answered: answers.length, bars: [], others: answers };
  const counts = q.options.map(() => 0);
  const others: string[] = [];
  for (const answer of answers) {
    let rest = answer;
    q.options.forEach((option, i) => {
      if (answer.includes(option)) {
        counts[i]++;
        rest = rest.replace(option, "");
      }
    });
    // what is left after the options and the separators, minus the option's own note in brackets (e.g. "(버스 도착)")
    rest = rest.replace(/\([^)]*\)/g, "").replace(/^[\s,]+|[\s,]+$/g, "").replace(/(,\s*)+/g, ", ");
    if (rest) others.push(rest);
  }
  const bars = q.options.map((label, i) => ({ label, n: counts[i] }));
  if (others.length) bars.push({ label: "기타", n: others.length });
  return { no: q.no, answered: answers.length, bars, others };
}
