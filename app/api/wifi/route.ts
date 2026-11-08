import { readFileSync } from "node:fs";
import { join } from "node:path";
import { nearWifi, PROVIDERS, unpackWifi, type WifiPack } from "../../../lib/wifi";

// Wi-Fi points within 300m of a place for the map demo (/topics/map), from the packed KCA file (scripts/wifi.mjs),
// read once per server instance. Its own route so the page can show this call apart from the KCA station call.
// Sent as [lat, lon, provider number] to keep the answer small; without the file the layer is simply empty.
const RADIUS = 300;

let pack: WifiPack | null | undefined;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (!(lat > 32 && lat < 39.5 && lon > 124 && lon < 132)) return Response.json({ wifi: [] }, { status: 400 });

  if (pack === undefined) {
    try {
      pack = unpackWifi(readFileSync(join(process.cwd(), "lib", "wifi.bin")));
    } catch {
      console.error("wifi: lib/wifi.bin missing");
      pack = null;
    }
  }
  const wifi = pack ? nearWifi(pack, lat, lon, RADIUS).map((p) => [p.lat, p.lon, PROVIDERS.indexOf(p.provider)]) : [];
  return Response.json({ wifi }, { headers: { "cache-control": "public, s-maxage=86400" } });
}
