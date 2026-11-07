// 3D 막대그래프 — 장의 data-values · data-labels 숫자로 막대를 세운다. 마지막 막대는 강조 색
import * as THREE from "three";
import { easeOut } from "./ease.js";

export function createBars(slide) {
  const values = (slide.dataset.values ?? "").split(",").map(Number).filter((v) => Number.isFinite(v)).slice(0, 12); // 막대 상한 12개
  const names = (slide.dataset.labels ?? "").split(",");
  const unit = slide.dataset.unit ?? "";
  const max = Math.max(1, ...values);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(4, 8, 6);
  scene.add(sun);

  const group = new THREE.Group();
  group.position.set(2.2, -2.2, 0); // 오른쪽 아래 — 왼쪽 위는 제목 자리
  scene.add(group);
  const grid = new THREE.GridHelper(16, 16);
  grid.material.transparent = true;
  grid.material.opacity = 0.18;
  group.add(grid);

  const gap = Math.min(1.6, 8 / Math.max(1, values.length));
  const HEIGHT = 3.6;
  const bars = values.map((v, i) => {
    const geo = new THREE.BoxGeometry(gap * 0.6, 1, gap * 0.6);
    geo.translate(0, 0.5, 0); // 바닥에서 위로 자란다
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }));
    mesh.position.x = (i - (values.length - 1) / 2) * gap;
    group.add(mesh);
    return { mesh, h: (v / max) * HEIGHT, v };
  });

  const grow = (t, i) => easeOut((t - 0.5 - i * 0.18) / 1.1);
  let now = 0;

  function update(t, p) {
    now = t;
    const a = -0.28 + 0.07 * Math.sin(t * 0.4);
    camera.position.set(Math.sin(a) * 14, 3.2, Math.cos(a) * 14);
    camera.lookAt(0, 0, 0);
    grid.material.color.set(p.color);
    bars.forEach((b, i) => {
      const last = i === bars.length - 1;
      b.mesh.scale.y = Math.max(0.001, b.h * grow(t, i));
      b.mesh.material.color.set(last ? p.accent : p.color);
      b.mesh.material.emissive.set(last ? p.accent : p.color).multiplyScalar(0.25);
    });
  }

  // 막대 위 값 · 아래 이름을 놓을 화면 좌표 (1920×1080 기준) — src/deck.js 가 글자를 붙인다
  const v = new THREE.Vector3();
  const toStage = (x, y, z) => {
    v.set(x, y, z);
    group.localToWorld(v).project(camera);
    return { x: ((v.x + 1) / 2) * 1920, y: ((1 - v.y) / 2) * 1080 };
  };
  function labels() {
    return bars.map((b, i) => {
      const k = grow(now, i);
      const top = toStage(b.mesh.position.x, b.h * k + 0.15, 0);
      const base = toStage(b.mesh.position.x, 0, gap * 0.6);
      return { top, base, value: `${Math.round(b.v * k).toLocaleString("ko-KR")}${unit}`, name: names[i] ?? "", shown: k > 0.02 };
    });
  }

  function dispose() {
    scene.traverse((m) => {
      m.geometry?.dispose();
      m.material?.dispose();
    });
  }

  return { scene, camera, update, labels, dispose };
}
