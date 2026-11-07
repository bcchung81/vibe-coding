"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminLogOut } from "../app/actions";
import { sessionChanged, useWho, type Who } from "./session";

type Item = { href: string; title: string; match: string | string[]; show?: (who: Who) => boolean; page?: true };

// In the order trainees use the hub: the course guide before the course, then the handouts, the day-1 topic and the class deck.
// The deck (/slides) is its own page outside the hub's layout, so it is a plain link. Only the admin logs in; 관리 shows once that cookie is there.
const NAV: Item[] = [
  { href: "/course", title: "교육 안내", match: "/course" },
  { href: "/materials", title: "자료", match: "/materials" },
  { href: "/topics", title: "웹앱 주제", match: "/topics" },
  { href: "/slides", title: "발표", match: "/slides", page: true },
  { href: "/admin", title: "관리", match: "/admin", show: (w) => w.admin },
];

const GUEST: Who = { admin: false };

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
        {items.map((item) =>
          item.page ? (
            <a key={item.href} href={item.href}>
              {item.title}
            </a>
          ) : (
            <Link key={item.href} href={item.href} aria-current={here(item.match) ? "page" : undefined}>
              {item.title}
            </Link>
          ),
        )}
      </nav>
      <div className="topbar-end" aria-busy={who === null}>
        {who?.admin && (
          <button className="login" type="button" disabled={pending} onClick={() => leave(adminLogOut)}>
            관리자 로그아웃
          </button>
        )}
      </div>
    </header>
  );
}
