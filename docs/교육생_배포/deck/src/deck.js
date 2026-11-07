// 장 넘기기와 움직임 층 — 모든 장은 "t초의 모습"으로 그린다.
// 화면으로 볼 때는 시계가 t를 흘려 보내고, 영상을 찍을 때는 scripts/export.mjs 가 t를 1/30초씩 넣는다.
import anime from "animejs";
import { easeOut } from "./scenes/ease.js";

export function createDeck({ stage, exporting }) {
  const root = document.getElementById("stage");
  const slides = [...root.querySelectorAll(".slide")];
  const countEl = root.querySelector(".count");

  // data-in 등장 움직임을 장마다 멈춘 타임라인 하나로 — seek(ms)로 그 순간을 만든다
  const timelines = slides.map((slide) => {
    const tl = anime.timeline({ autoplay: false, easing: "easeOutCubic" });
    slide.querySelectorAll("[data-in]").forEach((el, i) => {
      const at = Number(el.dataset.at ?? i * 150);
      const move = el.dataset.in === "up" ? { translateY: [40, 0] } : {};
      tl.add({ targets: el, opacity: [0, 1], ...move, duration: el.dataset.in === "up" ? 700 : 600 }, at);
    });
    return tl;
  });

  // data-in="count" — 적힌 숫자(쉼표 · 소수 그대로)까지 1.5초 동안 센다
  const counters = slides.map((slide) =>
    [...slide.querySelectorAll('[data-in="count"]')].map((el) => {
      const text = el.textContent.trim();
      const digits = (text.split(".")[1] ?? "").length;
      return { el, at: Number(el.dataset.at ?? 0) / 1000, target: Number(text.replace(/,/g, "")), digits };
    }),
  );

  // 막대 장의 값 · 이름 글자
  const labelEls = slides.map((slide) => {
    const box = slide.querySelector(".labels");
    if (!box) return null;
    const n = (slide.dataset.values ?? "").split(",").length;
    return Array.from({ length: n }, () => {
      const value = document.createElement("span");
      value.className = "value";
      const name = document.createElement("span");
      box.append(value, name);
      return { value, name };
    });
  });

  function draw(i, t) {
    slides.forEach((s, k) => (s.hidden = k !== i));
    timelines[i].seek(t * 1000);
    for (const c of counters[i]) {
      const v = c.target * easeOut((t - c.at) / 1.5);
      c.el.textContent = v.toLocaleString("ko-KR", { minimumFractionDigits: c.digits, maximumFractionDigits: c.digits });
    }
    const scene = stage.render(slides[i], t);
    if (scene?.labels && labelEls[i]) {
      scene.labels().forEach((l, k) => {
        const el = labelEls[i][k];
        if (!el) return;
        el.value.textContent = l.value;
        el.name.textContent = l.name;
        Object.assign(el.value.style, { left: `${l.top.x}px`, top: `${l.top.y}px`, opacity: l.shown ? 1 : 0 });
        Object.assign(el.name.style, { left: `${l.base.x}px`, top: `${l.base.y + 14}px`, opacity: l.shown ? 1 : 0 });
      });
    }
    countEl.textContent = `${i + 1} / ${slides.length}`;
  }

  // 창 크기에 맞춰 1920×1080 무대를 줄이고 늘린다
  const fit = () => {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    root.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
  };
  fit();
  addEventListener("resize", fit);

  // 영상 찍기 — 고른 장을 순서대로 이어 붙인 시간표에서 t초를 그린다
  let plan = [];
  window.deck = {
    count: slides.length,
    ready: false,
    plan(numbers, sec) {
      const picked = (numbers?.length ? numbers : slides.map((_, k) => k + 1)).map((n) => n - 1).filter((k) => slides[k]);
      let start = 0;
      plan = picked.map((k) => {
        const seg = { i: k, start, sec: sec || Number(slides[k].dataset.sec || 6) };
        start += seg.sec;
        return seg;
      });
      return { total: start, slides: plan.map((s) => ({ no: s.i + 1, sec: s.sec })) };
    },
    renderAt(t) {
      const seg = plan.find((s) => t < s.start + s.sec) ?? plan[plan.length - 1];
      draw(seg.i, t - seg.start);
    },
  };
  document.fonts.ready.then(() => (window.deck.ready = true));
  if (exporting) return;

  // 화면으로 볼 때 — 주소 #3 이 3장. 장에 들어온 때부터 시계가 흐른다
  const fromHash = () => Math.min(slides.length, Math.max(1, Number(location.hash.slice(1)) || 1)) - 1;
  let cur = fromHash();
  let entered = performance.now();
  const go = (i) => {
    cur = Math.min(slides.length - 1, Math.max(0, i));
    entered = performance.now();
    history.replaceState(null, "", `#${cur + 1}`);
  };
  addEventListener("hashchange", () => fromHash() !== cur && go(fromHash()));
  addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) go(cur + 1);
    if (["ArrowLeft", "PageUp"].includes(e.key)) go(cur - 1);
    if (e.key === "f" || e.key === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  });
  root.addEventListener("click", () => go(cur + 1));
  const loop = (now) => {
    draw(cur, (now - entered) / 1000);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
