"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adminLogIn, saveRoster, wipeEverything } from "../app/actions";
import type { StatusRow } from "../lib/db";
import { planRoster } from "../lib/roster";
import { topTopics } from "../lib/topic-counts";
import { Band } from "./band";
import { Icon } from "./icon";
import { PinInput } from "./pin-input";
import { isTicked, padRows, RosterGrid, type GridRow } from "./roster-grid";
import { sessionChanged } from "./session";

function downloadCsv(status: StatusRow[]) {
  const lines = [["이름", "팀", "주제", "앱", "주소", "좋아요"], ...status.map((s) => [s.name, s.team, s.topic ?? "", s.app ?? "", s.url ?? "", String(s.likes)])];
  const csv = "﻿" + lines.map((l) => l.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "결과물.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// The admin PIN (4 digits, ADMIN_PASSWORD in Vercel); the page reloads with the real view once it matches
export function AdminLogin() {
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [pending, start] = useTransition();
  const send = (pin: string) =>
    start(async () => {
      const result = await adminLogIn(pin);
      if (result === "ok") return sessionChanged();
      setError(result === "locked" ? "여러 번 틀려 막았습니다. 10분(여러 곳에서 틀렸으면 1시간) 뒤에 다시 해 주세요." : "관리 PIN이 맞지 않습니다.");
      setAttempt((n) => n + 1);
    });
  return (
    <>
      <Band title="다음: 관리 PIN 4자리" lead="강사 · 조교만 들어옵니다." />
      <div className="content">
        <section className="panel form login-panel" aria-label="관리 로그인" aria-busy={pending}>
          <PinInput key={attempt} label="관리 PIN 4자리" error={Boolean(error)} disabled={pending} onEdit={() => setError("")} onDone={send} />
          <span className={`hint ${error ? "error" : ""}`} aria-live="polite">
            {pending ? "확인하는 중…" : error || "수강생 공통 PIN과 다른 번호입니다."}
          </span>
        </section>
      </div>
    </>
  );
}

type Show = "all" | "site" | "survey";

export function AdminView({ status, titles }: { status: StatusRow[]; titles: Record<string, string> }) {
  const [rows, setRows] = useState<GridRow[]>(() => padRows([]));
  const [notice, setNotice] = useState<{ title: string; lead: string } | null>(null);
  const [show, setShow] = useState<Show>("all");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const plans = planRoster(rows, status);
  const sending = rows.filter((r, i) => isTicked(r, plans[i]));
  const broken = plans.filter((p) => p?.state === "error" || p?.state === "duplicate").length;
  const missing = status.filter((s) => !s.url);
  const unsurveyed = status.filter((s) => !s.surveyed);
  const shown = show === "site" ? missing : show === "survey" ? unsurveyed : status;
  const counts: Record<string, number> = {};
  for (const s of status) if (s.topic) counts[s.topic] = (counts[s.topic] ?? 0) + 1;
  const top = topTopics(counts);

  const changeRows = (next: GridRow[]) => {
    setRows(next);
    setNotice(null);
  };

  // Rows that went in leave the sheet (they show in 현황); the rest stay with the reason
  const apply = () =>
    start(async () => {
      const r = await saveRoster(sending.map(({ name, team }) => ({ name, team })));
      if ("error" in r) return setNotice({ title: "다음: 다시 로그인", lead: r.error ?? "" });
      const added = new Set(sending.filter((_, k) => r.results[k]?.ok));
      const failed = r.results.filter((x) => !x.ok);
      setRows(padRows(rows.filter((row) => !added.has(row))));
      setNotice({
        title: `명단에 ${added.size}명을 더했습니다`,
        lead: failed.length ? `${failed.length}줄은 넣지 못해 표에 남겼습니다 — ${failed[0].note}` : "다음: 주소 · 공통 PIN · 수요조사 주소를 공지합니다.",
      });
    });

  const band =
    notice ??
    (broken
      ? { title: `다음: 빨간 줄 ${broken}개 고치기`, lead: "중복 · 오류 줄은 반영하지 않습니다. 고치거나 지우면 바로 다시 판정합니다." }
      : sending.length
        ? { title: `다음: 명단 ${sending.length}명 반영`, lead: "체크한 줄만 들어갑니다. 이미 있는 이름과 그 사람의 사이트는 그대로 둡니다." }
        : { title: status.length ? `명단 ${status.length}명 · 사이트 아직 ${missing.length}명` : "다음: 명단 붙여넣기", lead: "엑셀에서 이름 · 팀 열을 복사해 아래 표의 이름 칸에 붙여넣습니다." });

  return (
    <>
      <Band {...band} />
      <div className="content">
        <section className="panel" aria-labelledby="roster-title">
          <div className="panel-head">
            <h2 id="roster-title">명단</h2>
            <span className="meta">저장된 {status.length}명 · 머리글 줄이 있어도 됩니다 · 칸을 고치면 바로 다시 판정합니다</span>
          </div>
          <RosterGrid rows={rows} plans={plans} onRows={changeRows} onApply={apply} onClear={() => changeRows(padRows([]))} pending={pending} />
        </section>

        <section className="panel" id="status" aria-labelledby="status-title">
          <div className="panel-head">
            <h2 id="status-title">현황</h2>
            <div className="tabs" role="group" aria-label="보기">
              <button type="button" aria-pressed={show === "all"} onClick={() => setShow("all")}>
                전체 {status.length}
              </button>
              <button type="button" aria-pressed={show === "survey"} onClick={() => setShow("survey")}>
                수요조사 아직 {unsurveyed.length}
              </button>
              <button type="button" aria-pressed={show === "site"} onClick={() => setShow("site")}>
                사이트 아직 {missing.length}
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
                  <th>수요조사</th>
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
                    <td>{s.surveyed ? <span className="chip done">냈음</span> : <span className="chip todo">아직</span>}</td>
                    <td>{s.topic ? `${s.topic} ${titles[s.topic] ?? ""}` : <span className="meta">—</span>}</td>
                    <td>{s.url ? <span className="chip done">올림 · {s.app}</span> : <span className="chip todo">아직</span>}</td>
                    <td className="num">{s.likes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel" aria-labelledby="survey-title">
          <div className="panel-head">
            <h2 id="survey-title">사전 수요조사</h2>
            <Link className="ghost" href="/survey">
              결과 보기
            </Link>
          </div>
          <p>
            명단 {status.length}명 중 <b>{status.length - unsurveyed.length}명</b>이 답했습니다. 수강생은 로그인한 뒤 <Link href="/survey/answer">/survey/answer</Link> 에서 답하고, 다시 들어와 고칠 수 있습니다. 아직인 사람은 현황의 &lsquo;수요조사 아직&rsquo;에서 봅니다.
          </p>
        </section>

        <section className="panel" aria-labelledby="close-title">
          <h2 id="close-title">교육이 끝나면</h2>
          <div className="tools">
            <button className="ghost" type="button" onClick={() => downloadCsv(status)}>
              <Icon name="download" size={16} />
              결과물 CSV 내려받기
            </button>
          </div>
          <label className="form danger">
            <span>명단 · 프로젝트 · 좋아요 · 캡처 · 수요조사 결과를 모두 지웁니다. 되돌릴 수 없습니다. CSV를 먼저 받고, 확인하려면 &lsquo;삭제&rsquo;를 입력하세요.</span>
            <span className="tools">
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="확인 문구" />
              <button
                className="danger-btn"
                type="button"
                disabled={confirm !== "삭제" || pending}
                onClick={() =>
                  start(async () => {
                    const done = await wipeEverything(confirm);
                    setConfirm("");
                    setNotice(done ? { title: "모두 지웠습니다", lead: "명단 · 프로젝트 · 좋아요 · 캡처 · 수요조사 결과가 없어졌습니다." } : { title: "지우지 못했습니다", lead: "관리 PIN으로 다시 들어와 주세요." });
                  })
                }
              >
                모두 지우기
              </button>
            </span>
          </label>
        </section>
      </div>
    </>
  );
}
