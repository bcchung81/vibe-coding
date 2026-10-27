"use client";

import { useEffect, useRef, useState } from "react";

// Four boxes for a 4-digit PIN. Typing or pasting fills forward from the box; the fourth digit sends it.
// To clear it after a wrong PIN, give it a new `key` (it comes back empty with the first box focused).
export function PinInput({ label, error, disabled, onEdit, onDone }: { label: string; error: boolean; disabled: boolean; onEdit: () => void; onDone: (pin: string) => void }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  // back from checking a wrong PIN: the boxes come back empty, so the first one takes the typing again
  useEffect(() => {
    if (!disabled && pin.every((d) => !d)) boxes.current[0]?.focus();
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const type = (i: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return;
    const next = [...pin];
    digits.split("").slice(0, 4 - i).forEach((d, k) => (next[i + k] = d));
    onEdit();
    setPin(next);
    const empty = next.findIndex((d) => !d);
    if (empty !== -1) return boxes.current[empty]?.focus();
    onDone(next.join(""));
  };

  return (
    <div className="pin" role="group" aria-label={label} data-error={error}>
      {pin.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete="off"
          placeholder="·"
          autoFocus={i === 0}
          disabled={disabled}
          aria-label={`${i + 1}번째 숫자`}
          aria-invalid={error}
          onChange={(e) => type(i, e.target.value.slice(-4))}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) {
              const next = [...pin];
              next[i - 1] = "";
              setPin(next);
              boxes.current[i - 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
