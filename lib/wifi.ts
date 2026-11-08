// Wi-Fi layer of the map demo (/topics/map): KCA "지역별 와이파이 정보 현황" (192,882 rows, one AP per row).
// Its API cannot filter by place, so scripts/wifi.mjs packs the CSV once into lib/wifi.bin and the server picks the
// points near an address from it. Layout: N lat ×1e5 (int32) · N lon ×1e5 (int32) · N provider (uint8), sorted by lat.

// Provider order is the stored number. The carrier names match the stations' so both layers share --carrier-* colours.
export const PROVIDERS = ["공공", "SKT", "KT", "LGU+"] as const;
export type Provider = (typeof PROVIDERS)[number];

// The CSV says "LGT" where the stations say "LGU+"
const ALIAS: Record<string, Provider> = { 공공: "공공", SKT: "SKT", KT: "KT", LGT: "LGU+", "LGU+": "LGU+" };

export type WifiPoint = { lat: number; lon: number; provider: Provider };
export type WifiPack = { lat: Int32Array; lon: Int32Array; provider: Uint8Array };

const SCALE = 1e5;

export function providerOf(name: string): Provider | undefined {
  return ALIAS[name.trim()];
}

export function packWifi(points: WifiPoint[]): Uint8Array {
  const sorted = [...points].sort((a, b) => a.lat - b.lat);
  const n = sorted.length;
  const lat = Int32Array.from(sorted, (p) => Math.round(p.lat * SCALE));
  const lon = Int32Array.from(sorted, (p) => Math.round(p.lon * SCALE));
  const provider = Uint8Array.from(sorted, (p) => PROVIDERS.indexOf(p.provider));
  const out = new Uint8Array(n * 9);
  out.set(new Uint8Array(lat.buffer), 0);
  out.set(new Uint8Array(lon.buffer), n * 4);
  out.set(provider, n * 8);
  return out;
}

// Copies into fresh buffers, so a file read at any byte offset is fine for the int32 views. A Node Buffer's slice()
// shares its memory pool, hence new Uint8Array(subarray) rather than slice().
export function unpackWifi(bytes: Uint8Array): WifiPack {
  const n = bytes.length / 9;
  const part = (from: number, to: number) => new Uint8Array(bytes.subarray(from, to)).buffer;
  return { lat: new Int32Array(part(0, n * 4)), lon: new Int32Array(part(n * 4, n * 8)), provider: new Uint8Array(part(n * 8, n * 9)) };
}

// Points within `meters` of a place: a binary search for the latitude band, then the true distance
export function nearWifi(pack: WifiPack, lat: number, lon: number, meters: number): WifiPoint[] {
  const dLat = (meters / 111320) * SCALE;
  const low = Math.floor(lat * SCALE - dLat);
  const high = Math.ceil(lat * SCALE + dLat);
  let i = 0;
  let j = pack.lat.length;
  while (i < j) {
    const mid = (i + j) >> 1;
    if (pack.lat[mid] < low) i = mid + 1;
    else j = mid;
  }
  const perLon = 111320 * Math.cos((lat * Math.PI) / 180);
  const found: WifiPoint[] = [];
  for (; i < pack.lat.length && pack.lat[i] <= high; i++) {
    const pLat = pack.lat[i] / SCALE;
    const pLon = pack.lon[i] / SCALE;
    const dy = (pLat - lat) * 111320;
    const dx = (pLon - lon) * perLon;
    if (dx * dx + dy * dy <= meters * meters) found.push({ lat: pLat, lon: pLon, provider: PROVIDERS[pack.provider[i]] ?? "공공" });
  }
  return found;
}

// How many of each provider, in PROVIDERS order, leaving out the ones with none
export function wifiCounts(points: WifiPoint[]) {
  return PROVIDERS.map((name) => ({ name, count: points.filter((p) => p.provider === name).length })).filter((c) => c.count > 0);
}
