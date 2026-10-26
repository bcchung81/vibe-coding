"use client";

import { useEffect, useState } from "react";

// 첫 화면: 서버 라우트 /api/data 가 주는 데이터를 받아 그대로 보여 준다.
// 주제에 맞는 화면은 PLAN.md 단계대로 바꾼다.
export default function Home() {
  const [data, setData] = useState<unknown>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/data")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  return (
    <main>
      <h1>내 웹앱</h1>
      <p>에이전트에게 주제 번호와 함께 /vibe-prd 를 부르면 시작합니다.</p>
      {failed ? <p>데이터를 불러오지 못했습니다.</p> : <pre>{data ? JSON.stringify(data, null, 2) : "불러오는 중…"}</pre>}
    </main>
  );
}
