import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "내 웹앱" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
