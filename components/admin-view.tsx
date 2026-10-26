"use client";

import { useState } from "react";
import { DEMO_PROJECTS, DEMO_ROSTER } from "../lib/demo";
import { parseRoster } from "../lib/roster";
import { Band } from "./band";
import { Icon } from "./icon";

const status = DEMO_ROSTER.map((r) => ({ ...r, project: DEMO_PROJECTS.find((p) => p.name === r.name && p.team === r.team) }));

function downloadCsv() {
  const lines = [["이름", "팀", "앱", "주소", "좋아요"], ...status.map((s) => [s.name, s.team, s.project?.app ?? "", s.project?.url ?? "", String(s.project?.likes ?? 0)])];
  const csv = "﻿" + lines.map((l) => l.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "결과물-예시.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export function AdminView() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [wiped, setWiped] = useState(false);
  const { rows, duplicates } = parseRoster(text);
  const teams = new Set(rows.map((r) => r.team).filter(Boolean)).size;
  const missing = status.filter((s) => !s.project);
  const shown = onlyMissing ? missing : status;

  const band = saved
    ? { title: `다음: 아직 안 올린 ${missing.length}명 확인`, lead: "현황 표에서 '아직'인 사람을 찾아 돕습니다." }
    : duplicates.length
      ? { title: "다음: 중복 고치기", lead: `같은 이름 · 팀이 있어 저장할 수 없습니다 · ${duplicates.join(", ")}` }
      : rows.length
      ? { title: `다음: 명단 ${rows.length}명 저장`, lead: `${teams}개 팀 · 중복 없음` }
      : { title: "다음: 명단 붙여넣기", lead: "엑셀에서 이름 · 팀 두 칸을 복사해 붙여넣습니다." };

  return (
    <>
      <Band {...band} />
      <div className="content">
        <section className="panel" aria-labelledby="roster-title">
          <div className="panel-head">
            <h2 id="roster-title">명단</h2>
            <span className="meta">
              {rows.length}명 · {teams}개 팀
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
                  setSaved(false);
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
            <button className="btn-primary" type="button" disabled={!rows.length || duplicates.length > 0 || saved} onClick={() => setSaved(true)}>
              {saved ? "저장했습니다 (예시)" : "명단 저장"}
            </button>
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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>팀</th>
                  <th>사이트</th>
                  <th>좋아요</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td>{s.team}</td>
                    <td>{s.project ? <span className="chip done">올림 · {s.project.app}</span> : <span className="chip todo">아직</span>}</td>
                    <td className="num">{s.project?.likes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel" aria-labelledby="close-title">
          <h2 id="close-title">교육이 끝나면</h2>
          <div className="tools">
            <button className="ghost" type="button" onClick={downloadCsv}>
              <Icon name="download" size={16} />
              결과물 CSV 내려받기
            </button>
          </div>
          <label className="form danger">
            <span>명단 · 프로젝트 · 캡처를 모두 지웁니다. 되돌릴 수 없습니다. 확인하려면 &lsquo;삭제&rsquo;를 입력하세요.</span>
            <span className="tools">
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="확인 문구" />
              <button className="danger-btn" type="button" disabled={confirm !== "삭제" || wiped} onClick={() => setWiped(true)}>
                {wiped ? "예시라 지우지 않았습니다" : "모두 지우기"}
              </button>
            </span>
          </label>
        </section>
      </div>
    </>
  );
}
