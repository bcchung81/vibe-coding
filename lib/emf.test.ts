import { describe, expect, test } from "vitest";
import { CARRIERS, carrierColor, carriersOf, dateText, directionText, groupStations, levelOf, mixGradient, metersText, mixHex, NO_VALUE, percentText, ring, shortAddress, sizeOf, summarize, toStations, verdictText } from "./emf";

// Shaped like the API rows (fake call names)
const row = { mesureRceptNo: "201617", callNm: "예시역1번출구RRU", fcltyNm: "SKT", opertNm: "ITSELF", mesureDe: "20161021", expsrIdexVal: 2.9295e-5, mesureVal: 0.22, ermtwInStdrVal: 40.65, gisBassAdres: "서울특별시 중구 예시로 1", rdostGpsLaVal: 37.5656, rdostGpsLoVal: 126.9768, distance: 0.1214 };

describe("toStations", () => {
  test("reads the fields the card names and puts the nearest first", () => {
    const far = { ...row, mesureRceptNo: "201618", distance: 0.25, fcltyNm: "KT", opertNm: "KCA" };
    const [first, second] = toStations([far, row]);
    expect(first).toMatchObject({ name: "예시역1번출구RRU", carrier: "SKT", meters: 121, level: 0, agency: "자체 측정", lat: 37.5656 });
    expect(first.percent).toBeCloseTo(0.0029295);
    expect(second).toMatchObject({ carrier: "KT", meters: 250, agency: "KCA 측정" });
  });

  test("keeps a row without a measurement and drops one without a position", () => {
    const { expsrIdexVal, mesureVal, ermtwInStdrVal, ...bare } = row;
    const stations = toStations([bare, { ...row, rdostGpsLaVal: undefined }]);
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({ percent: null, level: NO_VALUE, measured: null, limit: null });
  });

  test("gives repeated receipt numbers different keys", () => {
    const keys = toStations([row, row]).map((s) => s.key);
    expect(new Set(keys).size).toBe(2);
  });
});

describe("levelOf", () => {
  test("puts a share of the limit in one of four bands", () => {
    expect([0.005, 0.05, 0.5, 7.3].map(levelOf)).toEqual([0, 1, 2, 3]);
    expect(levelOf(null)).toBe(NO_VALUE);
  });

  test("gives each band a larger marker, a missing value the smallest", () => {
    expect([0, 1, 2, 3].map(sizeOf)).toEqual([18, 22, 28, 36]);
    expect(sizeOf(NO_VALUE)).toBe(18);
  });
});

describe("text", () => {
  test("says the share of the limit in plain words", () => {
    expect(percentText(0.0029295)).toBe("기준의 0.0029%");
    expect(percentText(7.3488)).toBe("기준의 7.3%");
    expect(percentText(0.0000253)).toBe("기준의 0.001% 미만");
    expect(percentText(null)).toBe("측정값 없음");
  });

  test("writes the measuring day and the distance the Korean way", () => {
    expect(dateText("20161021")).toBe("2016. 10. 21.");
    expect(dateText("")).toBe("");
    expect(metersText(121)).toBe("121m");
    expect(metersText(1250)).toBe("1.3km");
  });
});

describe("carriersOf", () => {
  test("counts stations per carrier in the fixed carrier order, whatever the counts", () => {
    const stations = toStations([{ ...row, fcltyNm: "기타" }, row, { ...row, fcltyNm: "LGU+" }, { ...row, fcltyNm: "LGU+" }]);
    expect(carriersOf(stations)).toEqual([{ name: "SKT", count: 1 }, { name: "LGU+", count: 2 }, { name: "기타", count: 1 }]);
  });
});

describe("carrierColor", () => {
  test("gives each named carrier its own token and folds the rest into grey", () => {
    expect(CARRIERS.map(carrierColor)).toEqual(["var(--carrier-1)", "var(--carrier-2)", "var(--carrier-3)"]);
    expect(carrierColor("기타")).toBe("var(--muted)");
  });
});

describe("ring", () => {
  test("closes the ring and stays about the given distance from the centre", () => {
    const pts = ring(37.5664, 126.9779, 300);
    expect(pts[0]).toEqual(pts[pts.length - 1]);
    const [lon, lat] = pts[16];
    expect(lat).toBeCloseTo(37.5664 + 300 / 111320, 6);
    expect(lon).toBeCloseTo(126.9779, 6);
  });
});

