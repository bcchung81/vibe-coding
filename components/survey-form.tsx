"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { answerSurvey } from "../app/actions";
import { asked, checkAnswers, QUESTIONS, TEXT_LIMIT, toDraft, type Draft, type Question, type Response } from "../lib/survey";
import { Band } from "./band";
import { Icon } from "./icon";

type Problem = { no: number; error: string };
const DAY = { day1: "1일차 참여자", day2: "2일차 참여자" };

const answered = (q: Question, d: Draft[string]) => (q.kind === "text" ? Boolean(d.text.trim()) : d.picked.length > 0 || Boolean(q.other && d.text.trim()));

// The pre-course survey on one page. Question 1 decides whether 5 and 7 are asked; the band counts what is left
// and turns into "냈습니다" once the answers on screen are the saved ones.
export function SurveyForm({ name, saved: first }: { name: string; saved: Response | null }) {
  const [saved, setSaved] = useState(first);
  const [draft, setDraft] = useState(() => toDraft(first));
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, start] = useTransition();

  const shown = QUESTIONS.filter((q) => asked(q, draft));
  const left = shown.filter((q) => q.required && !answered(q, draft[q.no])).length;
  const check = checkAnswers(draft);
  const done = Boolean(saved) && "answers" in check && JSON.stringify(check.answers) === JSON.stringify(saved);

  const lead = `${name} 님 · 약 3분 · 답은 교육 준비에만 씁니다. 결과 화면에는 이름이 보이지 않습니다.`;
  const band = done
    ? { title: "수요조사를 냈습니다", lead: "고칠 것이 있으면 바꾸고 다시 내면 됩니다. 결과는 수업 때 함께 봅니다.", action: { href: "/survey", label: "결과 보기" } }
    : left
      ? { title: `다음: ${left}문항 남음`, lead }
      : { title: saved ? "다음: 고친 답 내기" : "다음: 답 내기", lead };

  const set = (no: number, next: Partial<Draft[string]>) => {
    setDraft((d) => ({ ...d, [no]: { ...d[no], ...next } }));
    setProblem((p) => (p?.no === no ? null : p));
  };

  // 해당 없음 · 특별히 없음 stand alone: picking it clears the rest, picking anything else clears it
  const pick = (q: Question, option: string, on: boolean) => {
    const cur = draft[q.no].picked;
    if (q.kind === "single") return set(q.no, { picked: [option] });
    if (option === q.alone) return set(q.no, on ? { picked: [option], text: "" } : { picked: [] });
    set(q.no, { picked: on ? [...cur.filter((p) => p !== q.alone), option] : cur.filter((p) => p !== option) });
  };

  const writeOther = (q: Question, text: string) => set(q.no, q.alone && text.trim() ? { text, picked: draft[q.no].picked.filter((p) => p !== q.alone) } : { text });

  const show = (p: Problem) => {
    setProblem(p);
    document.querySelector<HTMLElement>(`#q-${p.no} input:not(:disabled), #q-${p.no} textarea`)?.focus();
  };

  const submit = () => {
    if ("error" in check) return show(check);
    start(async () => {
      const r = await answerSurvey(draft);
      if ("error" in r) return show(r);
      setSaved(r.saved);
      setProblem(null);
    });
  };

  return (
    <>
      <Band {...band} />
      <form
        className="content survey-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {shown.map((q) => {
          const d = draft[q.no];
          const full = q.max !== undefined && d.picked.length >= q.max;
          const wrong = problem?.no === q.no;
          return (
            <section key={q.no} id={`q-${q.no}`} className="panel question" role="group" aria-labelledby={`q-${q.no}-title`} data-error={wrong}>
              <div className="panel-head">
                <h2 id={`q-${q.no}-title`}>
                  {q.no}. {q.ask}
                </h2>
                <span className="meta">
                  {q.who ? `${DAY[q.who]} · ` : ""}
                  {q.required ? "필수" : "선택"}
                </span>
              </div>

              {q.kind === "text" ? (
                <label className="form">
                  <textarea rows={3} maxLength={TEXT_LIMIT} value={d.text} placeholder={q.example} aria-labelledby={`q-${q.no}-title`} aria-invalid={wrong} onChange={(e) => set(q.no, { text: e.target.value })} />
                  <span className="hint">
                    {d.text.length}/{TEXT_LIMIT}자
                  </span>
                </label>
              ) : (
                <div className="choices">
                  {q.options.map((option, i) => {
                    const on = d.picked.includes(option);
                    return (
                      <label key={option} className="choice">
                        <input
                          type={q.kind === "single" ? "radio" : "checkbox"}
                          name={`q${q.no}`}
                          checked={on}
                          disabled={full && !on}
                          aria-invalid={wrong}
                          onChange={(e) => pick(q, option, e.target.checked)}
                        />
                        <span className="tick" aria-hidden="true">
                          <Icon name="check" size={14} />
                        </span>
                        <span>
                          {option}
                          {q.notes?.[i] && <span className="note">{q.notes[i]}</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {q.other && (
                <label className="other">
                  <span>기타</span>
                  <input value={d.text} maxLength={TEXT_LIMIT} placeholder="목록에 없으면 직접 적기" onChange={(e) => writeOther(q, e.target.value)} />
                </label>
              )}
              {full && <p className="hint">{q.max}개를 골랐습니다. 바꾸려면 하나를 먼저 빼세요.</p>}
              {wrong && (
                <p className="hint error" role="alert">
                  {problem?.error}
                </p>
              )}
            </section>
          );
        })}

        <div className="survey-submit">
          <button className="btn-primary" type="submit" disabled={pending || done}>
            {done && <Icon name="check" size={18} />}
            {pending ? "내는 중…" : done ? "냈습니다" : saved ? "고친 답 내기" : "답 내기"}
          </button>
          <span className={`hint ${problem && !problem.no ? "error" : ""}`} aria-live="polite">
            {problem && !problem.no ? problem.error : done ? <Link href="/survey">결과 보기</Link> : left ? `필수 ${left}문항이 남았습니다` : "모두 답했습니다"}
          </span>
        </div>
      </form>
    </>
  );
}
