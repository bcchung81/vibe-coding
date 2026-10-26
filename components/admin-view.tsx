"use client";

import { useState, useTransition } from "react";
import { adminLogIn, saveRoster } from "../app/actions";
import type { StatusRow } from "../lib/db";
import { parseRoster } from "../lib/roster";
import { topTopics } from "../lib/topic-counts";
import { Band } from "./band";
import { Icon } from "./icon";

function downloadCsv(status: StatusRow[]) {
  const lines = [["이름", "팀", "주제", "앱", "주소", "좋아요"], ...status.map((s) => [s.name, s.team, s.topic ?? "", s.app ?? "", s.url ?? "", String(s.likes)])];
  const csv = "﻿" + lines.map((l) => l.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "결과물.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// The admin password set in Vercel (ADMIN_PASSWORD); the page reloads with the real view once it matches
export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Band title="다음: 관리 비밀번호" lead="강사 · 조교만 들어옵니다." />
      <div className="content">
        <form
          className="panel form login-panel"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => setWrong(!(await adminLogIn(password))));
          }}
        >
          <label>
            <span>비밀번호</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
          </label>
          <div className="tools">
            <button className="btn-primary" type="submit" disabled={pending || !password}>
              {pending ? "확인하는 중…" : "들어가기"}
            </button>
            {wrong && (
              <span className="hint error" role="alert">
                비밀번호가 맞지 않습니다
              </span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

export function AdminView({ status, titles }: { status: StatusRow[]; titles: Record<string, string> }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [pending, start] = useTransition();
  const { rows, duplicates } = parseRoster(text);
  const teams = new Set(rows.map((r) => r.team).filter(Boolean)).size;
  const missing = status.filter((s) => !s.url);
  const shown = onlyMissing ? missing : status;
  const counts: Record<string, number> = {};
  for (const s of status) if (s.topic) counts[s.topic] = (counts[s.topic] ?? 0) + 1;
  const top = topTopics(counts);

  const save = () =>
    start(async () => {
      const r = await saveRoster(text);
      if ("error" in r) return setResult(r.error ?? "");
      setResult(`${r.added}명 추가 · ${r.kept}명은 이미 있음`);
      setText("");
    });

  const band = result
    ? { title: `다음: 아직 안 올린 ${missing.length}명 확인`, lead: `${result} · 현황 표에서 '아직'인 사람을 찾아 돕습니다.` }
    : duplicates.length
      ? { title: "다음: 중복 고치기", lead: `같은 이름 · 팀이 있어 저장할 수 없습니다 · ${duplicates.join(", ")}` }
      : rows.length
        ? { title: `다음: 명단 ${rows.length}명 저장`, lead: `${teams}개 팀 · 중복 없음 · 이미 있는 이름은 그대로 둡니다` }
        : { title: status.length ? `아직 안 올린 사람 ${missing.length}명` : "다음: 명단 붙여넣기", lead: "엑셀에서 이름 · 팀 두 칸을 복사해 붙여넣습니다." };

  return (
    <>
      <Band {...band} />
      <div className="content">
        <section className="panel" aria-labelledby="roster-title">
          <div className="panel-head">
            <h2 id="roster-title">명단</h2>
            <span className="meta">
              저장된 {status.length}명 · 붙여넣은 {rows.length}명
            </span>
          </div>
          <div className="split">
            <label className="form">
              <span>이름 · 팀 (한 줄에 한 사람)</span>
              <textarea
                rows={8}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setResult("");
                }}
                placeholder={"이름\t팀\n가나다\t1팀\n라마바\t2팀"}
                spellCheck={false}
              />
            </label>
            <div className="roster-preview" aria-live="polite">
              {duplicates.length > 0 && <p className="hint error">중복: {duplicates.join(", ")}</p>}
              {rows.length === 0 ? (
                <p className="meta">붙여넣으면 여기에서 바로 확인합니다.</p>
              ) : (
                <ol>
                  {rows.map((r, i) => (
                    <li key={i} data-dup={duplicates.includes(r.team ? `${r.name} · ${r.team}` : r.name)}>
                      <b>{r.name}</b> <span className="meta">{r.team || "팀 없음"}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
          <div className="tools">
            <button className="btn-primary" type="button" disabled={!rows.length || duplicates.length > 0 || pending} onClick={save}>
              {pending ? "저장하는 중…" : "명단 저장"}
            </button>
            {result && <span className="hint ok">{result}</span>}
          </div>
        </section>

        <section className="panel" id="status" aria-labelledby="status-title">
          <div className="panel-head">
            <h2 id="status-title">현황</h2>
            <div className="tabs" role="group" aria-label="보기">
              <button type="button" aria-pressed={!onlyMissing} onClick={() => setOnlyMissing(false)}>
                전체 {status.length}
              </button>
              <button type="button" aria-pressed={onlyMissing} onClick={() => setOnlyMissing(true)}>
                아직 {missing.length}
              </button>
            </div>
          </div>
          {top.length > 0 && (
            <p className="topic-live">
              가장 많이 고른 주제: {top.map((slug) => `${slug} ${titles[slug] ?? ""}`).join(", ")} ({counts[top[0]]}명)
            </p>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>팀</th>
                  <th>주제</th>
                  <th>사이트</th>
                  <th>좋아요</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={`${s.name}-${s.team}`}>
                    <td>{s.name}</td>
                    <td>{s.team}</td>
                    <td>{s.topic ? `${s.topic} ${titles[s.topic] ?? ""}` : <span className="meta">—</span>}</td>
                    <td>{s.url ? <span className="chip done">올림 · {s.app}</span> : <span className="chip todo">아직</span>}</td>
                    <td className="num">{s.likes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel" aria-labelledby="close-title">
          <h2 id="close-title">교육이 끝나면</h2>
          <div className="tools">
            <button className="ghost" type="button" onClick={() => downloadCsv(status)}>
              <Icon name="download" size={16} />
              결과물 CSV 내려받기
            </button>
          </div>
          <p className="meta">명단 · 프로젝트 · 캡처를 모두 지우는 기능은 갤러리 · 캡처와 함께 다음 단계에서 붙입니다.</p>
        </section>
      </div>
    </>
  );
}
