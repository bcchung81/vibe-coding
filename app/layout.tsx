import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_KR } from "next/font/google";
import { TopBar } from "../components/topbar";
import "./globals.css";

const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-noto" });

export const metadata: Metadata = {
  title: { default: "바이브코딩 중급", template: "%s · 바이브코딩 중급" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={noto.variable}>
      <body>
        <TopBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
