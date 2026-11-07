"use client";

import { useEffect, useState } from "react";
import { CodeBlock } from "./code-block";
import { Icon } from "./icon";

// Day 2, period 3: the deck starter folder, next to the handouts
export function DeckStart() {
  // the download command names this site's own address, so it works from whichever URL the page was opened at
  const [origin, setOrigin] = useState("https://kca-vibe.vercel.app");
  useEffect(() => setOrigin(location.origin), []);

  return (
    <section id="deck-folder" className="panel setup" aria-labelledby="deck-title">
      <div className="setup-head">
        <div>
          <h2 id="deck-title">2일차 덱 시작 폴더</h2>
          <p className="meta">Windows PowerShell · C:\workspace\deck — 예시 덱 6장 · 3D 장면 3개 · 명령 3개 · 영상 만들기가 들어 있습니다. 2일차 3교시에 받습니다.</p>
        </div>
        <a className="ghost" href="/deck.zip" download="deck.zip">
          <Icon name="download" size={16} />
          deck.zip 내려받기
        </a>
      </div>
      <ol className="start-steps">
        <li>
          <p>PowerShell에 한 줄을 붙여 넣어 내려받고 풉니다.</p>
          <CodeBlock>{`Invoke-WebRequest ${origin}/deck.zip -OutFile $env:TEMP\\deck.zip; Expand-Archive $env:TEMP\\deck.zip C:\\workspace\\deck`}</CodeBlock>
        </li>
        <li>
          <p>그 폴더에서 에이전트를 열고 말합니다.</p>
          <code>시작하기.md 대로 준비해줘</code>
        </li>
        <li>
          <p>새 창에서 덱을 켜고 브라우저로 http://localhost:5173 을 엽니다.</p>
          <code>cd C:\workspace\deck; npm.cmd run dev</code>
        </li>
      </ol>
    </section>
  );
}
