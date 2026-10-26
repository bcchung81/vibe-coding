"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icon";

export type BandAction = { href: string; label: string; download?: string };

// The page title: what this screen is for in one big line, and the one next action on the right.
// When the line changes after the first paint it fades in, so the change is seen.
export function Band({ title, lead, action }: { title: string; lead?: string; action?: BandAction }) {
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);
  const flip = live ? "flip" : undefined;
  return (
    <section className="band" aria-labelledby="band-title">
      <div className="band-text" aria-live="polite">
        <h1 id="band-title">
          <span key={title} className={flip}>
            {title}
          </span>
        </h1>
        {lead && (
          <p key={lead} className={flip}>
            {lead}
          </p>
        )}
      </div>
      {action &&
        (action.download ? (
          <a className="btn-primary" href={action.href} download={action.download}>
            {action.label}
            <Icon name="download" size={18} />
          </a>
        ) : (
          <Link className="btn-primary" href={action.href}>
            {action.label}
            <Icon name="arrow" size={18} />
          </Link>
        ))}
    </section>
  );
}
