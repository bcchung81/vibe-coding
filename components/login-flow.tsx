"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkPin, logIn, logOut } from "../app/actions";
import { Band } from "./band";
import { Icon } from "./icon";
import { myTopic } from "./my-topic";
import { PinInput } from "./pin-input";
import { sessionChanged } from "./session";

type Step = "pin" | "name" | "done";
type Person = { name: string; team: string };
const STEPS: [Step, string][] = [
  ["pin", "공통 PIN"],
  ["name", "내 이름"],
];

const BANDS: Record<Step, { title: string; lead: string }> = {
  pin: { title: "다음: 공통 PIN 4자리", lead: "공지 문자로 받은 과정 PIN을 넣습니다." },
  name: { title: "다음: 내 이름 고르기", lead: "같은 이름이 있으면 팀으로 구분합니다." },
  done: { title: "로그인했습니다", lead: "다음: 내 사이트 주소 올리기" },
};

// Course-wide PIN first (the server hands out the roster only then), then pick your own name
export function LoginFlow({ me, toSurvey }: { me?: Person; toSurvey?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(me ? "done" : "pin");
  const [pin, setPin] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [roster, setRoster] = useState<(Person & { id: number })[]>([]);
  const [query, setQuery] = useState("");
  const [who, setWho] = useState(me);
  const [pending, start] = useTransition();
  const order = STEPS.findIndex(([s]) => s === step);
  const band = !toSurvey
    ? BANDS[step]
    : step === "done"
      ? { title: BANDS.done.title, lead: "수요조사로 넘어갑니다." }
      : { ...BANDS[step], lead: `${BANDS[step].lead} 로그인하면 수요조사로 돌아갑니다.` };

  const wrongPin = (message: string) => {
    setPin("");
    setAttempt((n) => n + 1);
    setError(message);
    setStep("pin");
  };

  const sendPin = (value: string) =>
    start(async () => {
      const result = await checkPin(value);
      if (!result.ok)
        return wrongPin(result.locked ? "여러 번 틀려 잠시 막았습니다. 10분 뒤에 다시 해 주세요." : "PIN이 맞지 않습니다. 공지 문자를 다시 확인해 주세요.");
      if ("admin" in result) {
        sessionChanged();
        return router.push(toSurvey ? "/survey" : "/admin");
      }
      setPin(value);
      setRoster(result.roster);
      setStep("name");
    });

  const choose = (id: number) =>
    start(async () => {
      const person = await logIn(pin, id, myTopic());
      if (!person) return wrongPin("로그인하지 못했습니다. PIN을 다시 넣어 주세요.");
      setWho(person);
      setStep("done");
      sessionChanged();
      if (toSurvey) router.push("/survey/answer");
    });

  const leave = () =>
    start(async () => {
      await logOut();
      sessionChanged();
      setWho(undefined);
      setPin("");
      setStep("pin");
    });

  return (
    <>
      <Band {...band} action={step === "done" ? (toSurvey ? { href: "/survey/answer", label: "수요조사 답하기" } : { href: "/me", label: "내 프로젝트" }) : undefined} />
      <div className="content">
        <section className="panel login-panel" aria-label="로그인" aria-busy={pending}>
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
              <PinInput key={attempt} label="공통 PIN 4자리" error={Boolean(error)} disabled={pending} onEdit={() => setError("")} onDone={sendPin} />
              <span className={`hint ${error ? "error" : ""}`} aria-live="polite">
                {pending ? "확인하는 중…" : error || "수강생 모두 같은 PIN을 씁니다. 자료 · 갤러리 보기는 로그인 없이 됩니다."}
              </span>
              <span className="hint">강사 · 조교는 여기에 관리 PIN을 넣으면 관리 화면으로 갑니다.</span>
            </div>
          )}

          {step === "name" && (
            <div className="form">
              <label>
                <span>이름 찾기</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 일부를 입력" autoFocus />
              </label>
              {roster.length === 0 ? (
                <p className="hint error">아직 명단이 없습니다. 강사에게 알려 주세요.</p>
              ) : (
                <ul className="names">
                  {roster
                    .filter((r) => r.name.includes(query.trim()))
                    .map((r) => (
                      <li key={r.id}>
                        <button type="button" disabled={pending} onClick={() => choose(r.id)}>
                          <b>{r.name}</b>
                          <span className="meta">{r.team}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
              <span className="hint">내 이름을 골라 주세요. 다른 사람 이름으로 들어가면 그 사람의 사이트가 바뀝니다.</span>
            </div>
          )}

          {step === "done" && who && (
            <p className="who">
              <b>{who.name}</b> · {who.team} 으로 들어왔습니다. <Link href="/me">내 프로젝트</Link>에서 사이트 주소를 올리세요.
              <button className="text-btn" type="button" disabled={pending} onClick={() => (roster.length ? setStep("name") : leave())}>
                이름 다시 고르기
              </button>
              <button className="text-btn" type="button" disabled={pending} onClick={leave}>
                로그아웃
              </button>
            </p>
          )}
        </section>
      </div>
    </>
  );
}
