"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { likeProject } from "../app/actions";
import type { GalleryRow } from "../lib/db";
import { recommended, sortGallery, type SortKey } from "../lib/gallery";
import { ProjectCard } from "./project-card";

// Re-sorting glides cards to their new place (View Transitions); without support or with reduced motion it just updates
function withTransition(update: () => void) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  document.startViewTransition(() => flushSync(update));
}

// The wall of everyone's sites: sort, like (logged-in trainees, not their own), and the top three stand out as 추천
export function GalleryWall({ projects, liked: likedFirst, myId }: { projects: GalleryRow[]; liked: number[]; myId: number | null }) {
  const [items, setItems] = useState(projects);
  const [liked, setLiked] = useState(likedFirst);
  const [sort, setSort] = useState<SortKey>("likes");
  const [needLogin, setNeedLogin] = useState(false);
  // counts roll only on changes, not on first paint
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);
  const ranks = recommended(items);

  const apply = (id: number, on: boolean, likes: number) =>
    withTransition(() => {
      setLiked((l) => (on ? [...l.filter((x) => x !== id), id] : l.filter((x) => x !== id)));
      setItems((list) => list.map((p) => (p.id === id ? { ...p, likes } : p)));
    });

  const toggle = async (id: number) => {
    if (myId === null) return setNeedLogin(true);
    const p = items.find((x) => x.id === id)!;
    const on = !liked.includes(id);
    apply(id, on, p.likes + (on ? 1 : -1));
    const result = await likeProject(id).catch(() => null);
    if (result) apply(id, result.liked, result.likes);
    else apply(id, !on, p.likes);
  };

  return (
    <section className="wall" aria-label="갤러리">
      <div className="panel-head">
        <div className="tabs" role="group" aria-label="정렬">
          {(["likes", "recent"] as const).map((key) => (
            <button key={key} type="button" aria-pressed={sort === key} onClick={() => withTransition(() => setSort(key))}>
              {key === "likes" ? "좋아요순" : "최신순"}
            </button>
          ))}
        </div>
        <span className="meta" aria-live="polite">
          {needLogin ? (
            <>
              좋아요는 <Link href="/login">로그인</Link>한 수강생만 누를 수 있습니다
            </>
          ) : (
            <>
              사이트 {items.length}개 · 상위 3개 추천{liked.length > 0 && ` · 내 좋아요 ${liked.length}개`}
            </>
          )}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="wall-empty">아직 올라온 사이트가 없습니다. 1일차 4교시에 배포한 주소를 올리면 여기에 모입니다.</p>
      ) : (
        <div className="cards" data-live={live}>
          {sortGallery(items, sort).map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              shot={
                p.shot ? (
                  <img className="shot-img" src={p.shot} alt={`${p.app} 첫 화면`} width={1280} height={800} loading="lazy" />
                ) : (
                  <div className="shot-empty" data-state={p.status === "pending" ? "pending" : undefined}>
                    {p.status === "pending" ? "첫 화면을 찍는 중" : p.app}
                  </div>
                )
              }
              rank={ranks.get(p.id)}
              liked={liked.includes(p.id)}
              mine={p.id === myId}
              onLike={() => toggle(p.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
