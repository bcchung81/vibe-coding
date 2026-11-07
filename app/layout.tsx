import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TopBar } from "../components/topbar";
// Pretendard (OFL), the deck's typeface; the dynamic subset loads only the Korean blocks a page uses
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "바이브코딩 중급", template: "%s · 바이브코딩 중급" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <TopBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
