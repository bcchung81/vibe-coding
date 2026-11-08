// Topic card 07 on a map (/topics/map): rows of KCA "의무측정무선국에 따른 전자파 노출지수" → stations to draw.
// The API spec's field descriptions are shifted by one; the names below follow the values that actually arrive (card 07).

export type RawStation = {
  mesureRceptNo?: string;
  callNm?: string;
  fcltyNm?: string;
  opertNm?: string;
  mesureDe?: string;
  expsrIdexVal?: number;
  mesureVal?: number;
  ermtwInStdrVal?: number;
  gisBassAdres?: string;
  rdostGpsLaVal?: number;
  rdostGpsLoVal?: number;
  distance?: number;
};

export type Station = {
  key: string;
  name: string;
  carrier: string;
  meters: number;
  percent: number | null;
  level: number;
  measured: number | null;
  limit: number | null;
  date: string;
  address: string;
  agency: string;
  lat: number;
  lon: number;
};

// Exposure as a share of the protection limit (index × 100). The size (px) of a spot's marker on the map and the
// legend read this one table; a spot takes the band of its strongest station.
export const LEVELS = [
  { max: 0.01, label: "0.01% 미만", size: 18 },
  { max: 0.1, label: "0.01 ~ 0.1%", size: 22 },
  { max: 1, label: "0.1 ~ 1%", size: 28 },
  { max: Infinity, label: "1% 이상", size: 36 },
] as const;

// Rows that came without a measurement
export const NO_VALUE = -1;

export function sizeOf(level: number) {
  return level === NO_VALUE ? LEVELS[0].size : LEVELS[level].size;
}

export function levelOf(percent: number | null) {
  return percent == null ? NO_VALUE : LEVELS.findIndex((l) => percent < l.max);
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

const AGENCY: Record<string, string> = { ITSELF: "자체 측정", KCA: "KCA 측정" };

// Drop rows without a position, nearest first. Receipt numbers repeat, so the key also carries the row's place.
export function toStations(list: RawStation[]): Station[] {
  return list
    .flatMap((r, i) => {
      const lat = num(r.rdostGpsLaVal);
      const lon = num(r.rdostGpsLoVal);
      if (lat == null || lon == null || lat === 0 || lon === 0) return [];
      const index = num(r.expsrIdexVal);
      const percent = index == null ? null : index * 100;
      return [
        {
          key: `${r.mesureRceptNo ?? "row"}-${i}`,
          name: r.callNm?.trim() || "이름 없는 무선국",
          carrier: r.fcltyNm?.trim() || "기타",
          meters: Math.round((num(r.distance) ?? 0) * 1000),
          percent,
          level: levelOf(percent),
          measured: num(r.mesureVal),
          limit: num(r.ermtwInStdrVal),
          date: r.mesureDe ?? "",
          address: r.gisBassAdres?.trim() ?? "",
          agency: AGENCY[r.opertNm ?? ""] ?? r.opertNm ?? "",
          lat,
          lon,
        },
      ];
    })
    .sort((a, b) => a.meters - b.meters);
}

// 0.0029 → "기준의 0.0029%"; the smallest values read as "under", missing ones say so
export function percentText(percent: number | null) {
  if (percent == null) return "측정값 없음";
  if (percent < 0.001) return "기준의 0.001% 미만";
  return `기준의 ${Number(percent.toPrecision(2))}%`;
}

// "20161021" → "2016. 10. 21."
export function dateText(day: string) {
  const m = day.match(/^(\d{4})(\d{2})(\d{2})$/);
  return m ? `${m[1]}. ${Number(m[2])}. ${Number(m[3])}.` : "";
}

export function metersText(meters: number) {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

// Carrier colours belong to the carrier, never to its count or rank: SKT, KT, LGU+ take series tokens 1 · 2 · 3
// (globals.css --carrier-*) and every other name folds into grey "기타". Points can sit next to any other point, so only
// three hues are used — the most that stay apart for every pair under colour-blind simulation (dataviz check).
export const CARRIERS = ["SKT", "KT", "LGU+"] as const;

export function carrierColor(name: string) {
  const slot = CARRIERS.indexOf(name as (typeof CARRIERS)[number]);
  return slot < 0 ? "var(--muted)" : `var(--carrier-${slot + 1})`;
}

// Carriers present, in the fixed order (then the rest by count), with how many stations each has — for the filter tabs
export function carriersOf(stations: Station[]) {
  const counts = new Map<string, number>();
  for (const s of stations) counts.set(s.carrier, (counts.get(s.carrier) ?? 0) + 1);
  const rank = (name: string) => {
    const slot = CARRIERS.indexOf(name as (typeof CARRIERS)[number]);
    return slot < 0 ? CARRIERS.length : slot;
  };
  return [...counts].sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1]).map(([name, count]) => ({ name, count }));
}

