"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { movePick, topTopics } from "../lib/topic-counts";
import { Band } from "./band";
import { CodeBlock } from "./code-block";
import { Icon } from "./icon";
import { chooseTopic, myTopic } from "./my-topic";
import { useTopicCounts } from "./topic-counts";

export type TopicItem = { slug: string; title: string; summary: string };

// "날씨 · 기상청 단기예보 · 난이도 중" → the area and API, and the difficulty on its own
const split = (summary: string) => summary.split(" · 난이도 ");

// The ten day-1 topics, five across, then the start folder in three steps. Picking one marks it "내 주제" in this browser,
// and for a logged-in trainee counts toward the live picks every card shows.
export function TopicPicker({ items }: { items: TopicItem[] }) {
  const [mine, setMine] = useState<string | null>(null);
  const [counts, setCounts] = useTopicCounts();
  // false after a pick that did not count (not logged in)
  const [counted, setCounted] = useState<boolean | null>(null);
  // the download command names this site's own address, so it works from whichever URL the page was opened at
  const [origin, setOrigin] = useState("https://kca-vibe.vercel.app");
  useEffect(() => {
    setMine(myTopic());
    setOrigin(location.origin);
  }, []);
  const chosen = items.find((t) => t.slug === mine);
  const no = chosen?.slug ?? "번호";
  const top = counts ? topTopics(counts) : [];
  const total = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : 0;

  const pick = async (slug: string | null) => {
    const from = mine;
    setMine(slug);
    const saved = await chooseTopic(slug);
    setCounted(saved);
    if (saved) setCounts((c) => c && movePick(c, from, slug));
  };

  return (
    <>
      <Band
        title="어떤 웹앱을 만들어 볼까요?"
        lead={chosen ? `내 주제 ${chosen.slug} · ${chosen.title} — 아래 시작 폴더 3단계로 시작합니다.` : `생활 속 질문 ${items.length}개. 하나를 골라 공공데이터로 답을 만듭니다.`}
        action={chosen ? { href: "#start-folder", label: "시작 폴더 안내" } : undefined}
      />
      <div className="content">
        {counts && (
          <p className="topic-live" aria-live="polite">
            {total > 0
              ? `지금 ${total}명이 골랐습니다 · 가장 많이 고른 주제: ${top.map((slug) => `${slug} ${items.find((t) => t.slug === slug)?.title ?? ""}`).join(", ")} (${counts[top[0]]}명)`
              : "아직 아무도 고르지 않았습니다. 첫 번째로 골라 보세요."}
            {counted === false && <span className="meta"> · 로그인하면 내 선택도 여기에 셉니다</span>}
          </p>
        )}
        <ul className="topics">
          {items.map((t) => {
            const on = t.slug === mine;
            const [about, level] = split(t.summary);
            const lead = top.includes(t.slug);
            return (
              <li key={t.slug} className="topic" data-mine={on}>
                <span className="topic-top">
                  <b>{t.slug}</b>
                  {level && <span>난이도 {level}</span>}
                </span>
                <h3>
                  <Link href={`/topics/${t.slug}`}>{t.title}</Link>
                </h3>
                <p>{about}</p>
                {counts && (
                  <span className="topic-count" data-top={lead}>
                    {lead && "가장 많이 · "}
                    {counts[t.slug] ?? 0}명이 고름
                  </span>
                )}
                <div className="topic-foot">
                  <button className="pick" type="button" aria-pressed={on} onClick={() => pick(on ? null : t.slug)}>
                    {on && <Icon name="check" size={16} />}
                    {on ? "내 주제" : "고르기"}
                  </button>
                  <Link className="ghost" href={`/topics/${t.slug}`}>
                    자료 보기
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <section id="start-folder" className="panel setup" aria-labelledby="start-title">
          <div className="setup-head">
            <div>
              <h2 id="start-title">시작 폴더 준비</h2>
              <p className="selection">{chosen ? `고른 주제 ${chosen.slug} · ${chosen.title}` : "주제를 먼저 고르세요"}</p>
              <p className="meta">Windows PowerShell · C:\workspace\vibe — 규칙 · 명령 · 주제 카드 · Next.js 뼈대가 들어 있습니다.</p>
            </div>
            <a className="ghost" href="/vibe.zip" download="vibe.zip">
              <Icon name="download" size={16} />
              vibe.zip 내려받기
            </a>
          </div>
          <ol className="start-steps">
            <li>
              <p>PowerShell에 한 줄을 붙여 넣어 내려받고 풉니다.</p>
              <CodeBlock>{`Invoke-WebRequest ${origin}/vibe.zip -OutFile $env:TEMP\\vibe.zip; Expand-Archive $env:TEMP\\vibe.zip C:\\workspace\\vibe`}</CodeBlock>
            </li>
            <li>
              <p>그 폴더에서 에이전트를 열고 말합니다.</p>
              <code>시작하기.md 대로 준비해줘</code>
            </li>
            <li>
              <p>고른 주제 번호로 시작합니다.</p>
              <code>/vibe-prd {no}</code>
              <p className="meta">Codex · Antigravity: vibe-prd 스킬로 주제 {no} 시작해줘</p>
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}

// The same pick button on a topic's own page
export function TopicPick({ slug }: { slug: string }) {
  const [mine, setMine] = useState<string | null>(null);
  useEffect(() => setMine(myTopic()), []);
  const on = mine === slug;
  return (
    <button
      className="pick"
      type="button"
      aria-pressed={on}
      onClick={() => {
        setMine(on ? null : slug);
        chooseTopic(on ? null : slug);
      }}
    >
      {on && <Icon name="check" size={16} />}
      {on ? "내 주제" : "내 주제로 고르기"}
    </button>
  );
}
