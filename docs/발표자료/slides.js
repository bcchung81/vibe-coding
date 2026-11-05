// → · Space · PageDown go forward, ← · PageUp · Backspace go back, Home/End jump, F toggles full screen. The address keeps the slide number (#3).
// A slide with [data-step] parts shows them all first; each → lights one step (the rest step back), the last → marks the finish line, the next → turns the page.
// Motion (GSAP): a short entrance per slide and typing for a step's PowerShell lines. Every state is a class, so the deck still works without GSAP or with reduced motion.
const slides = [...document.querySelectorAll(".slide")];
const rail = document.querySelector(".rail");
const count = document.querySelector(".count");
const calm = !window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches;
const PERIODS = { 1: 4, 2: 5 };
let at = -1;
let st = 0;
let entry = null;
let typing = null;

const stepsOf = (slide) => Math.max(0, ...[...slide.querySelectorAll("[data-step]")].map((el) => Number(el.dataset.step)));

function finish() {
  entry?.progress(1).kill();
  typing?.progress(1).kill();
  entry = typing = null;
}

function paintRail(slide) {
  const day = Number(slide.dataset.day);
  rail.hidden = !day;
  if (!day) return delete document.documentElement.dataset.day;
  document.documentElement.dataset.day = day;
  const now = slide.dataset.period.split(" ").map(Number);
  const pill = (d, p) => {
    const state = d === day && now.includes(p) ? "now" : d < day || (d === day && p < now[0]) ? "past" : "";
    return `<i class="${state}">${p}</i>`;
  };
  const days = Object.entries(PERIODS).map(([d, n]) => {
    d = Number(d);
    const pills = Array.from({ length: n }, (_, k) => pill(d, k + 1)).join("");
    return `<li class="${d === day ? "on" : ""}"><span>${d}일차</span>${pills}</li>`;
  });
  rail.innerHTML = `<p class="where"><b>${day}일차</b>${now.join("–")}교시<span>${slide.dataset.time}</span></p><ol class="track">${days.join("")}</ol>`;
}

function paintCount(n) {
  const pips = n ? `<span class="pips">${Array.from({ length: n }, (_, k) => `<i class="${st === k + 1 || st > n ? "on" : ""}"></i>`).join("")}</span>` : "";
  count.innerHTML = `${pips}<span>${at + 1} / ${slides.length}</span>`;
}

// Entrance: title first, then the body parts in reading order, then the finish line — about 1.5 s in all
function enter(slide) {
  if (calm) return;
  const all = (sel) => slide.querySelectorAll(sel);
  entry = gsap.timeline({ defaults: { ease: "power3.out", clearProps: "opacity,transform" } });
  entry.from(slide, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0);
  entry.from(all(".kicker, .title, .lead, .eyebrow, .cover h1, .rule"), { y: 24, opacity: 0, duration: 0.55, stagger: 0.07 }, 0.05);
  entry.from(all("[data-enter]"), { y: 18, opacity: 0, duration: 0.45, stagger: 0.08 }, 0.25);
  const parts = all(".pipe > .pc, .swim > .sc, .layers > .layer, .cards4 > .card, .branch > .bc");
  if (parts.length) entry.from(parts, { y: 16, opacity: 0, duration: 0.45, stagger: 0.06 }, 0.3);
  const arrows = all(".arr");
  if (arrows.length) entry.from(arrows, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.25, stagger: 0.07, ease: "power2.out" }, 0.5);
  const dots = all(".dots i");
  if (dots.length) entry.from(dots, { scale: 0, duration: 0.35, stagger: 0.05, ease: "back.out(2)" }, 0.5);
  const vlines = all(".vline");
  if (vlines.length) entry.from(vlines, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.3, stagger: 0.15, ease: "power2.out" }, 0.6);
  // Architecture: zones, then nodes, then the flow lines draw in
  entry.from(all(".arch .az"), { opacity: 0, duration: 0.4, stagger: 0.05 }, 0.25);
  entry.from(all(".arch .an, .arch .pill, .arch .al"), { y: 10, opacity: 0, duration: 0.35, stagger: 0.025 }, 0.4);
  const lines = [...all(".arch .ln:not(.dash)")];
  lines.forEach((p) => (p.style.strokeDasharray = p.style.strokeDashoffset = p.getTotalLength()));
  if (lines.length) entry.to(lines, { strokeDashoffset: 0, duration: 0.5, stagger: 0.06, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" }, 0.8);
  const done = slide.querySelector(".done");
  if (done) entry.from(done, { y: 14, opacity: 0, duration: 0.4 }, 0.9);
}

// Typing: a step's PowerShell lines are typed once when that step lights up
function type(lines) {
  if (calm || !lines.length) return;
  typing = gsap.timeline();
  lines.forEach((el) => {
    const text = (el.dataset.text ??= el.textContent);
    el.textContent = "";
    const o = { n: 0 };
    typing.to(o, {
      n: text.length,
      duration: Math.min(0.9, 0.2 + text.length * 0.022),
      ease: "none",
      onStart: () => el.classList.add("now"),
      onUpdate: () => (el.textContent = text.slice(0, Math.round(o.n))),
      onComplete: () => el.classList.remove("now"),
    }, "+=0.18");
  });
}

function setStep(s) {
  finish();
  const slide = slides[at];
  const n = stepsOf(slide);
  st = Math.max(0, Math.min(n ? n + 1 : 0, s));
  const focus = st >= 1 && st <= n;
  slide.querySelectorAll("[data-step]").forEach((el) => {
    const mine = Number(el.dataset.step) === st;
    el.classList.toggle("cur", focus && mine);
    el.classList.toggle("dim", focus && !mine);
  });
  slide.classList.toggle("final", n > 0 && st > n);
  if (focus) type(slide.querySelectorAll(`[data-step="${st}"] .type`));
  paintCount(n);
}

function show(i, s = 0) {
  i = Math.max(0, Math.min(slides.length - 1, i));
  if (i === at) return;
  finish();
  slides.forEach((el, k) => (el.hidden = k !== i));
  at = i;
  paintRail(slides[i]);
  history.replaceState(null, "", `#${i + 1}`);
  setStep(s);
  enter(slides[i]);
}

const next = () => (stepsOf(slides[at]) && st <= stepsOf(slides[at]) ? setStep(st + 1) : show(at + 1));
const prev = () => (st > 0 ? setStep(st - 1) : show(at - 1));
const fit = () => document.documentElement.style.setProperty("--scale", Math.min(innerWidth / 1920, innerHeight / 1080));
const fromHash = () => show(Number(location.hash.slice(1)) - 1 || 0);

addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) {
    e.preventDefault();
    next();
  } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) {
    e.preventDefault();
    prev();
  } else if (e.key === "Home") show(0);
  else if (e.key === "End") show(slides.length - 1);
  else if (e.key === "f" || e.key === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
});
addEventListener("resize", fit);
addEventListener("hashchange", fromHash);
fit();
fromHash();
