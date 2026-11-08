import { describe, expect, test } from "vitest";
import { nearWifi, packWifi, providerOf, unpackWifi, wifiCounts, type WifiPoint } from "./wifi";

// Around a made-up centre: two points inside 300m, one just outside to the north, one far away
const centre = { lat: 37.56637, lon: 126.97792 };
const points: WifiPoint[] = [
  { lat: 37.567, lon: 126.978, provider: "공공" },
  { lat: 37.5655, lon: 126.9775, provider: "KT" },
  { lat: 37.5695, lon: 126.97792, provider: "SKT" },
  { lat: 35.0218, lon: 126.7858, provider: "LGU+" },
];

describe("packWifi / unpackWifi", () => {
  test("keeps every point, nine bytes each, in latitude order", () => {
    const bytes = packWifi(points);
    expect(bytes.length).toBe(points.length * 9);
    const pack = unpackWifi(bytes);
    expect([...pack.lat]).toEqual([3502180, 3756550, 3756700, 3756950]);
    expect([...pack.provider]).toEqual([3, 2, 0, 1]);
  });

  test("reads a pack that starts at an odd byte offset", () => {
    const bytes = packWifi(points);
    const shifted = new Uint8Array(bytes.length + 1);
    shifted.set(bytes, 1);
    expect([...unpackWifi(shifted.subarray(1)).lon]).toEqual([...unpackWifi(bytes).lon]);
  });

  test("reads a Node Buffer, as readFileSync returns it", () => {
    const bytes = packWifi(points);
    expect([...unpackWifi(Buffer.from(bytes)).lat]).toEqual([...unpackWifi(bytes).lat]);
  });
});

describe("nearWifi", () => {
  test("finds the points within the radius and no others", () => {
    const near = nearWifi(unpackWifi(packWifi(points)), centre.lat, centre.lon, 300);
    expect(near.map((p) => p.provider).sort()).toEqual(["KT", "공공"]);
    expect(near[0].lat).toBeCloseTo(37.5655, 5);
  });

  test("finds nothing in an empty sea", () => {
    expect(nearWifi(unpackWifi(packWifi(points)), 33, 124, 300)).toEqual([]);
  });
});

describe("providerOf / wifiCounts", () => {
  test("reads the CSV's provider names, LGT as LGU+", () => {
    expect(["공공", "SKT", "KT", "LGT", "다른곳"].map(providerOf)).toEqual(["공공", "SKT", "KT", "LGU+", undefined]);
  });

  test("counts per provider in a fixed order, skipping the empty ones", () => {
    expect(wifiCounts(points.slice(0, 2))).toEqual([{ name: "공공", count: 1 }, { name: "KT", count: 1 }]);
  });
});
