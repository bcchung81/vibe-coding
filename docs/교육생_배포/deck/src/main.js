// 덱을 켠다: 3D 무대 → 장 넘기기 · 움직임 → 조절 패널. ?export 로 열면 영상 찍기용(패널 · 시계 없음)
import { params } from "./params.js";
import { createStage } from "./stage.js";
import { createDeck } from "./deck.js";
import { createPanel } from "./panel.js";

const query = new URLSearchParams(location.search);
const exporting = query.has("export");
if (exporting) {
  document.body.classList.add("export");
  if (query.has("light")) params.light = true;
}

const paint = () => {
  document.documentElement.style.setProperty("--accent", params.accent);
  document.documentElement.style.setProperty("--bg", params.bg);
  document.querySelector(".badge").hidden = !params.light;
};

const stage = createStage(document.getElementById("gl"), params, { exporting });
paint();
createDeck({ stage, exporting });
if (!exporting) {
  createPanel(params, (key) => {
    if (key === "light") stage.rebuild();
    paint();
  });
}