describe("mixHex", () => {
  test("mixes two token colours", () => {
    expect(mixHex("#ffffff", "#193957", 0)).toBe("#ffffff");
    expect(mixHex("#ffffff", "#193957", 1)).toBe("#193957");
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixHex("#fff", "#193957", 1)).toBe("#193957");
    expect(mixHex("#fff", "#000", 0)).toBe("#ffffff");
  });
});

describe("shortAddress", () => {
  test("keeps the road and number, dropping province, city, district and the dong in brackets", () => {
    expect(shortAddress("서울특별시 중구 세종대로 110, (태평로1가)")).toBe("세종대로 110");
    expect(shortAddress("전라남도 나주시 빛가람로 760")).toBe("빛가람로 760");
    expect(shortAddress("경기도 성남시 분당구 판교역로 166")).toBe("판교역로 166");
    expect(shortAddress("나주시")).toBe("나주시");
  });
});

describe("directionText", () => {
  const c = { lat: 37.5664, lon: 126.9779 };
  test("names the compass point and the distance, or says it is right beside", () => {
    expect(directionText(c, { lat: 37.5674, lon: 126.9779 }, 111)).toBe("북쪽 111m");
    expect(directionText(c, { lat: 37.5654, lon: 126.9792 }, 160)).toBe("남동쪽 160m");
    expect(directionText(c, c, 18)).toBe("찾은 주소 바로 옆 · 18m");
  });
});

describe("groupStations", () => {
  const c = { lat: 37.5656, lon: 126.9768 };
  const spot = (o: Partial<typeof row>) => toStations([{ ...row, ...o }])[0];
  const a = { ...spot({ expsrIdexVal: 1e-6, distance: 0.018 }), key: "a" };
  const b = { ...spot({ expsrIdexVal: 5e-4, distance: 0.018 }), key: "b" };
  const far = { ...spot({ rdostGpsLaVal: 37.5676, expsrIdexVal: 2e-3, distance: 0.22 }), key: "far" };

  test("puts stations on the same spot in one row, strongest first", () => {
    const groups = groupStations([a, b, far], c, "near");
    expect(groups.map((g) => g.stations.map((s) => s.key))).toEqual([["b", "a"], ["far"]]);
    expect(groups[0].top).toBeCloseTo(0.05);
    expect(groups[0].label).toBe("찾은 주소 바로 옆 · 18m");
  });

  test("orders the rows by the strongest station when asked", () => {
    expect(groupStations([a, b, far], c, "strong").map((g) => g.key)[0]).toBe(groupStations([far], c, "near")[0].key);
  });
});

describe("summarize / verdictText", () => {
  test("finds the strongest station and counts those over 1%", () => {
    const list = toStations([{ ...row, expsrIdexVal: 0.073 }, { ...row, expsrIdexVal: 0.012 }, row]);
    const s = summarize(list);
    expect(s).toMatchObject({ count: 3, measured: 3, over1: 2, over: 0 });
    expect(s.top?.percent).toBeCloseTo(7.3);
    expect(verdictText(s)).toBe("모두 인체보호 기준의 1/10 아래입니다");
  });

  test("says so when a station passes the limit or nothing was measured", () => {
    expect(verdictText(summarize(toStations([{ ...row, expsrIdexVal: 1.2 }])))).toBe("인체보호 기준을 넘는 곳이 1곳 있습니다");
    const { expsrIdexVal, ...bare } = row;
    expect(verdictText(summarize(toStations([bare])))).toBe("측정값이 있는 무선국이 없습니다");
  });
});

describe("mixGradient", () => {
  test("draws each carrier's share as an arc of the donut", () => {
    expect(mixGradient([{ name: "SKT", count: 1 }, { name: "LGU+", count: 3 }])).toBe("conic-gradient(var(--carrier-1) 0% 25%, var(--carrier-3) 25% 100%)");
    expect(mixGradient([{ name: "기타", count: 2 }])).toBe("conic-gradient(var(--muted) 0% 100%)");
  });
});
