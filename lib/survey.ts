// The pre-course survey (docs/05_사전수요조사_초안.md). Trainees answer it in the hub (/survey/answer); keep questions and options in step with that file.
// `ask` is the question on the form, `title` the short heading on the results. `notes` sit beside an option on the form and are not stored.
export type Question = {
  no: number;
  ask: string;
  title: string;
  kind: "single" | "multi" | "text";
  options: string[];
  notes?: string[];
  required: boolean; // for `who` questions: required of the people who come that day
  who?: "day1" | "day2";
  max?: number; // most options one can pick
  other?: boolean; // a written-in 기타 after the options
  alone?: string; // an option that cannot go with any other (해당 없음)
  example?: string;
};

export const QUESTIONS: Question[] = [
  { no: 1, ask: "어느 날 참여하나요?", title: "어느 날 참여하나요?", kind: "single", required: true, options: ["1일차만", "2일차만", "이틀 모두"] },
  { no: 2, ask: "업무에서 AI를 주로 어디에 쓰나요? 모두 골라 주세요", title: "업무에서 AI를 주로 어디에 쓰나요?", kind: "multi", required: true, other: true, options: ["문서 작성 · 요약", "자료 조사", "엑셀 · 데이터 정리", "보고서 · 기안 초안", "간단한 자동화 · 스크립트"] },
  { no: 3, ask: "교육에서 쓸 코드 에이전트를 골라 주세요", title: "교육에서 쓸 코드 에이전트", kind: "single", required: true, options: ["Codex", "Claude Code", "Antigravity", "아직 못 정함"], notes: ["ChatGPT Plus 이상", "Claude Pro 이상", "Google AI Pro 이상"] },
  { no: 4, ask: "그 에이전트의 구독 상태는?", title: "그 에이전트의 구독 상태", kind: "single", required: true, options: ["이미 구독 중", "교육 전에 구독할 예정", "아직 모르겠음"] },
  { no: 5, ask: "보고서 실습에서 만들어 보고 싶은 보고서 종류는?", title: "만들어 보고 싶은 보고서 종류", kind: "single", required: true, who: "day2", options: ["계획 보고", "검토 보고", "결과 보고", "동향 보고"], notes: ["사업 · 행사", "비교 · 조사", "회의 · 행사 · 출장", "정책 · 현황"] },
  { no: 6, ask: "이미 익숙해서 짧게 넘어가도 되는 것을 모두 골라 주세요", title: "이미 익숙해서 짧게 넘어가도 되는 것", kind: "multi", required: true, alone: "해당 없음", options: ["코드 에이전트 설치 · 로그인", "규칙 파일(AGENTS.md) 쓰기", "스킬 · MCP 붙이기", "GitHub에 올리기", "웹사이트 배포", "해당 없음"], notes: ["", "", "", "", "Vercel 등"] },
  { no: 7, ask: "웹앱 주제 중 만들어 보고 싶은 것을 2개까지 골라 주세요", title: "만들어 보고 싶은 웹앱 주제", kind: "multi", required: true, who: "day1", max: 2, options: ["버스 몇 분?", "우산 챙겨?", "숨쉬기 괜찮아?", "이거 몇 칼로리?", "약 설명서 쉽게", "밤에 여는 소아과", "새 가족 찾기", "이번 주말 축제", "우리 동네 실거래가", "오늘 장바구니 시세"], notes: ["버스 도착", "날씨 예보", "미세먼지", "식품 영양", "의약품 정보", "병·의원 찾기", "구조동물", "관광 · 행사", "아파트 매매가", "농산물 가격"] },
  { no: 8, ask: "내 업무에서 매주 · 매달 반복하는 일 중 AI에게 맡기고 싶은 것이 있으면 적어 주세요 (내부자료 · 개인정보는 적지 마세요)", title: "AI에게 맡기고 싶은 반복 업무", kind: "text", required: false, options: [], example: "예: 매주 같은 엑셀 표 정리, 민원 유형별 안내 찾기" },
  { no: 9, ask: "교육 전에 걱정되거나 도움이 필요한 것을 모두 골라 주세요", title: "교육 전에 걱정되거나 도움이 필요한 것", kind: "multi", required: true, other: true, alone: "특별히 없음", options: ["설치 · 보안 프로그램 차단", "구독 비용 · 사용 한도", "오류가 났을 때 혼자 고치기", "어떤 자료를 AI에 넣어도 되는지", "특별히 없음"] },
  { no: 10, ask: "이 과정에서 꼭 듣고 싶은 교육 내용을 자유롭게 적어 주세요", title: "꼭 듣고 싶은 교육 내용", kind: "text", required: true, options: [], example: "예: 우리 부서 엑셀 업무에 바로 쓰는 법, 만든 앱을 동료와 같이 쓰는 법" },
];

