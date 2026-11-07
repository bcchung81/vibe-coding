// 조절 층 — 코드 대신 화면의 손잡이로 바꾼다. P 키로 숨기고 다시 연다
import { Pane } from "tweakpane";

export function createPanel(params, onChange) {
  const pane = new Pane({ title: "조절 패널 · P 키로 숨기기" });
  pane.addBinding(params, "color", { label: "3D 색" });
  pane.addBinding(params, "accent", { label: "강조 색" });
  pane.addBinding(params, "bg", { label: "배경 색" });
  pane.addBinding(params, "speed", { label: "속도", min: 0.2, max: 3, step: 0.1 });
  pane.addBinding(params, "bloom", { label: "빛 번짐", min: 0, max: 2, step: 0.05 });
  pane.addBinding(params, "light", { label: "가벼운 모드" });
  const copy = pane.addButton({ title: "값 복사 → AI에게 붙여넣기" });
  copy.on("click", async () => {
    await navigator.clipboard.writeText(`src/params.js 기본값을 이 값으로 바꿔줘: ${JSON.stringify(params)}`);
    copy.title = "복사했습니다";
    setTimeout(() => (copy.title = "값 복사 → AI에게 붙여넣기"), 1500);
  });
  pane.on("change", (ev) => onChange(ev.target.key));
  addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") pane.hidden = !pane.hidden;
  });
  return pane;
}
