"use client";

import { useState } from "react";
import { Icon } from "./icon";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="ghost"
      type="button"
      data-done={copied}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      <Icon name={copied ? "check" : "copy"} size={16} />
      <span aria-live="polite">{copied ? "복사했습니다" : "주소 복사"}</span>
    </button>
  );
}
