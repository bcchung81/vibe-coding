"use client";

import type { ClipboardEvent, KeyboardEvent } from "react";
import { appliesByDefault, canApply, parseTsv, readRosterCells, type RowPlan, type RowState } from "../lib/roster";

// One row of the sheet. `tick` is the admin's own choice; left out, the verdict decides.
export type GridRow = { name: string; team: string; tick?: boolean };

const COLUMNS = ["name", "team"] as const;
const LABEL: Record<RowState, string> = { new: "추가", check: "확인", exists: "있음", duplicate: "중복", error: "오류" };
const MIN_ROWS = 8;
const SPARE = 3;

export const isTicked = (row: GridRow, plan: RowPlan | null) => canApply(plan) && (row.tick ?? appliesByDefault(plan));

// A few empty rows always wait under the last filled one, as in a spreadsheet
export function padRows(rows: GridRow[]): GridRow[] {
  let end = rows.length;
  while (end > 0 && !rows[end - 1].name.trim() && !rows[end - 1].team.trim()) end--;
  const kept = rows.slice(0, end);
  return [...kept, ...Array.from({ length: Math.max(MIN_ROWS - kept.length, SPARE) }, () => ({ name: "", team: "" }))];
}

// The roster as a small sheet, after pdca-app's user import: paste the 이름 · 팀 cells from Excel into any row,
// every row is judged as it changes (lib/roster.ts), and only ticked rows are sent.
export function RosterGrid({ rows, plans, onRows, onApply, onClear, pending }: { rows: GridRow[]; plans: (RowPlan | null)[]; onRows: (rows: GridRow[]) => void; onApply: () => void; onClear: () => void; pending: boolean }) {
  const filled = plans.filter((p): p is RowPlan => p !== null);
  const count = (...states: RowState[]) => filled.filter((p) => states.includes(p.state)).length;
  const ticked = rows.filter((r, i) => isTicked(r, plans[i])).length;

  const edit = (i: number, change: Partial<GridRow>) => onRows(padRows(rows.map((r, k) => (k === i ? { ...r, ...change } : r))));

  // Several cells from a spreadsheet fill 이름 · 팀 from this row down; a heading row is read and dropped
  const paste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!/[\t\r\n]/.test(text.trim())) return;
    e.preventDefault();
    const pasted = readRosterCells(parseTsv(text));
    const next = [...rows];
    next.splice(i, pasted.length, ...pasted);
    onRows(padRows(next));
  };

  // Enter and the up/down arrows move between rows, as in a spreadsheet
  const move = (i: number, column: number, e: KeyboardEvent<HTMLInputElement>) => {
    const step = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" || e.key === "Enter" ? 1 : 0;
    if (!step) return;
    e.preventDefault();
    document.querySelector<HTMLInputElement>(`[data-cell="${i + step}-${column}"]`)?.focus();
  };

  return (
    <div className="sheet-wrap">
      <div className="sheet-scroll">
        <table className="sheet">
          <thead>
            <tr>
              <th className="row-no" scope="col">
                <span className="sr-only">줄</span>
              </th>
              <th scope="col">이름</th>
              <th scope="col">팀</th>
              <th scope="col">상태</th>
              <th className="tick-cell" scope="col">
                반영
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const plan = plans[i];
              return (
                <tr key={i} data-state={plan?.state}>
                  <th className="row-no" scope="row">
                    {i + 1}
                  </th>
                  {COLUMNS.map((column, c) => (
                    <td key={column}>
                      <input
                        data-cell={`${i}-${c}`}
                        value={row[column]}
                        aria-label={`${i + 1}번 줄 ${column === "name" ? "이름" : "팀"}`}
                        spellCheck={false}
                        autoComplete="off"
                        onChange={(e) => edit(i, { [column]: e.target.value, tick: undefined })}
                        onPaste={(e) => paste(i, e)}
                        onKeyDown={(e) => move(i, c, e)}
                      />
                    </td>
                  ))}
                  <td className="state-cell">
                    {plan && (
                      <>
                        <span className="row-state" data-state={plan.state}>
                          {LABEL[plan.state]}
                        </span>
                        {plan.note && <span className="meta">{plan.note}</span>}
                      </>
                    )}
                  </td>
                  <td className="tick-cell">
                    {plan && (
                      <input type="checkbox" checked={isTicked(row, plan)} disabled={!canApply(plan) || pending} aria-label={`${i + 1}번 줄 반영`} onChange={(e) => edit(i, { tick: e.target.checked })} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sheet-bar" aria-live="polite">
        <span>
          입력 <b>{filled.length}</b>줄 · 반영 <b>{ticked}</b>명 · 확인 {count("check")} · 건너뜀 {count("exists", "duplicate")} · 오류 {count("error")}
        </span>
        <span className="tools">
          <button className="ghost" type="button" disabled={!filled.length || pending} onClick={onClear}>
            모두 지우기
          </button>
          <button className="btn-primary" type="button" disabled={!ticked || pending} onClick={onApply}>
            {pending ? "반영하는 중…" : `${ticked}명 반영`}
          </button>
        </span>
      </div>
    </div>
  );
}
