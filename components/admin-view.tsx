"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adminLogIn, saveCourse, wipeEverything } from "../app/actions";
import { COURSE_FIELDS, INFO_LIMIT, type CourseInfo } from "../lib/course";
import { Band } from "./band";
import { PinInput } from "./pin-input";
import { sessionChanged } from "./session";

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
      <Band kicker="관리" title="다음: 관리 PIN 4자리" lead="강사 · 조교만 들어옵니다." />
      <div className="content">
        <section className="panel form login-panel" aria-label="관리 로그인" aria-busy={pending}>
          <PinInput key={attempt} label="관리 PIN 4자리" error={Boolean(error)} disabled={pending} onEdit={() => setError("")} onDone={send} />
          <span className={`hint ${error ? "error" : ""}`} aria-live="polite">
            {pending ? "확인하는 중…" : error || "강사 · 조교에게 알려 준 4자리입니다."}
          </span>
        </section>
      </div>
    </>
  );
}

// Date · place · deadlines · contact for /course. Kept in the DB, not in the public repo
function CourseInfoPanel({ info }: { info: CourseInfo }) {
  const [draft, setDraft] = useState<CourseInfo>(info);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      const r = await saveCourse(draft);
      setNote("error" in r ? r.error : "저장했습니다. 교육 안내 화면에 바로 나옵니다.");
    });
  return (
    <section className="panel" aria-labelledby="course-title" aria-busy={pending}>
      <div className="panel-head">
        <h2 id="course-title">교육 안내</h2>
        <Link className="ghost" href="/course">
          화면 보기
        </Link>
      </div>
      <div className="person">
        {COURSE_FIELDS.map((f) => (
          <label className="form" key={f.key}>
            <span>{f.label}</span>
            <input
              value={draft[f.key] ?? ""}
              maxLength={INFO_LIMIT}
              placeholder={f.example}
              onChange={(e) => {
                setDraft({ ...draft, [f.key]: e.target.value });
                setNote("");
              }}
            />
          </label>
        ))}
      </div>
      <div className="tools">
        <button className="btn-primary" type="button" disabled={pending} onClick={save}>
          저장
        </button>
        <span className="hint" aria-live="polite">
          {pending ? "저장하는 중…" : note || "비운 칸은 교육 안내에 '확정되면 안내'로 나옵니다. 누구나 보는 화면입니다."}
        </span>
      </div>
    </section>
  );
}

export function AdminView({ info }: { info: CourseInfo }) {
  const [notice, setNotice] = useState<{ title: string; lead: string } | null>(null);
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();

  return (
    <>
      <Band kicker="관리" {...(notice ?? { title: "교육 안내를 채웁니다", lead: "일시 · 장소 · 회신 마감 · 문의를 적으면 교육 안내 화면에 바로 나옵니다." })} />
      <div className="content">
        <CourseInfoPanel info={info} />

        <section className="panel" aria-labelledby="close-title">
          <h2 id="close-title">남은 데이터 지우기</h2>
          <label className="form danger">
            <span>예전 명단 · 수요조사 응답 · PIN 기록을 모두 지웁니다. 되돌릴 수 없습니다. 확인하려면 &lsquo;삭제&rsquo;를 입력하세요.</span>
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
                    setNotice(done ? { title: "모두 지웠습니다", lead: "예전 명단 · 수요조사 응답 · PIN 기록이 없어졌습니다." } : { title: "지우지 못했습니다", lead: "관리 PIN으로 다시 들어와 주세요." });
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
