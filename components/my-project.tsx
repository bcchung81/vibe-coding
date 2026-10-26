"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { myCapture, saveMyProject } from "../app/actions";
import type { Capture, SavedProject } from "../lib/db";
import { checkSiteUrl } from "../lib/site-url";
import { Band } from "./band";
import { ProjectCard } from "./project-card";

// Address, name and one line, saved for the logged-in trainee. Saving (or saving again) has the server capture the first screen.
export function MyProject({ me, saved: first, capture: firstCapture }: { me: { name: string; team: string }; saved: SavedProject | null; capture: Capture }) {
  const [saved, setSaved] = useState(first);
  const [capture, setCapture] = useState(firstCapture);
  const [url, setUrl] = useState(first?.url ?? "");
  const [touched, setTouched] = useState(false);
  const [app, setApp] = useState(first?.app ?? "");
  const [tagline, setTagline] = useState(first?.tagline ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const check = checkSiteUrl(url);
  // judge once the address looks finished, not on every keystroke
  const judged = touched || url.includes(".vercel.app");
  const changed = !saved || saved.url !== (check.ok ? check.url : url) || saved.app !== app.trim() || saved.tagline !== tagline.trim();
  const shooting = capture.status === "pending";

  // while the server is capturing, ask every 3 seconds (it takes about 15)
  useEffect(() => {
    if (!shooting) return;
    const timer = setInterval(() => myCapture().then((c) => c && c.status !== "pending" && setCapture(c)), 3000);
    return () => clearInterval(timer);
  }, [shooting]);

  const save = () =>
    start(async () => {
      const result = await saveMyProject({ url, app, tagline });
      if ("error" in result) return setError(result.error ?? "");
      setError("");
      setSaved(result.saved);
      setUrl(result.saved.url);
      setCapture((c) => ({ ...c, status: "pending" }));
    });

  const band = !check.ok
    ? { title: "다음: 사이트 주소 넣기", lead: "Vercel 프로젝트의 기본 주소 https://<이름>.vercel.app 를 넣습니다." }
    : !app.trim()
      ? { title: "다음: 앱 이름과 한 줄 소개", lead: "갤러리 카드에 그대로 보입니다." }
      : changed
        ? { title: "다음: 저장하기", lead: "저장하면 서버가 내 사이트의 첫 화면을 찍어 갤러리에 올립니다." }
        : shooting
          ? { title: "첫 화면을 찍는 중입니다", lead: "15초쯤 걸립니다. 다 찍히면 갤러리에 바로 올라갑니다." }
          : capture.status === "failed"
            ? { title: "첫 화면을 찍지 못했습니다", lead: "사이트가 열리는지 확인하고 '다시 찍기'를 누르세요." }
            : { title: "갤러리에 올라갔습니다", lead: "다음: 다른 사람 사이트에 좋아요 누르기", action: { href: "/", label: "갤러리 보기" } };

  return (
    <>
      <Band {...band} />
      <div className="content split">
        <form
          className="panel form"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (check.ok && app.trim()) save();
          }}
        >
          <h2>내 사이트</h2>
          <p className="meta">
            {me.name} · {me.team} · <Link href="/login">내가 아니면 다시 로그인</Link>
          </p>
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
            <button className="btn-primary" type="submit" disabled={pending || shooting}>
              {pending ? "저장하는 중…" : shooting ? "찍는 중…" : changed ? "저장" : "다시 찍기"}
            </button>
            {error && (
              <span className="hint error" role="alert">
                {error}
              </span>
            )}
          </div>
        </form>
        <section className="preview" aria-labelledby="preview-title">
          <h2 id="preview-title">갤러리에 이렇게 보입니다</h2>
          <ProjectCard
            p={{ id: 0, app: app || "앱 이름", tagline: tagline || "한 줄 소개", url: check.ok ? check.url : "", name: me.name, team: me.team, likes: 0 }}
            shot={
              capture.shot && !shooting ? (
                <img className="shot-img" src={capture.shot} alt={`${app} 첫 화면`} width={1280} height={800} />
              ) : (
                <div className="shot-empty" data-state={shooting ? "pending" : undefined}>
                  {shooting ? "첫 화면을 찍는 중" : capture.status === "failed" ? "찍지 못했습니다 · 다시 찍기" : "저장하면 첫 화면을 찍습니다"}
                </div>
              )
            }
            mine
            open={Boolean(saved)}
          />
        </section>
      </div>
    </>
  );
}
