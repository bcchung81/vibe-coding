"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DEMO_PIN, DEMO_ROSTER } from "../lib/demo";
import { Band } from "./band";
import { Icon } from "./icon";

type Step = "pin" | "name" | "done";
const STEPS: [Step, string][] = [
  ["pin", "공통 PIN"],
  ["name", "내 이름"],
];

const BANDS: Record<Step, { title: string; lead: string }> = {
  pin: { title: "다음: 공통 PIN 4자리", lead: `공지 문자로 받은 과정 PIN을 넣습니다 · 예시 ${DEMO_PIN}` },
  name: { title: "다음: 내 이름 고르기", lead: "같은 이름이 있으면 팀으로 구분합니다." },
  done: { title: "로그인했습니다", lead: "다음: 내 사이트 주소 올리기" },
};

// Course-wide PIN first (it gates the roster), then pick your own name
export function LoginFlow() {
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState(false);
  const [query, setQuery] = useState("");
  const [who, setWho] = useState<{ name: string; team: string }>();
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const order = STEPS.findIndex(([s]) => s === step);

  const typePin = (i: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return;
    const next = [...pin];
    // typing or pasting fills forward from this box
    digits.split("").slice(0, 4 - i).forEach((d, k) => (next[i + k] = d));
    setPinError(false);
    const empty = next.findIndex((d) => !d);
    if (empty !== -1) {
      setPin(next);
      boxes.current[empty]?.focus();
    } else if (next.join("") === DEMO_PIN) {
      setPin(next);
      setStep("name");
    } else {
      setPin(["", "", "", ""]);
      setPinError(true);
      boxes.current[0]?.focus();
    }
  };

  return (
    <>
      <Band {...BANDS[step]} action={step === "done" ? { href: "/me", label: "내 프로젝트" } : undefined} />
      <div className="content">
        <section className="panel login-panel" aria-label="로그인">
          <ol className="stepper">
            {STEPS.map(([s, label], i) => (
              <li key={s} data-state={step === "done" || i < order ? "done" : i === order ? "now" : "todo"}>
                <span className="mark">{step === "done" || i < order ? <Icon name="check" size={16} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>

          {step === "pin" && (
            <div className="form">
              <div className="pin" role="group" aria-label="공통 PIN 4자리" data-error={pinError}>
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
                    aria-label={`${i + 1}번째 숫자`}
                    aria-invalid={pinError}
                    onChange={(e) => typePin(i, e.target.value.slice(-4))}
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
              <span className={`hint ${pinError ? "error" : ""}`} aria-live="polite">
                {pinError ? "PIN이 맞지 않습니다. 공지 문자를 다시 확인해 주세요." : "수강생 모두 같은 PIN을 씁니다. 자료 · 갤러리 보기는 로그인 없이 됩니다."}
              </span>
            </div>
          )}

          {step === "name" && (
            <div className="form">
              <label>
                <span>이름 찾기</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 일부를 입력" autoFocus />
              </label>
              <ul className="names">
                {DEMO_ROSTER.filter((r) => r.name.includes(query.trim())).map((r) => (
                  <li key={`${r.name}-${r.team}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setWho(r);
                        setStep("done");
                      }}
                    >
                      <b>{r.name}</b>
                      <span className="meta">{r.team}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <span className="hint">내 이름을 골라 주세요. 다른 사람 이름으로 들어가면 그 사람의 사이트가 바뀝니다.</span>
            </div>
          )}

          {step === "done" && who && (
            <p className="who">
              <b>{who.name}</b> · {who.team} 으로 들어왔습니다. <Link href="/me">내 프로젝트</Link>에서 사이트 주소를 올리세요.
              <button className="text-btn" type="button" onClick={() => setStep("name")}>
                이름 다시 고르기
              </button>
            </p>
          )}
        </section>
      </div>
    </>
  );
}
