"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The wall comes first; preparation and your own site follow
const NAV = [
  { href: "/", title: "갤러리" },
  { href: "/materials", title: "자료" },
  { href: "/topics", title: "웹앱 주제" },
  { href: "/me", title: "내 프로젝트" },
];

// Dark plum bar; a pale underline marks where you are
export function TopBar() {
  const pathname = usePathname();
  const here = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const mark = (href: string) => (here(href) ? "page" : undefined);
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        바이브코딩 중급
      </Link>
      <nav aria-label="주 메뉴">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} aria-current={mark(item.href)}>
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="topbar-end">
        <Link href="/admin" aria-current={mark("/admin")}>
          관리
        </Link>
        <Link className="login" href="/login" aria-current={mark("/login")}>
          로그인
        </Link>
      </div>
    </header>
  );
}
