"use client";

import Link from "next/link";
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CARRIERS, carrierColor, carriersOf, dateText, directionText, groupStations, LEVELS, levelOf, mixGradient, mixHex, percentText, ring, shortAddress, sizeOf, type Station, summarize, verdictText } from "../lib/emf";
import { settled, type Step, type StepId, STEPS, type Steps, stepText } from "../lib/loading";
import { PROVIDERS, type WifiPoint } from "../lib/wifi";
import { Band } from "./band";

type Answer = { live: boolean; found: boolean; asked?: string; address: string; center: { lat: number; lon: number } | null; radius: number; stations: Station[] };
type Order = "near" | "strong";

// OpenFreeMap needs no key; its grey style lets the coloured columns read first (housing-board uses the same tiles)
const STYLE = "https://tiles.openfreemap.org/styles/positron";
const ALL = "전체";
const EXAMPLES = [
  { label: "서울시청", address: "서울특별시 중구 세종대로 110" },
  { label: "KCA 나주 본원", address: "전라남도 나주시 빛가람로 760" },
];
const NONE = { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection;
// The whole world as an outer ring: with the search ring as its hole it greys out everything beyond 300m
const WORLD: [number, number][] = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
// The tilted view: the spot markers stand upright among the buildings
const VIEW = { pitch: 55, bearing: -20 };
// How long the "drag to move" hint stays when nobody touches the map
const HINT_MS = 7000;

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Map colours come from the hub tokens; MapLibre cannot read var() or color-mix, so they are resolved here once
function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { ink: v("--ink"), paper: v("--paper"), bg: v("--bg"), line: v("--line"), muted: v("--muted"), bar: v("--accent-bar"), carriers: CARRIERS.map((_, i) => v(`--carrier-${i + 1}`)) };
}

