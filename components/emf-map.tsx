"use client";

import Link from "next/link";
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CARRIERS, carrierColor, carriersOf, dateText, heightOf, LEVELS, metersText, mixHex, NO_VALUE_HEIGHT, percentText, ring, type Station } from "../lib/emf";
import { settled, type Step, type StepId, STEPS, type Steps, stepText } from "../lib/loading";
import { PROVIDERS, wifiCounts, type WifiPoint } from "../lib/wifi";
import { Band } from "./band";

type Answer = { live: boolean; found: boolean; asked?: string; address: string; center: { lat: number; lon: number } | null; radius: number; stations: Station[] };

// OpenFreeMap needs no key; its grey style lets the coloured columns read first (housing-board uses the same tiles)
const STYLE = "https://tiles.openfreemap.org/styles/positron";
const ALL = "전체";
const EXAMPLES = ["서울특별시 중구 세종대로 110", "전라남도 나주시 빛가람로 760"];
const NONE = { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection;
// The tilted view: stations stand as columns among the buildings
const VIEW = { pitch: 55, bearing: -20 };
// Column footprints (m): an octagon per station, a wider navy sleeve around the picked one
const COLUMN = 5;
const SLEEVE = 8;

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Map colours come from the hub tokens; MapLibre cannot read var() or color-mix, so they are resolved here once
function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const ink = v("--ink");
  const paper = v("--paper");
  return { ink, paper, line: v("--line"), muted: v("--muted"), accent: v("--accent"), bar: v("--accent-bar"), carriers: CARRIERS.map((_, i) => v(`--carrier-${i + 1}`)) };
}

