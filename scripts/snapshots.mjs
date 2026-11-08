// 1일차 주제 카드 3개의 예시 데이터(시작 저장소 vibe-coding-start 의 vibe/data/01.json · 02.json · 03.json)를 실제 API로 받는다.
// 시작 저장소를 이 저장소 옆 폴더(../vibe-coding-start)에 받아 두고 실행한 뒤, 그 저장소에서 커밋 · 푸시한다.
// 실행: npm run snapshots — 키는 .env.local 의 DATA_GO_KR_KEY(Decoding 키)를 읽고, 화면에는 내지 않는다.
// 공공데이터(이용허락범위 제한 없음)라 공개 저장소에 둔다. 요청 주소는 주제 카드(docs/교육생_배포/웹앱_주제/)와 같다.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const key = process.env.DATA_GO_KR_KEY;
if (!key) {
  console.error("DATA_GO_KR_KEY 가 없습니다. .env.local 에 DATA_GO_KR_KEY=Decoding키 한 줄을 직접 넣고 다시 실행하세요.");
  process.exit(1);
}
const hide = (text) => String(text).split(key).join("***").split(encodeURIComponent(key)).join("***");
const OUT = join(process.cwd(), "..", "vibe-coding-start", "vibe", "data");
if (!existsSync(OUT)) {
  console.error(`${OUT} 가 없습니다. github.com/bcchung81/vibe-coding-start 를 이 저장소 옆 폴더에 받아 두세요.`);
  process.exit(1);
}
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

async function getJson(base, params) {
  const url = `${base}?${new URLSearchParams({ ...params, serviceKey: key })}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${hide(text.slice(0, 200))}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`JSON이 아님: ${hide(text.slice(0, 200))}`);
  }
}

const TOPICS = [
  {
    no: "01",
    name: "한국방송통신전파진흥원_국가기술자격검정 시험장 정보 (2026-08-18 판)",
    async items() {
      const j = await getJson("https://api.odcloud.kr/api/15076833/v1/uddi:94dbb45f-0644-40bf-a5d8-d96cfd26a26b", { page: "1", perPage: "300", returnType: "JSON" });
      if (j.data.length !== j.totalCount) throw new Error(`${j.totalCount}행 중 ${j.data.length}행만 받음`);
      return j.data;
    },
  },
  {
    no: "02",
    name: "한국방송통신전파진흥원_국가기술자격 공지사항 (최근 100줄 — 공지 하나가 첨부파일마다 한 줄)",
    async items() {
      const j = await getJson("https://apis.data.go.kr/B552729/kcaApiService_cq1/getCqNotice", { pageNo: "1", numOfRows: "100" });
      const r = j.response ?? j;
      if (r.header?.resultCode !== "00") throw new Error(`resultCode ${r.header?.resultCode} ${r.header?.resultMsg ?? JSON.stringify(j).slice(0, 200)}`);
      const list = r.body?.items?.list ?? [];
      return Array.isArray(list) ? list : [list];
    },
  },
  {
    no: "03",
    name: "한국방송통신전파진흥원_기금사업정보 (2021~2023년 사업)",
    async items() {
      const j = await getJson("https://api.odcloud.kr/api/15133304/v1/uddi:427e5fb9-3498-4ae9-8841-ab72a7cea63d", { page: "1", perPage: "500", returnType: "JSON" });
      if (j.data.length !== j.totalCount) throw new Error(`${j.totalCount}행 중 ${j.data.length}행만 받음`);
      return j.data;
    },
  },
];

let failed = 0;
for (const t of TOPICS) {
  try {
    const items = await t.items();
    writeFileSync(join(OUT, `${t.no}.json`), JSON.stringify({ source: `${t.name} · 공공데이터포털 · ${today} 받음`, items }, null, 2) + "\n");
    // 카드의 "확인 전" 항목을 채울 수 있게 형식만 보인다 (공공데이터라 값을 보여도 된다)
    console.log(`\n${t.no} ${items.length}건 → vibe/data/${t.no}.json`);
    console.log("  항목:", Object.keys(items[0] ?? {}).join(", "));
    console.log("  첫 줄:", JSON.stringify(items[0] ?? {}).slice(0, 300));
  } catch (e) {
    failed += 1;
    console.error(`\n${t.no} 실패: ${hide(e.message)}`);
  }
}
process.exit(failed ? 1 : 0);