export const TEXT_LIMIT = 300;

// One trainee's answers by question number: the options picked in form order, then the written-in 기타; a written question holds its one answer
export type Response = Record<string, string[]>;

// What the form holds while answering: picked options, and the 기타 box or the written answer
export type Draft = Record<string, { picked: string[]; text: string }>;

export type Day = "all" | "day1" | "day2";

// Question 1 decides the day: 이틀 모두 counts for both days; no answer counts only under 전체
export function attends(r: Response, day: Day) {
  if (day === "all") return true;
  const first = r["1"]?.[0];
  return first === "이틀 모두" || first === (day === "day1" ? "1일차만" : "2일차만");
}

// A day question shows until question 1 says the person does not come that day
export function asked(q: Question, draft: Draft) {
  const day = draft["1"]?.picked[0];
  return !q.who || !day || attends({ "1": [day] }, q.who);
}

// The trainee's answers once they pass the same checks the server makes; the form shows the first problem at its question
export function checkAnswers(input: unknown): { answers: Response } | { error: string; no: number } {
  const draft = (input && typeof input === "object" ? input : {}) as Record<string, { picked?: unknown; text?: unknown } | undefined>;
  const day = Array.isArray(draft["1"]?.picked) ? draft["1"].picked[0] : undefined;
  const answers: Response = {};
  for (const q of QUESTIONS) {
    if (q.who && !attends({ "1": [String(day)] }, q.who)) continue;
    const d = draft[String(q.no)];
    const raw = Array.isArray(d?.picked) ? d.picked : [];
    const text = typeof d?.text === "string" ? d.text.trim() : "";
    if (text.length > TEXT_LIMIT) return { no: q.no, error: `${q.no}번은 ${TEXT_LIMIT}자까지 적습니다` };
    if (raw.some((p) => !q.options.includes(p as string))) return { no: q.no, error: `${q.no}번에 없는 선택지입니다. 새로 고침 후 다시 골라 주세요` };
    const picked = q.options.filter((o) => raw.includes(o));
    const answer = q.kind === "text" ? (text ? [text] : []) : [...picked, ...(q.other && text ? [text] : [])];
    if (!answer.length) {
      if (q.required) return { no: q.no, error: `${q.no}번에 답해 주세요` };
      continue;
    }
    if (q.kind === "single" && answer.length > 1) return { no: q.no, error: `${q.no}번은 하나만 고릅니다` };
    if (q.max && answer.length > q.max) return { no: q.no, error: `${q.no}번은 ${q.max}개까지 고릅니다` };
    if (q.alone && picked.includes(q.alone) && answer.length > 1) return { no: q.no, error: `${q.no}번의 '${q.alone}'은 다른 것과 함께 고르지 않습니다` };
    answers[String(q.no)] = answer;
  }
  return { answers };
}

// Saved answers back into the form, to change them
export function toDraft(r: Response | null): Draft {
  return Object.fromEntries(
    QUESTIONS.map((q) => {
      const a = r?.[String(q.no)] ?? [];
      if (q.kind === "text") return [String(q.no), { picked: [], text: a[0] ?? "" }];
      return [String(q.no), { picked: a.filter((x) => q.options.includes(x)), text: a.find((x) => !q.options.includes(x)) ?? "" }];
    }),
  );
}

export type Tally = { no: number; answered: number; bars: { label: string; n: number }[]; others: string[] };

// Counts per option; a written-in 기타 is kept as text and counted once as 기타
export function tally(responses: Response[], q: Question): Tally {
  const answers = responses.map((r) => r[String(q.no)]).filter((a) => a?.length);
  if (q.kind === "text") return { no: q.no, answered: answers.length, bars: [], others: answers.map((a) => a[0]) };
  const counts = q.options.map(() => 0);
  const others: string[] = [];
  for (const answer of answers)
    for (const a of answer) {
      const i = q.options.indexOf(a);
      if (i >= 0) counts[i]++;
      else others.push(a);
    }
  const bars = q.options.map((label, i) => ({ label, n: counts[i] }));
  if (others.length) bars.push({ label: "기타", n: others.length });
  return { no: q.no, answered: answers.length, bars, others };
}
