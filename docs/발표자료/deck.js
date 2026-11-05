// ←/→ · Space · PageUp/PageDown move, Home/End jump, F toggles full screen. The address keeps the slide number (#3).
const slides = [...document.querySelectorAll(".slide")];
const count = document.querySelector(".count");
let at = 0;

function show(i) {
  at = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, k) => (s.hidden = k !== at));
  count.textContent = `${at + 1} / ${slides.length}`;
  history.replaceState(null, "", `#${at + 1}`);
}

const fit = () => document.documentElement.style.setProperty("--scale", Math.min(innerWidth / 1920, innerHeight / 1080));
const fromHash = () => show(Number(location.hash.slice(1)) - 1 || 0);

addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const step = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, " ": 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[e.key];
  if (step) {
    e.preventDefault();
    show(at + step);
  } else if (e.key === "Home") show(0);
  else if (e.key === "End") show(slides.length - 1);
  else if (e.key === "f" || e.key === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
});
addEventListener("resize", fit);
addEventListener("hashchange", fromHash);
fit();
fromHash();
