import type { CSSProperties } from "react";

// Pastel pairs for the stand-in screens, one per card in turn
const PALETTES = [
  ["#e1edf8", "#254e78"],
  ["#e4ede6", "#305840"],
  ["#f9e9d7", "#754824"],
  ["#e6e5f5", "#4c437e"],
  ["#e0eef0", "#2c5961"],
];

// Which made-up app screen each demo card shows, in DEMO_PROJECTS order
const KINDS = ["weather", "map", "bus", "bars", "seats", "map", "map", "calendar", "days"] as const;
const MAP_LABELS: Record<number, string> = { 2: "도보 5분 · 영업 중", 6: "주차 가능 · 24면", 7: "충전 가능 · 2대" };

// Stand-in for a captured first screen on demo cards: a small made-up app, always labelled 예시 화면
export function FakeShot({ seed, title }: { seed: number; title: string }) {
  const [bg, ink] = PALETTES[(seed + PALETTES.length - 1) % PALETTES.length];
  const kind = KINDS[(seed + KINDS.length - 1) % KINDS.length];
  return (
    <div className="shot" style={{ "--shot-bg": bg, "--shot-ink": ink } as CSSProperties} aria-hidden="true">
      <div className="shot-head">
        <span>{title}</span>
        <span>예시 화면</span>
      </div>
      <div className="shot-body">
        {kind === "weather" && (
          <>
            <div className="shot-row">
              <div>
                출근 시간 · 강수확률
                <b className="shot-big">
                  70<small>%</small>
                </b>
              </div>
              <i className="shot-ring" />
            </div>
            <div className="shot-ticks">
              <span>08시 · 60%</span>
              <span>09시 · 70%</span>
              <span>10시 · 40%</span>
            </div>
          </>
        )}
        {kind === "bus" &&
          [
            ["7016", "3분"],
            ["마포 09", "7분"],
            ["1711", "12분"],
          ].map(([route, wait]) => (
            <div key={route} className="shot-line">
              <span>{route}</span>
              <b>{wait}</b>
            </div>
          ))}
        {kind === "map" && (
          <>
            <div className="shot-map">
              <b>{MAP_LABELS[seed] ?? "가까운 곳부터"}</b>
            </div>
            가까운 곳부터 모아 봅니다
          </>
        )}
        {kind === "bars" && (
          <>
            출근길 미세먼지
            <b className="shot-big">좋음</b>
            <span className="shot-bars">
              {[25, 38, 31, 49, 41, 30, 23].map((h, i) => (
                <i key={i} style={{ height: `${h * 2}%` }} />
              ))}
            </span>
          </>
        )}
        {kind === "seats" && (
          <>
            중앙도서관 · 제1열람실
            <b className="shot-big">
              28<small>석 남음</small>
            </b>
            <span className="shot-seats">
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} data-on={i % 3 === 0} />
              ))}
            </span>
          </>
        )}
        {kind === "calendar" && (
          <>
            이번 달의 축제
            <span className="shot-cal">
              {Array.from({ length: 21 }, (_, i) => (
                <span key={i} data-on={[5, 6, 12, 19].includes(i)}>
                  {i + 1}
                </span>
              ))}
            </span>
          </>
        )}
        {kind === "days" && (
          <>
            우리 동네 배출일
            <b className="shot-big" style={{ fontSize: 32 }}>
              수요일 저녁
            </b>
            <div className="shot-line">
              <span>종이 · 플라스틱 · 캔</span>
              <b>20:00</b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
