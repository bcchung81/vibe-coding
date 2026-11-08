import { describe, expect, test } from "vitest";
import { CARRIERS, carrierColor, carriersOf, dateText, heightOf, levelOf, metersText, mixHex, NO_VALUE, percentText, ring, toStations } from "./emf";

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

  test("gives each band a taller column, and a missing value a low stub", () => {
    expect([0, 1, 2, 3].map(heightOf)).toEqual([12, 30, 60, 100]);
    expect(heightOf(NO_VALUE)).toBe(6);
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
