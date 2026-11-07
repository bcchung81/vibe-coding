"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icon";

export type PrepRow = { key: string; label: string; day1: boolean; day2: boolean; href: string; go: string };
type Day = "day1" | "day2" | "both";

const DAYS: { key: Day; label: string }[] = [
  { key: "day1", label: "1일차만" },
  { key: "day2", label: "2일차만" },
  { key: "both", label: "이틀 모두" },
];
const STORE = "vibe-prep";

// What to prepare for the days one takes part in. Ticks stay in this browser only (nothing is sent)
export function PrepChecklist({ items }: { items: PrepRow[] }) {
  const [day, setDay] = useState<Day>("both");
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "{}");
      if (DAYS.some((d) => d.key === saved.day)) setDay(saved.day);
      if (Array.isArray(saved.done)) setDone(saved.done);
    } catch {}
  }, []);
  const keep = (nextDay: Day, nextDone: string[]) => {
    setDay(nextDay);
    setDone(nextDone);
    try {
      localStorage.setItem(STORE, JSON.stringify({ day: nextDay, done: nextDone }));
    } catch {}
  };
  const shown = items.filter((i) => (day === "both" ? i.day1 || i.day2 : i[day]));
  const finished = shown.filter((i) => done.includes(i.key)).length;

  return (
    <section className="panel" aria-labelledby="prep-title">
      <div className="panel-head">
        <h2 id="prep-title">미리 준비할 것</h2>
        <div className="tabs" role="group" aria-label="참여 일정">
          {DAYS.map((d) => (
            <button key={d.key} type="button" aria-pressed={day === d.key} onClick={() => keep(d.key, done)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="prep-progress">
        <div className="progress-label" aria-live="polite">
          <b>{finished === shown.length ? "사전 준비를 모두 마쳤습니다" : `${shown.length - finished}개만 더 준비하세요`}</b>
          <span>{finished}/{shown.length}개 완료</span>
        </div>
        <div className="task-progress" role="progressbar" aria-label="사전 준비" aria-valuemin={0} aria-valuemax={shown.length} aria-valuenow={finished}>
          <span style={{ transform: `scaleX(${shown.length ? finished / shown.length : 0})` }} />
        </div>
        <p className="hint">완료한 항목을 체크하세요. 체크는 이 브라우저에만 저장됩니다.</p>
      </div>
      <ul className="prep">
        {shown.map((i) => (
          <li key={i.key} data-done={done.includes(i.key)}>
            <label className="choice">
              <input type="checkbox" checked={done.includes(i.key)} onChange={(e) => keep(day, e.target.checked ? [...done, i.key] : done.filter((k) => k !== i.key))} />
              <span className="tick" aria-hidden="true">
                <Icon name="check" size={14} />
              </span>
              <span>
                {i.label}
                {day === "both" && i.day1 !== i.day2 && <span className="note">{i.day1 ? "1일차" : "2일차"}만</span>}
              </span>
            </label>
            <Link className="ghost" href={i.href}>
              {i.go}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
