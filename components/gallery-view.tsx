"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { DEMO_PROJECTS } from "../lib/demo";
import { recommended, sortGallery, type SortKey } from "../lib/gallery";
import { FakeShot } from "./fake-shot";
import { ProjectCard } from "./project-card";

// Re-sorting glides cards to their new place (View Transitions); without support or with reduced motion it just updates
function withTransition(update: () => void) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  document.startViewTransition(() => flushSync(update));
}

// The wall of everyone's sites: sort, like, and the top three stand out as 추천
export function GalleryWall() {
  const [items, setItems] = useState(DEMO_PROJECTS);
  const [liked, setLiked] = useState<number[]>([]);
  const [sort, setSort] = useState<SortKey>("likes");
  // counts roll only on changes, not on first paint
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);
  const ranks = recommended(items);

  const toggle = (id: number) =>
    withTransition(() => {
      const on = !liked.includes(id);
      setLiked(on ? [...liked, id] : liked.filter((x) => x !== id));
      setItems(items.map((p) => (p.id === id ? { ...p, likes: p.likes + (on ? 1 : -1) } : p)));
    });

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
          사이트 {items.length}개 · 상위 3개 추천{liked.length > 0 && ` · 내 좋아요 ${liked.length}개`}
        </span>
      </div>
      <div className="cards" data-live={live}>
        {sortGallery(items, sort).map((p) => (
          <ProjectCard
            key={p.id}
            p={p}
            shot={<FakeShot seed={p.id} title={p.app} />}
            rank={ranks.get(p.id)}
            liked={liked.includes(p.id)}
            open={false}
            onLike={() => toggle(p.id)}
          />
        ))}
      </div>
    </section>
  );
}
