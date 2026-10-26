"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";

// A code block from a handout with its own copy button.
// If the clipboard is blocked, the code gets selected so Ctrl+C still works.
export function CodeBlock({ children }: { children: ReactNode }) {
  const pre = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const el = pre.current;
    if (!el) return;
    try {
      await navigator.clipboard.writeText((el.textContent ?? "").replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      getSelection()?.selectAllChildren(el);
    }
  };

  return (
    <div className="code-block">
      <pre ref={pre}>{children}</pre>
      <button className="code-copy" type="button" data-done={copied} onClick={copy}>
        <Icon name={copied ? "check" : "copy"} size={14} />
        <span aria-live="polite">{copied ? "복사했습니다" : "복사"}</span>
      </button>
    </div>
  );
}
