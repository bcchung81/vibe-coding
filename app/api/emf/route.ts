import { toStations, type RawStation } from "../../../lib/emf";
import sample from "../../../lib/emf-sample.json";

// Topic card 07 for the map demo (/topics/map): the stations within 300m of an address, from the KCA API with the
// hub's key. Without a key or when the call fails, the saved example around Seoul City Hall comes back with live: false
// — the same rule as the trainees' /api/data route. The key, the request URL and the raw error stay on the server.
const API = "https://apis.data.go.kr/B552729/kcaApiService_emf/getEmfExposureIndex";
const RADIUS_KM = 0.3; // no paging: 1km returns over 4,000 rows

export async function GET(request: Request) {
  const asked = (new URL(request.url).searchParams.get("address") ?? "").trim().slice(0, 80) || sample.address;
  const key = process.env.DATA_GO_KR_KEY;

  if (key) {
    try {
      const url = new URL(API);
      url.searchParams.set("serviceKey", key);
      url.searchParams.set("address", asked);
      url.searchParams.set("distance", String(RADIUS_KM));
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { accept: "application/json" }, cache: "no-store" });
      const body = (await res.json()) as { response?: { header?: { resultCode?: string }; body?: { lat?: number; lon?: number; items?: { list?: RawStation[] } } } };
      const head = body.response?.header;
      const found = body.response?.body;
      if (head?.resultCode === "00" && found) {
        // An address the API cannot place is not an error: it comes back with lat 0 and no rows
        const center = found.lat && found.lon ? { lat: found.lat, lon: found.lon } : null;
        return Response.json(
          { live: true, found: center != null, address: asked, center, radius: RADIUS_KM * 1000, stations: center ? toStations(found.items?.list ?? []) : [] },
          { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
        );
      }
      console.error("emf: API answered", res.status, head?.resultCode ?? "no result code");
    } catch (err) {
      console.error("emf: API call failed", err instanceof Error ? err.name : "unknown");
    }
  }

  return Response.json({ live: false, found: true, asked, address: sample.address, center: sample.center, radius: RADIUS_KM * 1000, stations: toStations(sample.items as RawStation[]) });
}
