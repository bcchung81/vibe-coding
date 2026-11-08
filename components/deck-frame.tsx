"use client";

import { useEffect, useRef } from "react";

// The deck (/slides/deck) inside the hub's content area. Keys go to the deck as soon as it loads, so → · Space work without a click;
// F and the opening video still go full screen.
export function DeckFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const focus = () => frame.contentWindow?.focus();
    if (frame.contentDocument?.readyState === "complete") focus();
    frame.addEventListener("load", focus);
    return () => frame.removeEventListener("load", focus);
  }, []);
  return <iframe ref={ref} className="deck-frame" src="/slides/deck" title="발표 덱" allow="fullscreen; autoplay" allowFullScreen />;
}
