"use client";

import { useState } from "react";
import { DEMO_ME } from "../lib/demo";
import { checkSiteUrl } from "../lib/site-url";
import { Band } from "./band";
import { FakeShot } from "./fake-shot";
import { ProjectCard } from "./project-card";

type Capture = "none" | "pending" | "done";

// Demo: the real capture runs on the server in S2 (measured 11–20 s); here it is simulated
const DEMO_CAPTURE_MS = 2600;

export function MyProject() {
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [app, setApp] = useState("");
  const [tagline, setTagline] = useState("");
  const [capture, setCapture] = useState<Capture>("none");
  const check = checkSiteUrl(url);
  // judge once the address looks finished, not on every keystroke
  const judged = touched || url.includes(".vercel.app");

  const shoot = () => {
    setCapture("pending");
    setTimeout(() => setCapture("done"), DEMO_CAPTURE_MS);
  };

  const band = !check.ok
    ? { title: "다음: 사이트 주소 넣기", lead: "Vercel 프로젝트의 기본 주소 https://<이름>.vercel.app 를 넣습니다." }
    : !app.trim()
      ? { title: "다음: 앱 이름과 한 줄 소개", lead: "갤러리 카드에 그대로 보입니다." }
      : capture === "none"
        ? { title: "다음: 저장하기", lead: "저장하면 서버가 내 사이트의 첫 화면을 찍습니다." }
        : capture === "pending"
          ? { title: "첫 화면을 찍는 중입니다", lead: "다 찍히면 갤러리에 바로 올라갑니다." }
          : { title: "갤러리에 올라갔습니다", lead: "다음: 다른 사람 사이트에 좋아요 누르기", action: { href: "/", label: "갤러리 보기" } };

  const shot =
    capture === "done" ? (
      <FakeShot seed={3} title={app || "내 앱"} />
    ) : (
      <div className="shot-empty" data-state={capture}>
        {capture === "pending" ? "첫 화면을 찍는 중" : "저장하면 첫 화면을 찍습니다"}
      </div>
    );

  return (
    <>
      <Band {...band} />
      <div className="content split">
        <form
          className="panel form"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (check.ok && app.trim()) shoot();
          }}
        >
          <h2>내 사이트</h2>
          <label>
            <span>사이트 주소</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="https://my-app.vercel.app"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={judged && !check.ok}
              aria-describedby="url-hint"
            />
            <span id="url-hint" className={`hint ${check.ok ? "ok" : judged ? "error" : ""}`} aria-live="polite">
              {check.ok ? `확인했습니다 · ${check.url}` : judged ? check.reason : "Vercel 프로젝트 화면의 Domains에 있는 주소"}
            </span>
          </label>
          <label>
            <span>앱 이름</span>
            <input value={app} onChange={(e) => setApp(e.target.value)} maxLength={20} placeholder="예: 우산 챙겨?" />
            <span className="hint">{app.length} / 20</span>
          </label>
          <label>
            <span>한 줄 소개</span>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={40} placeholder="누가 무엇을 바로 알 수 있나요?" />
            <span className="hint">{tagline.length} / 40</span>
          </label>
          <div className="tools">
            <button className="btn-primary" type="submit" disabled={capture === "pending"}>
              {capture === "pending" ? "찍는 중…" : capture === "done" ? "다시 저장하고 찍기" : "저장"}
            </button>
          </div>
        </form>
        <section className="preview" aria-labelledby="preview-title">
          <h2 id="preview-title">갤러리에 이렇게 보입니다</h2>
          <ProjectCard
            p={{ id: 0, app: app || "앱 이름", tagline: tagline || "한 줄 소개", url: check.ok ? check.url : "", name: DEMO_ME.name, team: DEMO_ME.team, likes: 0 }}
            shot={shot}
            mine
            open={capture === "done"}
          />
        </section>
      </div>
    </>
  );
}
