"use client";

import { useState } from "react";
import type { Day, Question, Tally } from "../lib/survey";
import { Band } from "./band";
import { useTopicCounts } from "./topic-counts";

export type SurveyResults = Record<Day, { count: number; tallies: (Tally & { hiddenOthers: number })[] }>;

const DAY_TABS: [Day, string][] = [
  ["all", "전체"],
  ["day1", "1일차 참여"],
  ["day2", "2일차 참여"],
];
const WHO = { day1: "1일차 참여자만 답함", day2: "2일차 참여자만 답함" };

// Question 7 lists the topic cards in order, so option i is card 01, 02, …
const topicSlug = (i: number) => String(i + 1).padStart(2, "0");

// Survey results to look at together in class: one panel per question, counts as bars, filtered by the day people attend
export function SurveyView({ results, questions, admin }: { results: SurveyResults; questions: Question[]; admin: boolean }) {
  const [day, setDay] = useState<Day>("all");
  const [live] = useTopicCounts();
  const { count, tallies } = results[day];
  const total = results.all.count;

  if (total === 0)
    return (
      <>
        <Band title="사전 수요조사 결과" lead="아직 결과가 없습니다. 관리 화면에서 구글폼 응답 CSV를 올리면 여기에 모입니다." />
      </>
    );

  return (
    <>
      <Band title="사전 수요조사 결과" lead={`${total}명 응답 · 1일차 참여 ${results.day1.count}명 · 2일차 참여 ${results.day2.count}명 · 이름은 저장하지 않았습니다`} />
      <div className="content">
        <div className="panel-head">
          <div className="tabs" role="group" aria-label="참여한 날">
            {DAY_TABS.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={day === key} onClick={() => setDay(key)}>
                {label} {results[key].count}
              </button>
            ))}
          </div>
          <span className="meta">{admin ? "강사 화면 · 서술형 답이 보입니다" : "서술형 답은 강사 화면에서 함께 봅니다"}</span>
        </div>
        <div className="survey">
          {questions.map((q, qi) => {
            const t = tallies[qi];
            const isTopics = q.no === 7 && live;
            const max = Math.max(1, ...t.bars.map((b) => b.n), ...(isTopics ? q.options.map((_, i) => live[topicSlug(i)] ?? 0) : []));
            return (
              <section key={q.no} className="panel" aria-labelledby={`q-${q.no}`}>
                <div className="panel-head">
                  <h2 id={`q-${q.no}`}>
                    {q.no}. {q.title}
                  </h2>
                  <span className="meta">
                    응답 {t.answered}명{q.who && day === "all" ? ` · ${WHO[q.who]}` : ""}
                  </span>
                </div>
                {isTopics && (
                  <p className="legend">
                    <span>
                      <i /> 설문에서 고른 사람
                    </span>
                    <span>
                      <i data-series="live" /> 지금 허브에서 고른 사람
                    </span>
                  </p>
                )}
                {q.kind === "text" ? null : (
                  <ul className="bars">
                    {t.bars.map((b, i) => {
                      const now = isTopics && b.label !== "기타" ? (live[topicSlug(i)] ?? 0) : null;
                      const pct = t.answered ? Math.round((b.n / t.answered) * 100) : 0;
                      return (
                        <li key={b.label} className="bar-row" title={`${b.label}: ${b.n}명 (${pct}%)${now !== null ? ` · 지금 ${now}명` : ""}`}>
                          <span className="bar-label">{b.label}</span>
                          <span className="bar-track">
                            <span className="bar" style={{ width: `${(b.n / max) * 100}%` }} />
                            {now !== null && <span className="bar" data-series="live" style={{ width: `${(now / max) * 100}%` }} />}
                          </span>
                          <span className="bar-value">{now !== null ? `${b.n} · 지금 ${now}` : `${b.n}명 · ${pct}%`}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {t.others.length > 0 && (
                  <ul className="answers">
                    {t.others.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                )}
                {t.hiddenOthers > 0 && <p className="meta">{q.kind === "text" ? "서술형" : "기타"} 답 {t.hiddenOthers}건 — 강사 화면에서 함께 봅니다</p>}
              </section>
            );
          })}
        </div>
        <p className="meta">{count}명 기준 · 퍼센트는 그 문항에 답한 사람 중 비율 (여러 개 고르는 문항은 합이 100%를 넘습니다)</p>
      </div>
    </>
  );
}
