"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminLogOut, logOut } from "../app/actions";
import { sessionChanged, useWho, type Who } from "./session";

type Item = { href: string; title: string; match: string | string[]; show?: (who: Who) => boolean };

// In the order trainees use the hub: the course guide before the course,
// the handouts, the topic, their own site and the gallery on day 1.
const NAV: Item[] = [
  { href: "/course", title: "교육 안내", match: "/course" },
  { href: "/materials", title: "자료", match: "/materials" },
  { href: "/topics", title: "웹앱 주제", match: "/topics" },
  { href: "/me", title: "내 프로젝트", match: "/me", show: (w) => Boolean(w.student) },
  { href: "/gallery", title: "갤러리", match: "/gallery" },
  { href: "/admin", title: "관리", match: "/admin", show: (w) => w.admin },
];

const GUEST: Who = { student: null, admin: false };

// Navy bar; an ochre underline marks where you are. Until the session answer comes, it shows what anyone may see.
export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const who = useWho();
  const [pending, start] = useTransition();
  const here = (match: string | string[]) => [match].flat().some((m) => pathname.startsWith(m));
  const items = NAV.filter((item) => !item.show || item.show(who ?? GUEST));

  // pages that need the login send the person on after the refresh
  const leave = (action: () => Promise<void>) =>
    start(async () => {
      await action();
      sessionChanged();
      router.refresh();
    });

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        바이브코딩 중급
      </Link>
      <nav aria-label="주 메뉴" data-count={items.length}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-current={here(item.match) ? "page" : undefined}>
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="topbar-end" aria-busy={who === null}>
        {who?.student && (
          <>
            <Link className="who-name" href="/login" aria-current={here("/login") ? "page" : undefined} title="이름 다시 고르기">
              {who.student.name}
              {who.student.team && <span>{who.student.team}</span>}
            </Link>
            <button className="login" type="button" disabled={pending} onClick={() => leave(logOut)}>
              로그아웃
            </button>
          </>
        )}
        {who?.admin && (
          <button className="login" type="button" disabled={pending} onClick={() => leave(adminLogOut)}>
            관리자 로그아웃
          </button>
        )}
        {who && !who.student && !who.admin && (
          <Link className="login" href="/login" aria-current={here("/login") ? "page" : undefined}>
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
