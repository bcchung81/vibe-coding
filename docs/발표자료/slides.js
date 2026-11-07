// → · Space · PageDown next slide, ← · PageUp · Backspace previous, Home/End jump, F toggles full screen.
// The cover picks the day — click a card or press 1 · 2 — and only that day's slides follow; ← from the day's first slide comes back to the cover.
// The address keeps the day and the slide (#d2-4 = day 2, 4th slide after the cover). No motion: every slide shows whole at once.
const every = [...document.querySelectorAll(".slide")];
const rail = document.querySelector(".rail");
const count = document.querySelector(".count");
const PERIODS = { 1: 4, 2: 5 };
let day = 0;
let slides = [];
let at = -1;

// The cover plus the chosen day's slides; the cover card of that day stays marked
function pick(d) {
  day = d;
  slides = every.filter((s) => s.dataset.day === "0" || Number(s.dataset.day) === d);
  document.querySelectorAll("[data-pick]").forEach((b) => b.classList.toggle("on", Number(b.dataset.pick) === d));
}

// Navy band: the day and its periods, the current one marked
function paintRail(slide) {
  const d = Number(slide.dataset.day);
  rail.hidden = !d;
  if (!d) return;
  const now = Number(slide.dataset.period);
  const pills = Array.from({ length: PERIODS[d] }, (_, k) => `<i class="${k + 1 === now ? "now" : k + 1 < now ? "past" : ""}">${k + 1}</i>`).join("");
  rail.innerHTML = `<ol class="track"><li class="on"><span>${d}일차</span>${pills}</li></ol>`;
}

// Diagrams are drawn on a 1744 × data-h canvas. The first time a slide shows, stretch the canvas to the free height
// of the body (at most 1.5×): box tops and heights and the lines' y values grow, x stays, so text and arrowheads keep their shape.
const stretchY = (d, k) =>
  d.replace(/([MHV])([^MHV]*)/g, (_, c, a) => {
    const n = a.trim().split(/[\s,]+/).map(Number);
    return c === "H" ? c + n[0] : c === "V" ? c + n[0] * k : `${c}${n[0]} ${n[1] * k}`;
  });
function fitArch(slide) {
  slide.querySelectorAll(".arch:not([data-k])").forEach((fig) => {
    const h0 = Number(fig.dataset.h || 560);
    const k = Math.min(1.5, Math.max(1, fig.clientHeight / h0));
    fig.dataset.k = k.toFixed(2);
    fig.style.flex = "none";
    fig.style.height = `${h0 * k}px`;
    fig.querySelectorAll(".az, .an, .pill, .al").forEach((el) => {
      for (const side of ["top", "height"]) if (el.style[side]) el.style[side] = `${parseFloat(el.style[side]) * k}px`;
    });
    const svg = fig.querySelector("svg.lines");
    svg.setAttribute("viewBox", `0 0 1744 ${h0 * k}`);
    svg.querySelectorAll("path").forEach((p) => p.setAttribute("d", stretchY(p.getAttribute("d"), k)));
  });
}

function show(i, force = false) {
  i = Math.max(0, Math.min(slides.length - 1, i));
  if (i === at && !force) return;
  every.forEach((el) => (el.hidden = el !== slides[i]));
  fitArch(slides[i]);
  at = i;
  paintRail(slides[i]);
  count.textContent = at ? `${at} / ${slides.length - 1}` : "";
  history.replaceState(null, "", day ? `#d${day}-${i}` : location.pathname);
}

const go = (d) => {
  pick(d);
  show(1, true);
};
const next = () => (day ? show(at + 1) : go(1));
const prev = () => show(at - 1);
const fit = () => document.documentElement.style.setProperty("--scale", Math.min(innerWidth / 1920, innerHeight / 1080));
function fromHash() {
  const m = location.hash.match(/^#d([12])-(\d+)$/);
  pick(m ? Number(m[1]) : 0);
  show(m ? Number(m[2]) : 0, true);
}

addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const card = e.target.closest?.("[data-pick]");
  if (card && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    go(Number(card.dataset.pick));
  } else if (e.key === "1" || e.key === "2") go(Number(e.key));
  else if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) {
    e.preventDefault();
    next();
  } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) {
    e.preventDefault();
    prev();
  } else if (e.key === "Home") show(0);
  else if (e.key === "End") show(slides.length - 1);
  else if (e.key === "f" || e.key === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
});
document.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.pick))));
addEventListener("resize", fit);
addEventListener("hashchange", fromHash);
fit();
fromHash();