// Topic card 07 on a map, map first: the address bar, the answer and the legend float on the map; beside it the
// stations grouped by spot. Colour = carrier, height = share of the protection limit, ground rings = Wi-Fi.
export function EmfMap() {
  const box = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const mlRef = useRef<typeof import("maplibre-gl") | null>(null);
  const pinRef = useRef<Marker | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "failed">("loading");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(true);
  const [lost, setLost] = useState(false);
  const [query, setQuery] = useState("");
  const [carrier, setCarrier] = useState(ALL);
  const [order, setOrder] = useState<Order>("near");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [chosen, setChosen] = useState<string | null>(null);
  // A spot (about 20m) pointed at on the map or in the list, and one to bring into view in the list
  const [hoverSpot, setHoverSpot] = useState<string | null>(null);
  const [focusSpot, setFocusSpot] = useState<string | null>(null);
  const [showWifi, setShowWifi] = useState(true);
  const [wifi, setWifi] = useState<WifiPoint[]>([]);
  const [hint, setHint] = useState(false);
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
      setOpen(new Set());
      setFocusSpot(null);
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

  useEffect(() => {
    look("");
  }, [look]);

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

  const stations = useMemo(() => answer?.stations ?? [], [answer]);
  const carriers = useMemo(() => carriersOf(stations), [stations]);
  const shown = useMemo(() => (carrier === ALL ? stations : stations.filter((s) => s.carrier === carrier)), [stations, carrier]);
  const groups = useMemo(() => groupStations(shown, answer?.center ?? null, order), [shown, answer, order]);
  const groupOf = useMemo(() => new Map(groups.flatMap((g) => g.stations.map((s) => [s.key, g.key] as const))), [groups]);
  const summary = useMemo(() => summarize(stations), [stations]);
  const center = answer?.center ?? null;

  // The map, once. Without WebGL or tiles the list still works and the panel says what is missing.
  useEffect(() => {
    let map: MapLibreMap | undefined;
    let gone = false;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (gone || !box.current) return;
        mlRef.current = ml;
        ml.setWorkerUrl(`/maplibre/maplibre-gl-worker.mjs?v=${ml.getVersion()}`);
        const t = performance.now();
        setStep("map", { state: "busy", started: t });
        map = new ml.Map({ container: box.current, style: STYLE, center: [126.9779, 37.5664], zoom: 15.4, ...VIEW, maxPitch: 70, attributionControl: { compact: true, customAttribution: "자료: 한국방송통신전파진흥원 · 공공데이터포털" } });
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
          setHint(true);
        });
        // The hint goes as soon as someone moves the map themselves
        for (const kind of ["dragstart", "zoomstart", "rotatestart", "pitchstart"] as const) map.on(kind, (e) => e.originalEvent && setHint(false));
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
      pinRef.current = null;
      map?.remove();
    };
    // draw only registers handlers that call state setters, which never change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(false), HINT_MS);
    return () => clearTimeout(id);
  }, [hint]);

  function draw(map: MapLibreMap) {
    // Place names in Korean where the tiles have them; route-number shields keep their numbers
    for (const layer of map.getStyle().layers) {
      if (layer.type === "symbol" && JSON.stringify(layer.layout?.["text-field"] ?? "").includes("name:nonlatin")) {
        map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:ko"], ["get", "name"]]);
      }
    }
    const c = palette();
    // Colour = carrier (fixed per carrier, the same tokens as the legend, the list and the spot donuts)
    const fill: ExpressionSpecification = ["match", ["get", "carrier"], CARRIERS[0], c.carriers[0], CARRIERS[1], c.carriers[1], CARRIERS[2], c.carriers[2], c.muted];
    for (const id of ["mask", "area", "wifi"]) map.addSource(id, { type: "geojson", data: NONE });
    // Beyond 300m the ground greys out, so the ring and what stands in it read first
    map.addLayer({ id: "mask", type: "fill", source: "mask", paint: { "fill-color": c.bg, "fill-opacity": 0.6 } });
    // Ochre is "now": the searched address (its pin) and the 300m ring on the ground
    map.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": c.bar, "line-width": 2.5 } });
    // Wi-Fi lies flat on the ground as small rings in the carrier colours (public ones grey)
    map.addLayer({
      id: "wifi",
      type: "circle",
      source: "wifi",
      paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 2.5, 16, 4, 18, 6], "circle-color": c.paper, "circle-stroke-color": fill, "circle-stroke-width": 2, "circle-pitch-alignment": "map" },
    });
    // Buildings from the same tiles, faint and see-through; the spot markers float above them
    map.setLayoutProperty("building", "visibility", "none");
    map.addLayer({
      id: "buildings-3d",
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 14,
      paint: { "fill-extrusion-color": mixHex(c.paper, c.line, 0.4), "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.35 },
    });
  }

  // Columns, the ring, the grey beyond it and the Wi-Fi follow the answer and the carrier filter
  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== "ready" || !map) return;
    const area = center ? ring(center.lat, center.lon, answer?.radius ?? 300) : null;
    (map.getSource("area") as GeoJSONSource).setData(area ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [area] } } : NONE);
    (map.getSource("mask") as GeoJSONSource).setData(area ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [WORLD, [...area].reverse()] } } : NONE);
    (map.getSource("wifi") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: wifi.map((w) => ({ type: "Feature", properties: { carrier: w.provider }, geometry: { type: "Point", coordinates: [w.lon, w.lat] } })),
    });
  }, [mapState, answer, center, wifi]);

  // The searched address as a labelled pin (a DOM marker, so it uses the hub's type and stays upright when tilted)
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (mapState !== "ready" || !map || !ml) return;
    if (!center) {
      pinRef.current?.remove();
      pinRef.current = null;
      return;
    }
    if (!pinRef.current) {
      const el = document.createElement("div");
      el.className = "emf-pin";
      el.style.zIndex = "20";
      el.innerHTML = "<span>찾은 주소</span>";
      pinRef.current = new ml.Marker({ element: el, anchor: "bottom" });
    }
    pinRef.current.setLngLat([center.lon, center.lat]).addTo(map);
  }, [mapState, center]);

  useEffect(() => {
    if (mapState === "ready") mapRef.current?.setLayoutProperty("wifi", "visibility", showWifi ? "visible" : "none");
  }, [mapState, showWifi]);

  // A new address moves the camera to its ring (at once when motion is reduced)
  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== "ready" || !map || !center) return;
    const pts = ring(center.lat, center.lon, answer?.radius ?? 300, 16);
    const lons = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    // fitBounds has no tilt, so take the centre and zoom it finds and fly there tilted
    // On wider screens the address bar floats over the top of the map, so the ring is fitted below it
    const padding = matchMedia("(max-width: 760px)").matches ? 32 : { top: 132, bottom: 40, left: 40, right: 64 };
    const cam = map.cameraForBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding });
    if (!cam) return;
    // The map row runs again until the tiles of the new place are in ("idle"); the repaint makes sure idle comes
    const t = performance.now();
    setStep("map", { state: "busy", started: t });
    map.once("idle", () => setStep("map", { state: "done", ms: performance.now() - t }));
    // The tilt foreshortens the ring, so the flat fit leaves room: zoom a little past it
    map.easeTo({ center: cam.center, zoom: (cam.zoom ?? 16) + 0.35, ...VIEW, duration: still() ? 0 : 1200 });
    map.triggerRepaint();
  }, [mapState, answer, center, setStep]);

  // One marker per spot (the list's rows): a donut of its carriers, sized by its strongest station, the count inside.
  // DOM markers keep the hub's type and stand upright when the map tilts; stronger spots sit on top.
  // They are left out of the tab order: the list beside the map is the keyboard and screen-reader path to the same spots.
  const spotsRef = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>());
  const openSpotRef = useRef<(key: string, lat: number, lon: number) => void>(() => {});
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (mapState !== "ready" || !map || !ml) return;
    const spots = spotsRef.current;
    for (const { marker } of spots.values()) marker.remove();
    spots.clear();
    for (const g of groups) {
      const level = levelOf(g.top);
      const el = document.createElement("button");
      el.type = "button";
      el.className = "emf-spot";
      el.tabIndex = -1;
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("--size", `${sizeOf(level)}px`);
      el.style.setProperty("--mix", mixGradient(carriersOf(g.stations)));
      el.style.zIndex = String(level + 2);
      // One station: a solid dot in its carrier colour. Several: a donut of their carriers with the count inside.
      if (g.stations.length > 1) el.innerHTML = `<span>${g.stations.length}</span>`;
      else el.dataset.single = "";
      el.title = `${g.label} · 무선국 ${g.stations.length}개 · ${g.stations.length > 1 ? "최대 " : ""}${percentText(g.top)}`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openSpotRef.current(g.key, g.lat, g.lon);
      });
      el.addEventListener("mouseenter", () => setHoverSpot(g.key));
      el.addEventListener("mouseleave", () => setHoverSpot(null));
      spots.set(g.key, { marker: new ml.Marker({ element: el, anchor: "center" }).setLngLat([g.lon, g.lat]).addTo(map), el });
    }
  }, [mapState, groups]);

  // Opened, picked and pointed-at spots: navy ring for opened or picked ("chosen"), a slight lift for pointed-at
  useEffect(() => {
    const picked = chosen ? groupOf.get(chosen) : undefined;
    for (const [key, { el }] of spotsRef.current) {
      el.toggleAttribute("data-on", open.has(key) || key === picked);
      el.toggleAttribute("data-hover", key === hoverSpot);
    }
  }, [groups, open, chosen, groupOf, hoverSpot]);

  // A station picked on the map opens its spot in the list
  useEffect(() => {
    const key = chosen ? groupOf.get(chosen) : undefined;
    if (key) setOpen((o) => (o.has(key) ? o : new Set(o).add(key)));
  }, [chosen, groupOf]);

  // ...and a picked station or a spot opened on the map scrolls into view inside the list only, never the page
  useEffect(() => {
    const list = listRef.current;
    const selector = chosen ? `[data-key="${CSS.escape(chosen)}"]` : focusSpot ? `[data-spot="${CSS.escape(focusSpot)}"]` : null;
    const row = selector ? list?.querySelector<HTMLElement>(selector) : null;
    if (!list || !row) return;
    const top = row.offsetTop;
    if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTo({ top: top - 8, behavior: still() ? "auto" : "smooth" });
  }, [chosen, open, focusSpot]);

  function pick(s: Station) {
    const next = chosen === s.key ? null : s.key;
    setChosen(next);
    if (next) mapRef.current?.easeTo({ center: [s.lon, s.lat], duration: still() ? 0 : 500 });
  }

  function toggle(key: string, lat: number, lon: number) {
    const opening = !open.has(key);
    setOpen((o) => {
      const n = new Set(o);
      if (opening) n.add(key);
      else n.delete(key);
      return n;
    });
    if (opening) mapRef.current?.easeTo({ center: [lon, lat], duration: still() ? 0 : 500 });
  }
  // A spot clicked on the map opens (never closes) its row and brings it into view in the list
  openSpotRef.current = (key, lat, lon) => {
    setOpen((o) => (o.has(key) ? o : new Set(o).add(key)));
    setFocusSpot(key);
    mapRef.current?.easeTo({ center: [lon, lat], duration: still() ? 0 : 500 });
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) look(query.trim());
  }

  const top = summary.top;
  const topPercent = Math.min(top?.percent ?? 0, 100);
  const topPlace = top && center ? directionText(center, top, top.meters) : "";

  // The page head carries the answer: where, how many, and in the lead whether any of it comes near the limit
  const head = (() => {
    if (!answer) return lost ? { title: "자료를 불러오지 못했어요", lead: "잠시 뒤 다시 찾아 보세요." } : { title: "주변 무선국을 찾는 중입니다", lead: "주소를 넣으면 300m 안 무선국의 전자파 세기를 인체보호 기준과 견주어 보여 줍니다." };
    if (!answer.found) return { title: "주소를 찾지 못했어요", lead: "도로명 주소나 '나주시'처럼 시 이름을 넣어 보세요." };
    const title = `${shortAddress(answer.address)} 주변 무선국 ${stations.length}곳`;
    if (!top) return { title, lead: `${verdictText(summary)}.` };
    return { title, lead: `${verdictText(summary)}. 가장 센 곳도 ${percentText(top.percent)}(${top.carrier} · ${topPlace})이고, 1%를 넘는 곳은 ${summary.over1}곳입니다.` };
  })();

  const note = answer && !answer.live ? (answer.asked && answer.asked !== answer.address ? `실시간 자료를 못 받아 '${answer.asked}' 주변은 확인하지 못했습니다. 서울시청 주변 예시 데이터입니다.` : "실시간 자료를 못 받아 서울시청 주변 예시 데이터입니다.") : lost && answer ? "새 주소의 자료를 받지 못해 앞의 결과를 그대로 보여 줍니다." : null;

  return (
    <>
      <Band kicker="지도 시연" title={head.title} lead={head.lead} />
      <div className="content">
        <div className="emf">
          <section className="panel emf-map" aria-label="무선국 지도">
            <div className="emf-stage">
              <div ref={box} className="emf-canvas" />
              {mapState === "failed" && <p className="emf-fail">지도를 불러오지 못해 무선국 위치는 확인하지 못했습니다. 옆 목록으로 보세요.</p>}

              <div className="emf-float">
                <form className="emf-search" onSubmit={submit} role="search">
                  <label htmlFor="emf-address" className="visually-hidden">
                    주소
                  </label>
                  <input id="emf-address" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="주소 넣기 — 예: 전라남도 나주시 빛가람로 760" maxLength={80} />
                  <button className="btn-primary" type="submit" disabled={busy || !query.trim()}>
                    {busy ? "찾는 중" : "찾기"}
                  </button>
                  <p className="emf-examples">
                    예시
                    {EXAMPLES.map((e) => (
                      <button key={e.address} type="button" disabled={busy} onClick={() => (setQuery(e.address), look(e.address))}>
                        {e.label}
                      </button>
                    ))}
                  </p>
                </form>

                {panel ? (
                  <div className="emf-card emf-loading" data-settled={!running || undefined} role="status" aria-label="자료를 받는 과정">
                    <p className="emf-card-head">{running ? "자료를 받는 중" : "모두 받았습니다"}</p>
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
                ) : null}
              </div>

              {mapState === "ready" && (
                <p className="emf-hint" data-show={hint || undefined} aria-hidden={!hint || undefined}>
                  끌어서 이동 · 휠로 확대 · 오른쪽 버튼(또는 Ctrl)을 누른 채 끌면 돌리고 기울입니다
                </p>
              )}
            </div>
            <div className="emf-legend" aria-label="범례">
              <p>
                <b>테두리 = 통신사</b>
                {[...CARRIERS, "기타"].map((name) => (
                  <span key={name} className="emf-key">
                    <span className="emf-dot" style={{ background: carrierColor(name) }} />
                    {name === "기타" ? "기타 · 공공" : name}
                  </span>
                ))}
              </p>
              <p>
                <b>크기 = 그 자리 가장 센 세기</b>
                {LEVELS.map((l) => (
                  <span key={l.label} className="emf-key">
                    <span className="emf-size" style={{ width: `${l.size / 2.6}px`, height: `${l.size / 2.6}px` }} />
                    {l.label}
                  </span>
                ))}
                <span className="emf-key">숫자 = 무선국 수 · 꽉 찬 점 = 1개</span>
              </p>
              <p>
                <b>바닥 원 = 와이파이</b>
                <span className="emf-key">
                  <span className="emf-dot" data-wifi />
                  {wifi.length ? `${wifi.length}곳` : "없음"}
                </span>
                <button type="button" className="emf-toggle" aria-pressed={showWifi} onClick={() => setShowWifi((on) => !on)}>
                  보기
                </button>
              </p>
            </div>
          </section>

          <section className="panel emf-side" aria-labelledby="emf-list-title">
            <div className="emf-side-head">
              <div className="emf-side-title">
                <h2 id="emf-list-title">{answer?.found ? `무선국 ${shown.length}곳 · 자리 ${groups.length}곳` : "무선국"}</h2>
                <div className="emf-seg" role="group" aria-label="목록 순서">
                  {(["near", "strong"] as const).map((o) => (
                    <button key={o} type="button" aria-pressed={order === o} onClick={() => setOrder(o)}>
                      {o === "near" ? "가까운 순" : "센 순"}
                    </button>
                  ))}
                </div>
              </div>
              {answer && (
                <div className="emf-scale-box">
                  <p className="emf-scale-labels">
                    <span>
                      <span className="status" data-state={answer.live ? "done" : undefined}>
                        {answer.live ? "실시간" : "예시 데이터"}
                      </span>
                      {answer.found && top && (
                        <>
                          가장 센 곳 <b>{Number((top.percent ?? 0).toPrecision(2))}%</b>
                        </>
                      )}
                    </span>
                    {answer.found && top && <span>인체보호 기준 100%</span>}
                  </p>
                  {answer.found && top && (
                    <div className="emf-scale" role="img" aria-label={`가장 센 곳 ${percentText(top.percent)}, 인체보호 기준은 100%`}>
                      <span className="emf-scale-fill" style={{ width: `${Math.max(topPercent, 0.6)}%` }} />
                    </div>
                  )}
                </div>
              )}
              {note && <p className="hint">{note}</p>}
              {carriers.length > 1 && (
                <div className="emf-seg emf-seg-wide" role="group" aria-label="통신사로 거르기">
                  {[{ name: ALL, count: stations.length }, ...carriers].map((c) => (
                    <button key={c.name} type="button" aria-pressed={carrier === c.name} onClick={() => setCarrier(c.name)}>
                      {c.name !== ALL && <span className="emf-dot" style={{ background: carrierColor(c.name) }} />}
                      {c.name} {c.count}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {groups.length === 0 ? (
              <p className="meta emf-empty">{busy ? "찾는 중입니다." : "보여 줄 무선국이 없어요."}</p>
            ) : (
              <ol ref={listRef} className="emf-list">
                {groups.map((g) => {
                  const isOpen = open.has(g.key);
                  const mix = carriersOf(g.stations);
                  return (
                    <li key={g.key} className="emf-group" data-spot={g.key}>
                      <button type="button" className="emf-group-head" aria-expanded={isOpen} data-hover={g.key === hoverSpot || undefined} onClick={() => toggle(g.key, g.lat, g.lon)} onMouseEnter={() => setHoverSpot(g.key)} onMouseLeave={() => setHoverSpot(null)}>
                        <span className="emf-mix" aria-hidden>
                          {mix.map((m) => (
                            <span key={m.name} className="emf-dot" style={{ background: carrierColor(m.name) }} />
                          ))}
                        </span>
                        <span className="emf-name">
                          <b>{g.label}</b>
                          <span>
                            무선국 {g.stations.length}개 · {mix.map((m) => `${m.name} ${m.count}`).join(" · ")}
                          </span>
                        </span>
                        <span className="emf-value">{g.stations.length > 1 ? `최대 ${percentText(g.top)}` : percentText(g.top)}</span>
                      </button>
                      {isOpen && (
                        <ol className="emf-stations">
                          {g.stations.map((s) => {
                            const on = s.key === chosen;
                            return (
                              <li key={s.key} data-key={s.key}>
                                <button type="button" aria-pressed={on} onClick={() => pick(s)}>
                                  <span className="emf-dot" style={{ background: carrierColor(s.carrier) }} />
                                  <span className="emf-name">
                                    <b>{s.name}</b>
                                    <span>{s.carrier}</span>
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
                                    <dt>등록 주소</dt>
                                    <dd>{s.address || "없음"}</dd>
                                  </dl>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
        <div className="tools">
          <Link className="ghost" href="/topics/07">
            ← 07 주제 카드
          </Link>
        </div>
      </div>
    </>
  );
}
