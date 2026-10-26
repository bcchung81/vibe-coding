"use client";

import { useEffect, useState } from "react";
import { markRead } from "./read-state";

export type TocEntry = { id: string; text: string };

// Marks the handout as read, shows how far down you are, and highlights the section you are in
export function DocNav({ readKey, toc }: { readKey: string; toc: TocEntry[] }) {
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(toc[0]?.id);

  useEffect(() => {
    markRead(readKey);
    const headings = toc.map(({ id }) => document.getElementById(id)).filter((el) => el !== null);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setProgress(max > 0 ? Math.min(1, scrollY / max) : 1);
      // the section you are in = the last heading above the top third of the screen
      const passed = headings.filter((el) => el.getBoundingClientRect().top < innerHeight / 3);
      setCurrent((passed.at(-1) ?? headings[0])?.id);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, [readKey, toc]);

  return (
    <>
      <div className="read-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      {toc.length >= 3 && (
        <nav className="toc" aria-label="이 문서의 목차">
          <ol>
            {toc.map(({ id, text }) => (
              <li key={id}>
                <a href={`#${id}`} aria-current={id === current ? "location" : undefined}>
                  {text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </>
  );
}
