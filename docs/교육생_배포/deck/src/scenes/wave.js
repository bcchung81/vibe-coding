// 전파 파동 — 가운데에서 퍼지는 물결 모양 점 바닥과 빛나는 송신점. 맺음 장에 쓴다
import * as THREE from "three";
import { easeOut } from "./ease.js";

export function createWave(slide, { light }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
  camera.position.set(0, 3.6, 9);
  camera.lookAt(0, -0.6, 0);

  const group = new THREE.Group();
  group.position.set(1.8, -0.4, 0);
  scene.add(group);

  // 점 수: 보통 120×120 = 14,400 · 가벼운 모드 60×60 = 3,600
  const G = light ? 60 : 120;
  const SIZE = 16;
  const pos = new Float32Array(G * G * 3);
  const rad = new Float32Array(G * G);
  for (let i = 0; i < G; i++) {
    for (let j = 0; j < G; j++) {
      const n = i * G + j;
      const x = (i / (G - 1) - 0.5) * SIZE;
      const z = (j / (G - 1) - 0.5) * SIZE;
      pos.set([x, 0, z], n * 3);
      rad[n] = Math.hypot(x, z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dots = new THREE.Points(geo, new THREE.PointsMaterial({ size: light ? 0.07 : 0.05 }));
  const tower = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), new THREE.MeshBasicMaterial());
  tower.position.y = 0.5;
  group.add(dots, tower);

  function update(t, p) {
    const amp = 0.38 * easeOut(t / 1.6);
    for (let n = 0; n < rad.length; n++) {
      const r = rad[n];
      pos[n * 3 + 1] = Math.sin(r * 1.6 - t * 2.2) * amp * Math.exp(-r * 0.12);
    }
    geo.attributes.position.needsUpdate = true;
    dots.material.color.set(p.color);
    tower.material.color.set(p.accent);
    tower.scale.setScalar(1 + 0.25 * Math.sin(t * 4.4));
    group.rotation.y = t * 0.05;
  }

  function dispose() {
    scene.traverse((m) => {
      m.geometry?.dispose();
      m.material?.dispose();
    });
  }

  return { scene, camera, update, dispose };
}