// Topic card 07 on a map: an address in, the stations within 300m out, coloured by their share of the protection limit.
// The list beside the map and the points light each other up; picking either opens the station's measurements.
export function EmfMap() {
  const box = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "failed">("loading");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(true);
  const [lost, setLost] = useState(false);
  const [query, setQuery] = useState("");
  const [carrier, setCarrier] = useState(ALL);
  const [chosen, setChosen] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [showWifi, setShowWifi] = useState(true);
  const [wifi, setWifi] = useState<WifiPoint[]>([]);
  // The loading panel: one row per call (map tiles, KCA stations, Wi-Fi), shown while a lookup runs
  const [steps, setSteps] = useState<Steps>({ map: { state: "busy" }, emf: { state: "busy" }, wifi: { state: "wait" } });
  const [panel, setPanel] = useState(true);
  const [now, setNow] = useState(0);
  const setStep = useCallback((id: StepId, step: Step) => setSteps((all) => ({ ...all, [id]: step })), []);

  // Stations first (their answer gives the address's position), then the Wi-Fi around that position.
  // A newer lookup makes an older one's late answers drop silently.
  const run = useRef(0);
  const look = useCallback(
    async (address: string) => {
      const me = ++run.current;
      const fresh = () => me === run.current;
      setBusy(true);
      setPanel(true);
      const t0 = performance.now();
      setSteps((all) => ({ ...all, emf: { state: "busy", started: t0 }, wifi: { state: "wait" } }));
      let next: Answer;
      try {
        const res = await fetch(`/api/emf?address=${encodeURIComponent(address)}`);
        if (!res.ok) throw new Error(String(res.status));
        next = (await res.json()) as Answer;
      } catch {
        if (!fresh()) return;
        setLost(true);
        setSteps((all) => ({ ...all, emf: { state: "fail" }, wifi: { state: "skip" } }));
        setBusy(false);
        return;
      }
      if (!fresh()) return;
      setAnswer(next);
      setLost(false);
      setChosen(null);
      setCarrier(ALL);
      setStep("emf", { state: !next.live ? "sample" : !next.found ? "miss" : "done", ms: performance.now() - t0, count: next.stations.length });
      if (!next.center) {
        setWifi([]);
        setStep("wifi", { state: "skip" });
        setBusy(false);
        return;
      }
      const t1 = performance.now();
      setStep("wifi", { state: "busy", started: t1 });
      try {
        const res = await fetch(`/api/wifi?lat=${next.center.lat}&lon=${next.center.lon}`);
        if (!res.ok) throw new Error(String(res.status));
        const rows = ((await res.json()) as { wifi: [number, number, number][] }).wifi;
        if (!fresh()) return;
        setWifi(rows.map(([lat, lon, p]) => ({ lat, lon, provider: PROVIDERS[p] ?? "공공" })));
        setStep("wifi", { state: "done", ms: performance.now() - t1, count: rows.length });
      } catch {
        if (!fresh()) return;
        setWifi([]);
        setStep("wifi", { state: "fail" });
      }
      setBusy(false);
    },
    [setStep],
  );

  // Seconds tick while something runs; the panel stays a moment after the last call so its results can be read
  const running = !settled(steps);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (!panel || running) return;
    const id = setTimeout(() => setPanel(false), 1800);
    return () => clearTimeout(id);
  }, [panel, running]);

  useEffect(() => {
    look("");
  }, [look]);

  const stations = useMemo(() => answer?.stations ?? [], [answer]);
  const carriers = useMemo(() => carriersOf(stations), [stations]);
  const shown = useMemo(() => (carrier === ALL ? stations : stations.filter((s) => s.carrier === carrier)), [stations, carrier]);
  const idOf = useMemo(() => new Map(stations.map((s, i) => [s.key, i])), [stations]);

  // The map, once. Without WebGL or tiles the list still works and the panel says what is missing.
  useEffect(() => {
    let map: MapLibreMap | undefined;
    let gone = false;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (gone || !box.current) return;
        ml.setWorkerUrl(`/maplibre/maplibre-gl-worker.mjs?v=${ml.getVersion()}`);
        const t = performance.now();
        setStep("map", { state: "busy", started: t });
        map = new ml.Map({ container: box.current, style: STYLE, center: [126.9779, 37.5664], zoom: 15.4, ...VIEW, maxPitch: 70, attributionControl: { compact: true } });
        // Drag with the right button (or two fingers) to turn and tilt; the compass puts north back up
        map.addControl(new ml.NavigationControl({ visualizePitch: true }), "top-right");
        let loaded = false;
        map.on("error", (e) => {
          if (!loaded && !gone) {
            setMapState("failed");
            setStep("map", { state: "fail" });
          } else console.warn("map:", e.error?.message);
        });
        map.on("load", () => {
          if (!map || gone) return;
          loaded = true;
          draw(map);
          mapRef.current = map;
          setMapState("ready");
          setStep("map", { state: "done", ms: performance.now() - t });
        });
      } catch {
        if (!gone) {
          setMapState("failed");
          setStep("map", { state: "fail" });
        }
      }
    })();
    return () => {
      gone = true;
      mapRef.current = null;
      map?.remove();
    };
    // draw only registers handlers that call state setters, which never change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw(map: MapLibreMap) {
    // Place names in Korean where the tiles have them; route-number shields keep their numbers
    for (const layer of map.getStyle().layers) {
      if (layer.type === "symbol" && JSON.stringify(layer.layout?.["text-field"] ?? "").includes("name:nonlatin")) {
        map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:ko"], ["get", "name"]]);
      }
    }
    const c = palette();
    // Colour = carrier (fixed per carrier, the same tokens as the legend and the list); height = exposure band
    const fill: ExpressionSpecification = ["match", ["get", "carrier"], CARRIERS[0], c.carriers[0], CARRIERS[1], c.carriers[1], CARRIERS[2], c.carriers[2], c.muted];
    map.addSource("area", { type: "geojson", data: NONE });
    // Feature ids are small row numbers: a long receipt-number id breaks MapLibre's tile encoding ("varint")
    map.addSource("stations", { type: "geojson", data: NONE });
    map.addSource("chosen", { type: "geojson", data: NONE });
    map.addSource("here", { type: "geojson", data: NONE });
    map.addSource("wifi", { type: "geojson", data: NONE });
    // Ochre is "now": the searched address and its 300m ring on the ground. Navy is "chosen": the picked column's sleeve.
    map.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": c.bar, "fill-opacity": 0.06 } });
    map.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": c.bar, "line-width": 2 } });
    // Wi-Fi lies flat on the ground in the same carrier colours (public ones grey); columns and buildings stand over it
    map.addLayer({
      id: "wifi",
      type: "circle",
      source: "wifi",
      paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 2.5, 16, 4.5, 18, 7], "circle-color": fill, "circle-stroke-color": c.paper, "circle-stroke-width": 1.2, "circle-pitch-alignment": "map", "circle-opacity": 0.9 },
    });
    // Columns: the pointed-at one turns navy like the list row it lights up
    map.addLayer({
      id: "stations",
      type: "fill-extrusion",
      source: "stations",
      paint: { "fill-extrusion-color": ["case", ["boolean", ["feature-state", "hover"], false], c.ink, fill], "fill-extrusion-height": ["get", "height"], "fill-extrusion-opacity": 0.95 },
    });
    map.addLayer({ id: "stations-chosen", type: "fill-extrusion", source: "chosen", paint: { "fill-extrusion-color": c.ink, "fill-extrusion-height": ["get", "height"], "fill-extrusion-opacity": 0.95 } });
    // Buildings from the same tiles, pale and see-through and drawn after the columns, so a column behind one still shows
    map.setLayoutProperty("building", "visibility", "none");
    map.addLayer({
      id: "buildings-3d",
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 14,
      paint: { "fill-extrusion-color": mixHex(c.paper, c.line, 0.5), "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.45 },
    });
    map.addLayer({ id: "here", type: "circle", source: "here", paint: { "circle-radius": 7, "circle-color": c.accent, "circle-stroke-color": c.paper, "circle-stroke-width": 2.5 } });

    const keyOf = (e: MapLayerMouseEvent) => e.features?.[0]?.properties?.key as string | undefined;
    for (const id of ["stations", "stations-chosen"]) map.on("click", id, (e) => setChosen(keyOf(e) ?? null));
    map.on("click", (e) => {
      if (!map.queryRenderedFeatures(e.point, { layers: ["stations", "stations-chosen"] }).length) setChosen(null);
    });
    // Hover only where there is a pointer that can hover; touch goes straight to picking
    if (matchMedia("(hover: hover)").matches) {
      map.on("mousemove", "stations", (e) => {
        setHover(keyOf(e) ?? null);
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "stations", () => {
        setHover(null);
        map.getCanvas().style.cursor = "";
      });
    }
  }

  // Points, the ring and the searched address follow the answer and the carrier filter
  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== "ready" || !map) return;
    const center = answer?.center;
    (map.getSource("stations") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: shown.map((s) => ({ type: "Feature", id: idOf.get(s.key), properties: { key: s.key, carrier: s.carrier, height: heightOf(s.level) }, geometry: { type: "Polygon", coordinates: [ring(s.lat, s.lon, COLUMN, 8)] } })),
    });
    (map.getSource("area") as GeoJSONSource).setData(center ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring(center.lat, center.lon, answer.radius)] } } : NONE);
    (map.getSource("here") as GeoJSONSource).setData(center ? { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [center.lon, center.lat] } } : NONE);
    (map.getSource("wifi") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: wifi.map((w) => ({ type: "Feature", properties: { carrier: w.provider }, geometry: { type: "Point", coordinates: [w.lon, w.lat] } })),
    });
  }, [mapState, answer, shown, idOf, wifi]);

  useEffect(() => {
    if (mapState === "ready") mapRef.current?.setLayoutProperty("wifi", "visibility", showWifi ? "visible" : "none");
  }, [mapState, showWifi]);

  // A new address moves the camera to its ring (at once when motion is reduced)
  useEffect(() => {
    const map = mapRef.current;
    const center = answer?.center;
    if (mapState !== "ready" || !map || !center) return;
    const pts = ring(center.lat, center.lon, answer.radius, 16);
    const lons = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    // fitBounds has no tilt, so take the centre and zoom it finds and fly there tilted
    const cam = map.cameraForBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 48 });
    if (!cam) return;
    // The map row runs again until the tiles of the new place are in ("idle"); the repaint makes sure idle comes
    const t = performance.now();
    setStep("map", { state: "busy", started: t });
    map.once("idle", () => setStep("map", { state: "done", ms: performance.now() - t }));
    map.easeTo({ center: cam.center, zoom: cam.zoom, ...VIEW, duration: still() ? 0 : 1200 });
    map.triggerRepaint();
  }, [mapState, answer, setStep]);

  // Picked and pointed-at stations on the map
  const lit = useRef<number | undefined>(undefined);
  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== "ready" || !map) return;
    const s = chosen ? stations.find((x) => x.key === chosen) : undefined;
    (map.getSource("chosen") as GeoJSONSource).setData(
      s ? { type: "Feature", properties: { key: s.key, height: heightOf(s.level) + 3 }, geometry: { type: "Polygon", coordinates: [ring(s.lat, s.lon, SLEEVE, 8)] } } : NONE,
    );
    const id = hover ? idOf.get(hover) : undefined;
    if (lit.current !== undefined) map.setFeatureState({ source: "stations", id: lit.current }, { hover: false });
    if (id !== undefined) map.setFeatureState({ source: "stations", id }, { hover: true });
    lit.current = id;
  }, [mapState, chosen, hover, shown, idOf, stations]);

  // A station picked on the map scrolls into view inside the list only, never the page
  useEffect(() => {
    const list = listRef.current;
    const row = chosen ? list?.querySelector<HTMLElement>(`[data-key="${CSS.escape(chosen)}"]`) : null;
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop || row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: row.offsetTop - 8, behavior: still() ? "auto" : "smooth" });
    }
  }, [chosen]);

  function pick(s: Station) {
    const next = chosen === s.key ? null : s.key;
    setChosen(next);
    if (next) mapRef.current?.easeTo({ center: [s.lon, s.lat], duration: still() ? 0 : 500 });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) look(query.trim());
  }

  const head = (() => {
    if (!answer) return lost ? { title: "자료를 불러오지 못했어요", lead: "잠시 뒤 다시 찾아 보세요." } : { title: "주변 무선국을 찾는 중입니다", lead: undefined };
    if (!answer.found) return { title: "주소를 찾지 못했어요", lead: "도로명 주소나 '나주시'처럼 시 이름을 넣어 보세요." };
    return { title: `${answer.address} 300m 안 무선국 ${stations.length}곳`, lead: "주소를 넣으면 주변 무선국의 전자파 세기를 인체보호 기준과 견주어 지도에 올리고, 같은 반경의 와이파이도 함께 보여 줍니다." };
  })();

  const note = answer && !answer.live ? (answer.asked && answer.asked !== answer.address ? `실시간 자료를 못 받아 '${answer.asked}' 주변은 확인하지 못했습니다. 서울시청 주변 예시 데이터를 보여 줍니다.` : "실시간 자료를 못 받아 서울시청 주변 예시 데이터를 보여 줍니다.") : lost && answer ? "새 주소의 자료를 받지 못해 앞의 결과를 그대로 보여 줍니다." : null;

  return (
    <>
      <Band kicker="지도 시연" title={head.title} lead={head.lead} />
      <div className="content">
        <div className="tools">
          <Link className="ghost" href="/topics/07">
            ← 07 주제 카드
          </Link>
          {answer && (
            <span className="status" data-state={answer.live ? "done" : undefined}>
              {answer.live ? "실시간" : "예시 데이터"}
            </span>
          )}
          {note && <p className="hint">{note}</p>}
        </div>

        <form className="emf-search" onSubmit={submit}>
          <label>
            주소
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`예: ${EXAMPLES[1]}`} maxLength={80} />
          </label>
          <button className="btn-primary" type="submit" disabled={busy || !query.trim()}>
            {busy ? "찾는 중" : "찾기"}
          </button>
          <p className="hint emf-examples">
            예시 주소
            {EXAMPLES.map((a) => (
              <button key={a} type="button" disabled={busy} onClick={() => (setQuery(a), look(a))}>
                {a}
              </button>
            ))}
          </p>
        </form>

        <div className="emf">
          <section className="panel emf-map" aria-label="무선국 지도">
            <div className="emf-stage">
              <div ref={box} className="emf-canvas" />
              {mapState === "failed" && <p className="emf-fail">지도를 불러오지 못해 무선국 위치는 확인하지 못했습니다. 옆 목록으로 보세요.</p>}
              {panel && (
                <div className="emf-loading" data-settled={!running || undefined} role="status" aria-label="자료를 받는 과정">
                  <p className="emf-loading-head">{running ? "자료를 받는 중" : "모두 받았습니다"}</p>
                  <ol>
                    {STEPS.map((info) => {
                      const step = steps[info.id];
                      const text = stepText(step, now, info.busy);
                      return (
                        <li key={info.id} data-state={step.state}>
                          <span className="status" data-state={text.tone === "todo" ? undefined : text.tone}>
                            {text.chip}
                          </span>
                          <span className="emf-loading-name">
                            <b>{info.name}</b>
                            <span>{info.where}</span>
                          </span>
                          <span className="emf-loading-detail" aria-hidden={step.state === "busy" || undefined}>
                            {text.detail}
                          </span>
                          {step.state === "busy" && <span className="emf-sweep" aria-hidden />}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
            <div className="emf-legend" aria-label="범례">
              <ul>
                <li className="emf-legend-head">색 = 통신사</li>
                {[...CARRIERS, "기타"].map((name) => (
                  <li key={name}>
                    <span className="emf-dot" style={{ background: carrierColor(name) }} />
                    {name === "기타" ? "기타 · 공공" : name}
                  </li>
                ))}
                <li>
                  <span className="emf-dot" data-here />
                  찾은 주소 · 반경 300m
                </li>
              </ul>
              <ul>
                <li className="emf-legend-head">높이 = 기준 대비 세기</li>
                {LEVELS.map((l) => (
                  <li key={l.label}>
                    <span className="emf-bar" style={{ height: `${4 + l.height / 8}px` }} />
                    {l.label} · {l.height}m
                  </li>
                ))}
                <li>
                  <span className="emf-bar" style={{ height: `${4 + NO_VALUE_HEIGHT / 8}px` }} />
                  측정값 없음 · {NO_VALUE_HEIGHT}m
                </li>
              </ul>
              <ul>
                <li className="emf-legend-head">바닥 점 = 와이파이</li>
                <li>
                  <span className="emf-dot" data-wifi />
                  {wifi.length ? `${wifi.length}곳 — ${wifiCounts(wifi).map((w) => `${w.name} ${w.count}`).join(" · ")}` : "반경 안에 없음"}
                </li>
                <li>
                  <button type="button" className="emf-toggle" aria-pressed={showWifi} onClick={() => setShowWifi((on) => !on)}>
                    와이파이 보기
                  </button>
                </li>
              </ul>
            </div>
            <p className="emf-source">오른쪽 버튼이나 Ctrl을 누른 채 끌면 돌리고 기울입니다. 자료: 한국방송통신전파진흥원 의무측정무선국 전자파 노출지수 · 지역별 와이파이 정보 현황(2026-09-28 판, 공공데이터포털). 노출지수 1이 인체보호 기준과 같은 세기입니다.</p>
          </section>

          <section className="panel emf-side" aria-labelledby="emf-list-title">
            <div className="emf-side-head">
              <h2 id="emf-list-title">가까운 순</h2>
              {carriers.length > 1 && (
                <div className="tabs" role="group" aria-label="통신사로 거르기">
                  {[{ name: ALL, count: stations.length }, ...carriers].map((c) => (
                    <button key={c.name} type="button" aria-pressed={carrier === c.name} onClick={() => setCarrier(c.name)}>
                      {c.name !== ALL && <span className="emf-dot" style={{ background: carrierColor(c.name) }} />}
                      {c.name} {c.count}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {shown.length === 0 ? (
              <p className="meta emf-empty">{busy ? "찾는 중입니다." : "보여 줄 무선국이 없어요."}</p>
            ) : (
              <ol ref={listRef} className="emf-list">
                {shown.map((s) => {
                  const on = s.key === chosen;
                  return (
                    <li key={s.key} data-key={s.key}>
                      <button type="button" aria-pressed={on} data-hover={s.key === hover || undefined} onClick={() => pick(s)} onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}>
                        <span className="emf-dot" style={{ background: carrierColor(s.carrier) }} />
                        <span className="emf-name">
                          <b>{s.name}</b>
                          <span>
                            {s.carrier} · {metersText(s.meters)}
                          </span>
                        </span>
                        <span className="emf-value">{percentText(s.percent)}</span>
                      </button>
                      {on && (
                        <dl className="emf-detail">
                          <dt>측정값</dt>
                          <dd>{s.measured == null ? "없음" : `${s.measured} (기준 ${s.limit})`}</dd>
                          <dt>측정일</dt>
                          <dd>{dateText(s.date) || "없음"}</dd>
                          <dt>측정</dt>
                          <dd>{s.agency || "없음"}</dd>
                          <dt>주소</dt>
                          <dd>{s.address || "없음"}</dd>
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
