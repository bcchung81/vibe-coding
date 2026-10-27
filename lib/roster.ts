// The roster, pasted from a spreadsheet: 이름 · 팀. Modelled on pdca-app's user import (lib/users/paste.ts · plan.ts), cut down to two columns.
export type RosterRow = { name: string; team: string };

// Excel, Google Sheets and 한셀 copy cells as tab-separated text; a cell holding a tab, a line break or a quote is quoted, with "" for ".
export function parseTsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let atStart = true; // a quote opens a cell only as its first character
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && atStart) {
      quoted = true;
      atStart = false;
    } else if (c === "\t") {
      row.push(cell);
      cell = "";
      atStart = true;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      atStart = true;
    } else {
      cell += c;
      atStart = false;
    }
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}

// Line breaks and runs of spaces become one space; Excel's no-break and invisible spaces go
export const cleanCell = (s: string) => s.replace(/[ ​‌‍﻿]/g, " ").replace(/\s+/g, " ").trim();

const NAME_HEAD = /^(이름|성명|성함|name)$/i;
const TEAM_HEAD = /^(팀|팀명|조|소속|소속팀|부서|team)$/i;

// Cells → rows. A first row of headings finds the columns in any order and is dropped; without one the columns are 이름, 팀.
export function readRosterCells(cells: string[][]): RosterRow[] {
  const clean = cells.map((r) => r.map(cleanCell));
  const head = clean[0] ?? [];
  const nameAt = head.findIndex((c) => NAME_HEAD.test(c));
  const body = nameAt >= 0 ? clean.slice(1) : clean;
  const teamAt = nameAt >= 0 ? head.findIndex((c) => TEAM_HEAD.test(c)) : 1;
  return body.map((r) => ({ name: r[Math.max(nameAt, 0)] ?? "", team: teamAt >= 0 ? (r[teamAt] ?? "") : "" })).filter((r) => r.name || r.team);
}

export const NAME_LIMIT = 20;

// new: goes in · check: the same name is on another team, so look before ticking · exists · duplicate · error: skipped
export type RowState = "new" | "check" | "exists" | "duplicate" | "error";
export type RowPlan = { state: RowState; note: string };

const keyOf = (r: RosterRow) => `${r.name}\u0000${r.team}`;
const teamName = (t: string) => t || "팀 없음";

// One verdict per row against the saved roster and the rows above it. Empty rows get null.
export function planRoster(rows: RosterRow[], saved: RosterRow[]): (RowPlan | null)[] {
  const savedKeys = new Set(saved.map(keyOf));
  const teams = new Map<string, string[]>(); // name → teams already saved or in a row above
  for (const s of saved) teams.set(s.name, [...(teams.get(s.name) ?? []), s.team]);
  const firstRow = new Map<string, number>();
  return rows.map((raw, i) => {
    const r = { name: cleanCell(raw.name), team: cleanCell(raw.team) };
    if (!r.name && !r.team) return null;
    if (!r.name) return { state: "error", note: "이름이 비었습니다" };
    if (r.name.length > NAME_LIMIT || r.team.length > NAME_LIMIT) return { state: "error", note: `이름 · 팀은 ${NAME_LIMIT}자까지 씁니다` };
    const key = keyOf(r);
    if (firstRow.has(key)) return { state: "duplicate", note: `${firstRow.get(key)}번 줄과 같습니다` };
    firstRow.set(key, i + 1);
    if (savedKeys.has(key)) return { state: "exists", note: "이미 명단에 있습니다" };
    const others = (teams.get(r.name) ?? []).filter((t) => t !== r.team);
    teams.set(r.name, [...(teams.get(r.name) ?? []), r.team]);
    if (others.length) return { state: "check", note: `같은 이름이 ${[...new Set(others)].map(teamName).join(", ")}에도 있습니다` };
    return { state: "new", note: r.team ? "" : "팀 없이 넣습니다" };
  });
}

// Ticked to go in unless someone changed it: new rows yes, rows to check no, skipped rows never
export const canApply = (plan: RowPlan | null) => plan?.state === "new" || plan?.state === "check";
export const appliesByDefault = (plan: RowPlan | null) => plan?.state === "new";
