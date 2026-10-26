"use client";

import type { ReactNode } from "react";
import { Icon } from "./icon";

export type CardProject = { id: number; app: string; tagline: string; url: string; name: string; team: string; likes: number };

// One card on the wall: the first screen leads, the words sit under it. `open` is false for demo addresses, which belong to nobody here.
export function ProjectCard({
  p,
  shot,
  rank,
  liked = false,
  mine = false,
  open = true,
  onLike,
}: {
  p: CardProject;
  shot: ReactNode;
  rank?: number;
  liked?: boolean;
  mine?: boolean;
  open?: boolean;
  onLike?: () => void;
}) {
  const host = p.url.replace(/^https:\/\//, "");
  const linked = open && p.url;
  return (
    <article className="card" style={{ viewTransitionName: `card-${p.id}` }}>
      {linked ? (
        <a className="card-shot" href={p.url} target="_blank" rel="noopener" aria-label={`${p.app} 사이트 열기 · 새 탭`}>
          {shot}
        </a>
      ) : (
        <div className="card-shot">{shot}</div>
      )}
      <div className="card-body">
        <div className="card-title">
          {rank && <span className="rank">추천 {rank}</span>}
          <h3>
            {linked ? (
              <a href={p.url} target="_blank" rel="noopener">
                {p.app}
              </a>
            ) : (
              p.app
            )}
          </h3>
        </div>
        <p>{p.tagline}</p>
        {host && <span className="card-url">{host}</span>}
        <div className="card-foot">
          <span>
            {p.name} · {p.team}
          </span>
          <button className="like" type="button" aria-pressed={liked} disabled={mine || !onLike} onClick={onLike} aria-label={mine ? `내 사이트 · 좋아요 ${p.likes}` : `좋아요 ${p.likes}`}>
            <Icon name="heart" size={18} />
            <span className="count">
              <span key={p.likes}>{p.likes}</span>
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
