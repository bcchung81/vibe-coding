// Packs KCA "지역별 와이파이 정보 현황" (공공데이터포털 15168232, CSV, no login needed) into lib/wifi.bin for the
// map demo's Wi-Fi layer (/topics/map). Its API has no place filter, so the points are packed once and committed.
// 실행: npm run wifi -- <내려받은 CSV 경로>  (데이터가 새 판으로 바뀌었을 때만)
import { readFileSync, writeFileSync } from "node:fs";
import { packWifi, providerOf } from "../lib/wifi.ts";

const file = process.argv[2];
if (!file) {
  console.error("CSV 경로를 주세요: npm run wifi -- ~/Downloads/한국방송통신전파진흥원_지역별 와이파이 정보 현황_YYYYMMDD.csv");
  process.exit(1);
}

// RFC 4180: quoted fields may hold commas, line breaks and doubled quotes (the 공간데이터 column does)
function* rows(text) {
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") row.push(field), (field = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      yield row;
      (row = []), (field = "");
    } else field += ch;
  }
  if (field || row.length) yield [...row, field];
}

const text = readFileSync(file, "utf8").replace(/^﻿/, "");
const [head, ...body] = rows(text);
const col = (name) => {
  const at = head.findIndex((h) => h.includes(name));
  if (at < 0) throw new Error(`열을 찾지 못함: ${name} (머리: ${head.join(", ")})`);
  return at;
};
const [LAT, LON, WHO] = [col("위도"), col("경도"), col("서비스제공사업자구분")];

const points = [];
let skipped = 0;
for (const r of body) {
  if (r.length < head.length) continue;
  const lat = Number(r[LAT]);
  const lon = Number(r[LON]);
  const provider = providerOf(r[WHO]);
  if (!provider || !(lat > 32 && lat < 39.5 && lon > 124 && lon < 132)) {
    skipped++;
    continue;
  }
  points.push({ lat, lon, provider });
}

const bytes = packWifi(points);
writeFileSync("lib/wifi.bin", bytes);
console.log(`lib/wifi.bin: ${points.length}곳 (${(bytes.length / 1e6).toFixed(2)}MB), 건너뜀 ${skipped}행`);