// A ring of `meters` around a point, as [lon, lat] pairs for a GeoJSON polygon
export function ring(lat: number, lon: number, meters: number, steps = 64): [number, number][] {
  const dLat = meters / 111320;
  const dLon = meters / (111320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)];
  });
}

// "#ffffff" to "#193957" at t (0 → first, 1 → second): the map cannot read CSS color-mix, so mix the tokens here.
// The built CSS shortens colours ("#fff"), so both lengths are read.
export function mixHex(from: string, to: string, t: number) {
  const rgb = (h: string) => {
    const hex = h.length === 4 ? `#${[...h.slice(1)].map((c) => c + c).join("")}` : h;
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  };
  const [a, b] = [rgb(from), rgb(to)];
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

// "서울특별시 중구 세종대로 110, (태평로1가)" → "세종대로 110": the title only needs the road and number
export function shortAddress(address: string) {
  const parts = address.replace(/\s*\(.*?\)\s*/g, " ").replace(/[\s,]+$/, "").trim().split(/\s+/);
  let i = 0;
  if (/(특별시|광역시|특별자치시|도)$/.test(parts[i] ?? "")) i++;
  for (let k = 0; k < 2; k++) if (/(시|군|구)$/.test(parts[i] ?? "") && parts.length - i > 2) i++;
  return parts.slice(i).join(" ");
}

type Place = { lat: number; lon: number };

const POINTS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];

// Where a spot lies from the searched address, in words: "북동쪽 120m", or right beside it
export function directionText(from: Place, to: Place, meters: number) {
  if (meters < 20) return `찾은 주소 바로 옆 · ${meters}m`;
  const dy = to.lat - from.lat;
  const dx = (to.lon - from.lon) * Math.cos((from.lat * Math.PI) / 180);
  const deg = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  return `${POINTS[Math.round(deg / 45) % 8]}쪽 ${meters}m`;
}

export type Group = { key: string; label: string; meters: number; lat: number; lon: number; stations: Station[]; top: number | null };

const strongest = (a: number | null, b: number | null) => (a == null ? b : b == null ? a : Math.max(a, b));
const byStrength = (a: number | null, b: number | null) => (b ?? -1) - (a ?? -1);

// Stations on the same spot (about 20m cells) as one row. The registered address can be another city, so position,
// not address, decides the group. Inside a group the strongest comes first; groups go nearest or strongest first.
export function groupStations(stations: Station[], center: Place | null, order: "near" | "strong"): Group[] {
  const cells = new Map<string, Station[]>();
  for (const s of stations) {
    const key = `${Math.round(s.lat * 5000)}:${Math.round(s.lon * 4000)}`;
    cells.set(key, [...(cells.get(key) ?? []), s]);
  }
  const groups = [...cells].map(([key, list]) => {
    const near = list.reduce((a, b) => (b.meters < a.meters ? b : a));
    const top = list.reduce<number | null>((t, s) => strongest(t, s.percent), null);
    const label = center ? directionText(center, near, near.meters) : `${near.meters}m`;
    return { key, label, meters: near.meters, lat: near.lat, lon: near.lon, stations: [...list].sort((a, b) => byStrength(a.percent, b.percent)), top };
  });
  return groups.sort((a, b) => (order === "near" ? a.meters - b.meters || byStrength(a.top, b.top) : byStrength(a.top, b.top) || a.meters - b.meters));
}

export type Summary = { count: number; measured: number; top: Station | null; over1: number; over: number };

// The page's one-line answer: the strongest station, how many pass 1% and 100% of the protection limit
export function summarize(stations: Station[]): Summary {
  const measured = stations.filter((s) => s.percent != null);
  const top = measured.reduce<Station | null>((t, s) => (t == null || (s.percent ?? 0) > (t.percent ?? 0) ? s : t), null);
  return { count: stations.length, measured: measured.length, top, over1: measured.filter((s) => (s.percent ?? 0) >= 1).length, over: measured.filter((s) => (s.percent ?? 0) >= 100).length };
}

export function verdictText(summary: Summary) {
  if (!summary.measured) return "측정값이 있는 무선국이 없습니다";
  if (summary.over) return `인체보호 기준을 넘는 곳이 ${summary.over}곳 있습니다`;
  return (summary.top?.percent ?? 0) < 10 ? "모두 인체보호 기준의 1/10 아래입니다" : "모두 인체보호 기준 아래입니다";
}

// A spot's donut: each carrier's share of its stations as an arc, in the fixed carrier order (conic-gradient)
export function mixGradient(mix: { name: string; count: number }[]) {
  const total = mix.reduce((n, m) => n + m.count, 0) || 1;
  let at = 0;
  const arcs = mix.map((m) => {
    const from = at;
    at += (m.count / total) * 100;
    return `${carrierColor(m.name)} ${Number(from.toFixed(2))}% ${Number(at.toFixed(2))}%`;
  });
  return `conic-gradient(${arcs.join(", ")})`;
}
