// The course guide (/course): the two-day outline from docs/00_전체목차.md, the preparation list from the pre-course notice
// (docs/교육생_배포/1_교육전_사전안내/00_사전안내.md) and the date · place · contact the admin types in.
// Pure functions only, so the admin screen (client) can import the fields; lib/course-files.ts reads the files.

export type Slot = { time: string; period: number | null; title: string; gain: string };
export type CourseDay = { day: 1 | 2; title: string; hours: string; slots: Slot[] };
export type Participation = { who: string; gain: string };
export type PrepItem = { ref: string; label: string; day1: boolean; day2: boolean; section: number };

// Table rows under a line that starts with `heading`, header and divider dropped; cells trimmed and stripped of ` and **
export function tableAfter(md: string, heading: (line: string) => boolean): string[][] {
  const lines = md.split("\n");
  const at = lines.findIndex(heading);
  if (at < 0) return [];
  const rows: string[][] = [];
  let i = at + 1;
  while (i < lines.length && !lines[i].startsWith("|")) {
    if (lines[i].startsWith("#")) return [];
    i++;
  }
  for (; i < lines.length && lines[i].startsWith("|"); i++) rows.push(lines[i].slice(1, -1).split("|").map((c) => c.replace(/`|\*\*/g, "").trim()));
  return rows.slice(2);
}

// "## 1일차 — 내 웹앱을 만들어 인터넷에 올린다 (13:30~17:00)" and its table: 시간 | 교시 | 제목 | 남는 것 | …; a break has — for 교시
export function parseOutline(md: string): CourseDay[] {
  return ([1, 2] as const).flatMap((day) => {
    const line = md.split("\n").find((l) => l.startsWith(`## ${day}일차`));
    const m = line?.match(/^## \d일차 — (.+?) \((.+)\)\s*$/);
    if (!line || !m) return [];
    const slots = tableAfter(md, (l) => l === line).map(([time, period, title, gain]) => ({
      time,
      period: /^\d+$/.test(period) ? Number(period) : null,
      title,
      gain: gain ?? "",
    }));
    return [{ day, title: m[1], hours: m[2].replace(/~/g, "–"), slots }];
  });
}

// "## 참여 유형별로 남는 것" table: 참여 | 남는 것
export function parseParticipation(md: string): Participation[] {
  return tableAfter(md, (l) => l.startsWith("## 참여 유형별로 남는 것")).map(([who, gain]) => ({ who, gain }));
}

// "## 2. 미리 준비할 것" table: 준비 | 1일차 | 2일차 (✅ = needed). "2-2 ② GitHub 계정" → ref 2-2, label GitHub 계정, section 2
export function parsePrep(md: string): PrepItem[] {
  return tableAfter(md, (l) => l.startsWith("## 2. 미리 준비할 것")).map(([label, d1, d2]) => ({
    ref: label.match(/^(\d-\d|\d장)/)?.[1] ?? "",
    label: label.replace(/^(\d-\d|\d장)\s*([①-⑳]\s*)?/, ""),
    day1: d1?.includes("✅") ?? false,
    day2: d2?.includes("✅") ?? false,
    section: Number(label.match(/^(\d)/)?.[1] ?? 0),
  }));
}

// Line number of each "## N." heading — the handout page anchors a section as s<line> (components/handout.tsx)
export function sectionLines(md: string): Record<number, number> {
  return Object.fromEntries(md.split("\n").flatMap((l, i) => (/^## (\d)\./.test(l) ? [[Number(l.match(/^## (\d)/)![1]), i + 1]] : [])));
}

// What the admin types in; empty fields show as 확정되면 안내
export const COURSE_FIELDS = [
  { key: "when", label: "일시", example: "11월 19일(수) 13:30–17:00 · 11월 20일(목) 09:30–17:00" },
  { key: "place", label: "장소", example: "본사 ○층 교육장" },
  { key: "prepDue", label: "사전 준비 회신", example: "11월 17일(월)까지 · 담당 부서" },
  { key: "contact", label: "문의", example: "○○팀 담당자 · 내선" },
] as const;

export type CourseInfo = Partial<Record<(typeof COURSE_FIELDS)[number]["key"], string>>;
export const INFO_LIMIT = 200;

export function checkCourseInfo(input: unknown): { info: CourseInfo } | { error: string } {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const info: CourseInfo = {};
  for (const { key, label } of COURSE_FIELDS) {
    const v = typeof raw[key] === "string" ? (raw[key] as string).replace(/\s+/g, " ").trim() : "";
    if (v.length > INFO_LIMIT) return { error: `${label}은 ${INFO_LIMIT}자까지 적습니다` };
    if (v) info[key] = v;
  }
  return { info };
}
