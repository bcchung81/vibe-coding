"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "./copy-button";
import { Icon } from "./icon";
import { markRead, readKeys } from "./read-state";

export type GuideItem = { key: string; stage: string; stageTitle: string; title: string; short: string; name: string; kind: "doc" | "file" };

const REPO = "https://github.com/bcchung81/vibe-coding";
const hrefOf = (item: GuideItem) => `/materials/${item.key}`;
const STAGE_LEAD: Record<string, string> = {
  "1": "교육 전에 읽고 설치할 파일입니다",
  "2": "참여하는 날의 1교시에 받으세요",
  "3": "보고서 도구를 받아 내 에이전트에 설치합니다",
};
const STATUS = { done: "완료", next: "다음", todo: "아직" };

// Handouts by stage. What to do before the course lives on /course; this list only shows what was opened and what comes next
export function Guide({ items }: { items: GuideItem[] }) {
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => setRead(readKeys()), []);

  // the next unread handout of steps 1-2 (day 2 handouts show their state in their own panel)
  const next = items.find((item) => Number(item.stage) <= 2 && !read.includes(item.key));
  const stages = [...new Map(items.map((item) => [item.stage, item.stageTitle])).entries()];

  return (
    <>
      <p className="hint">열어 본 자료와 내려받은 파일은 이 브라우저에 완료로 표시됩니다.</p>
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
            </ul>
          </section>
        ))}
      </div>
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
