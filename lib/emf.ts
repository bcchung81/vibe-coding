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

// Exposure as a share of the protection limit (index × 100). The map's column heights (m) and the legend read this one table.
export const LEVELS = [
  { max: 0.01, label: "0.01% 미만", height: 12 },
  { max: 0.1, label: "0.01 ~ 0.1%", height: 30 },
  { max: 1, label: "0.1 ~ 1%", height: 60 },
  { max: Infinity, label: "1% 이상", height: 100 },
] as const;

// Rows that came without a measurement: a low stub
export const NO_VALUE = -1;
export const NO_VALUE_HEIGHT = 6;

export function heightOf(level: number) {
  return level === NO_VALUE ? NO_VALUE_HEIGHT : LEVELS[level].height;
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
