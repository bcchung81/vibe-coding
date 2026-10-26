"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "./copy-button";
import { Icon } from "./icon";
import { myTopic } from "./my-topic";
import { markRead, readKeys } from "./read-state";
import type { TopicItem } from "./topic-picker";

export type GuideItem = { key: string; stage: string; stageTitle: string; title: string; short: string; name: string; kind: "doc" | "file" };

const REPO = "https://github.com/bcchung81/vibe-coding";
const hrefOf = (item: GuideItem) => `/materials/${item.key}`;
const STAGE_LEAD: Record<string, string> = {
  "1": "가볍게 읽고 준비합니다",
  "2": "환경설정은 두 날 모두 여기서 · 1일차는 웹앱 주제를 고르고 사이트를 올립니다",
  "3": "보고서 도구를 받아 내 에이전트에 설치합니다",
};
const STATUS = { done: "완료", next: "다음", todo: "아직" };

// Handouts in reading order with the one thing to do now on top.
// On the gallery it folds into a drawer whose summary still names that next step.
export function Guide({ items, topics, drawer = false }: { items: GuideItem[]; topics: TopicItem[]; drawer?: boolean }) {
  const [read, setRead] = useState<string[]>([]);
  const [mine, setMine] = useState<string | null>(null);
  useEffect(() => {
    setRead(readKeys());
    setMine(myTopic());
  }, []);
  const chosen = topics.find((t) => t.slug === mine);

  const done = items.filter((item) => read.includes(item.key)).length;
  // the next step follows day 1 (steps 1-2, then the topic and the gallery); day 2 handouts show their state in their own panel
  const next = items.find((item) => Number(item.stage) <= 2 && !read.includes(item.key));
  const stages = [...new Map(items.map((item) => [item.stage, item.stageTitle])).entries()];
  const now = next
    ? {
        title: `${next.short} ${next.kind === "doc" ? "읽기" : "내려받기"}`,
        lead: `${next.stageTitle} · 자료 ${items.length}개 중 ${done}개 확인 · 로그인 없이 볼 수 있습니다.`,
      }
    : !chosen
      ? { title: "내 웹앱 주제 고르기", lead: `1일차 2교시 · ${topics.length}개 중 하나를 고르고 시작 폴더를 준비합니다.` }
      : { title: "내 사이트 올리고 서로 좋아요", lead: "1일차 4교시 · 배포한 주소를 올리고 서로의 사이트를 둘러봅니다." };

  const body = (
    <>
      <section className="next" aria-labelledby="next-title">
        <div>
          <h2 id="next-title">{now.title}</h2>
          <p>{now.lead}</p>
        </div>
        {next ? (
          next.kind === "doc" ? (
            <Link className="ghost" href={hrefOf(next)}>
              읽기 <Icon name="arrow" size={18} />
            </Link>
          ) : (
            <a className="ghost" href={`${hrefOf(next)}/download`} download={next.name} onClick={() => setRead(markRead(next.key))}>
              내려받기 <Icon name="download" size={18} />
            </a>
          )
        ) : (
          <Link className="ghost" href={chosen ? "/me" : "/topics"}>
            {chosen ? "내 프로젝트" : "주제 고르기"} <Icon name="arrow" size={18} />
          </Link>
        )}
      </section>
      <div className="stages">
        {stages.map(([stage, title]) => (
          <section key={stage} className="panel" aria-labelledby={`stage-${stage}`}>
            <div className="stage-head">
              <b className="stage-no">{stage}</b>
              <div>
                <h2 id={`stage-${stage}`}>{title}</h2>
                {STAGE_LEAD[stage] && <p>{STAGE_LEAD[stage]}</p>}
              </div>
            </div>
            <ul className="items">
              {items
                .filter((item) => item.stage === stage)
                .map((item) => {
                  const state = read.includes(item.key) ? "done" : item === next ? "next" : "todo";
                  return (
                    <li key={item.key} className="item">
                      <span className="status" data-state={state}>
                        {STATUS[state]}
                      </span>
                      <span className="item-text">
                        <Link href={hrefOf(item)}>{item.title}</Link>
                        <span className="meta">{item.name}</span>
                      </span>
                      {item.kind === "doc" ? (
                        <Link className="ghost" href={hrefOf(item)}>
                          {state === "done" ? "다시 읽기" : "읽기"}
                        </Link>
                      ) : (
                        <a className="ghost" href={`${hrefOf(item)}/download`} download={item.name} onClick={() => setRead(markRead(item.key))}>
                          <Icon name="download" size={16} />
                          내려받기
                        </a>
                      )}
                    </li>
                  );
                })}
              {/* step 2 also holds day 1: the web app topic (planned in the second period) and the gallery (fourth period) */}
              {stage === "2" && (
                <>
                  <li className="item">
                    <span className="status" data-state={chosen ? "done" : !next ? "next" : "todo"}>
                      {chosen ? "고름" : !next ? "다음" : "아직"}
                    </span>
                    <span className="item-text">
                      <Link href={chosen ? `/topics/${chosen.slug}` : "/topics"}>{chosen ? `내 웹앱 주제: ${chosen.title}` : "내 웹앱 주제 고르기"}</Link>
                      <span className="meta">{chosen ? chosen.summary : `${topics.length}가지 중 하나 · 1일차 2교시에 고릅니다`}</span>
                    </span>
                    <Link className="ghost" href="/topics">
                      {chosen ? "주제 바꾸기" : "고르기"}
                    </Link>
                  </li>
                  <li className="item">
                    <span className="status" data-state={!next && chosen ? "next" : "todo"}>
                      {!next && chosen ? "다음" : "아직"}
                    </span>
                    <span className="item-text">
                      <Link href="/me">내 사이트 올리고 서로 좋아요 누르기</Link>
                      <span className="meta">1일차 4교시 · 로그인 → 내 프로젝트 → 갤러리</span>
                    </span>
                    <Link className="ghost" href="/me">
                      내 프로젝트
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </section>
        ))}
      </div>
    </>
  );

  if (drawer)
    return (
      <details className="drawer">
        <summary>
          준비가 먼저라면 · 자료와 웹앱 주제 열기
          <span className="meta">다음: {now.title}</span>
        </summary>
        <div className="drawer-body">{body}</div>
      </details>
    );

  return (
    <>
      {body}
      <p className="repo">
        <span className="meta">전체 자료</span>
        <a href={REPO} target="_blank" rel="noopener">
          github.com/bcchung81/vibe-coding
        </a>
        <CopyButton text={REPO} />
      </p>
    </>
  );
}
