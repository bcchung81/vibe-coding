// 지구본 — 점으로 된 구, 궤도 두 줄, 궤도를 도는 위성. 표지에 쓴다 (오른쪽에 둔다)
import * as THREE from "three";
import { easeOut } from "./ease.js";

export function createGlobe(slide, { light }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 10);

  const group = new THREE.Group();
  group.position.set(3.1, 0, 0);
  scene.add(group);

  // 점 수: 보통 4,000 · 가벼운 모드 1,500 (AGENTS.md 상한 15,000)
  const N = light ? 1500 : 4000;
  const R = 2.2;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N; // 골고루 퍼진 점(피보나치 구)
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    pos.set([Math.cos(a) * r * R, y * R, Math.sin(a) * r * R], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dots = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.045, transparent: true }));
  // 뒤쪽 점을 가리는 속 구 — 앞면만 보여 입체가 산다
  const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 48, 32), new THREE.MeshBasicMaterial());
  group.add(core, dots);

  const orbits = [0.5, -0.9].map((tilt, k) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(tilt, 0, k ? 0.4 : -0.3);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * (1.35 + k * 0.2), 0.008, 8, 160), new THREE.MeshBasicMaterial());
    ring.rotation.x = Math.PI / 2;
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial());
    pivot.add(ring, sat);
    group.add(pivot);
    return { pivot, ring, sat, r: R * (1.35 + k * 0.2), speed: k ? -0.45 : 0.7 };
  });

  function update(t, p) {
    const k = easeOut(t / 1.4);
    group.scale.setScalar(0.85 + 0.15 * k);
    dots.material.opacity = k;
    dots.material.color.set(p.color);
    core.material.color.set(p.bg).offsetHSL(0, 0, 0.03);
    group.rotation.set(0.35, t * 0.25, 0);
    for (const o of orbits) {
      o.ring.material.color.set(p.color);
      o.sat.material.color.set(p.accent);
      const a = t * o.speed;
      o.sat.position.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r);
    }
  }

  function dispose() {
    scene.traverse((m) => {
      m.geometry?.dispose();
      m.material?.dispose();
    });
  }

  return { scene, camera, update, dispose };
}
