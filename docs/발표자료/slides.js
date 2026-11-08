// → · Space · PageDown next slide, ← · PageUp · Backspace previous, Home/End jump, F toggles full screen.
// The cover picks the day — click a card or press 1 · 2 — and only that day's slides follow; ← from the day's first slide comes back to the cover.
// The address keeps the day and the slide (#d2-4 = day 2, 4th slide after the cover).
// Only structure slides move: their flow lines redraw each time the slide is entered (slides.css).
// The day-2 opening video plays full screen on click or Enter; it leaves full screen when it ends or on Esc.
const every = [...document.querySelectorAll(".slide")];
const deck = document.querySelector(".deck");
let day = 0;
let slides = [];
let at = -1;

document.documentElement.classList.add("motion");

function fit() {
  deck.style.setProperty("--scale", Math.min(innerWidth / 1920, innerHeight / 1080));
}

function pick(d) {
  day = d;
  slides = every.filter((s) => s.dataset.day === "0" || Number(s.dataset.day) === d);
  document.querySelectorAll("[data-pick]").forEach((b) => b.classList.toggle("on", Number(b.dataset.pick) === d));
}

const opening = document.querySelector(".opening-video");

// Play and request full screen in the same user gesture, so sound and full screen are both allowed
function playOpening() {
  if (!opening) return;
  opening.currentTime = 0;
  opening.play();
  opening.requestFullscreen?.().catch(() => {});
}

function show(i) {
  at =Math.max(0, Math.min(i, slides.length - 1));
  every.forEach((s) => s.classList.remove("is-on"));
  opening?.pause();
  const s = slides[at];
  void s.offsetWidth; // restart the map drawing on every entry
  s.classList.add("is-on");
  history.replaceState(null, "", at === 0 ? location.pathname : `#d${day}-${at}`);
}

function go(step) {
  if (at === 0 && step > 0 && !day) return; // the cover waits for a day
  show(at + step);
}

function fromHash() {
  const m = location.hash.match(/^#d([12])-(\d+)$/);
  if (m) { pick(Number(m[1])); show(Number(m[2])); } else { pick(0); show(0); }
}

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  // While the video fills the screen, keys belong to it: Space pauses, Esc (browser) leaves
  if (opening && document.fullscreenElement === opening) {
    if (e.key === " ") { e.preventDefault(); opening.paused ? opening.play() : opening.pause(); }
    return;
  }
  if (e.key === "Enter" && opening && slides[at]?.contains(opening) && !e.target.closest?.("button")) { e.preventDefault(); playOpening(); return; }
  const k = e.key;
  if (["ArrowRight", "PageDown", " "].includes(k)) { e.preventDefault(); go(1); }
  else if (["ArrowLeft", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); go(-1); }
  else if (k === "Home") show(0);
  else if (k === "End") show(slides.length - 1);
  else if ((k === "1" || k === "2") && at === 0) { pick(Number(k)); show(1); }
  else if (k === "f" || k === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
});

document.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => { pick(Number(b.dataset.pick)); show(1); }));
if (opening) {
  opening.addEventListener("click", playOpening);
  document.querySelector(".opening-play")?.addEventListener("click", playOpening);
  opening.addEventListener("ended", () => document.fullscreenElement === opening && document.exitFullscreen());
  // Back on the slide: stop and show the first frame again
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement !== opening) {
      opening.pause();
      opening.load();
    }
  });
}
addEventListener("resize", fit);
fit();
fromHash();
