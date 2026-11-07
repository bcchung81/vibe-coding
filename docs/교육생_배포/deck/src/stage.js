// 3D 층 — 렌더러 하나로 장마다 장면(src/scenes/)을 바꿔 그린다. 빛 번짐은 postprocessing.
import * as THREE from "three";
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { createGlobe } from "./scenes/globe.js";
import { createBars } from "./scenes/bars.js";
import { createWave } from "./scenes/wave.js";

const SCENES = { globe: createGlobe, bars: createBars, wave: createWave };
const W = 1920;
const H = 1080;

// 그래픽 가속 없이 소프트웨어로 그리는 PC — Windows는 WARP(Basic Render Driver), 그 밖에는 SwiftShader · llvmpipe
const SOFTWARE = /swiftshader|warp|basic render|llvmpipe|software/i;

export function createStage(canvas, params, { exporting }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: exporting, powerPreference: "high-performance" });
  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "";
  // 영상은 한 장씩 찍으니 느려도 된다 — 가벼운 모드는 화면으로 볼 때만 저절로 켠다
  if (SOFTWARE.test(gpu) && !exporting) params.light = true;

  let made = new Map(); // 장(section) → 장면

  const size = () => {
    // 해상도 상한: 1920×1080. 가벼운 모드는 0.6배로 그려 늘린다
    renderer.setPixelRatio(params.light ? 0.6 : 1);
    renderer.setSize(W, H, false);
  };
  size();

  function sceneFor(slide) {
    if (!made.has(slide)) {
      const s = SCENES[slide.dataset.scene](slide, { light: params.light });
      const composer = new EffectComposer(renderer);
      const bloom = new BloomEffect({ intensity: params.bloom, luminanceThreshold: 0.15, luminanceSmoothing: 0.3, mipmapBlur: true, radius: 0.7 });
      composer.addPass(new RenderPass(s.scene, s.camera));
      composer.addPass(new EffectPass(s.camera, bloom));
      made.set(slide, { ...s, composer, bloom });
    }
    return made.get(slide);
  }

  return {
    gpu,
    // t초 순간의 그 장 3D를 그린다. 3D가 없는 장은 캔버스를 숨긴다
    render(slide, t) {
      if (!SCENES[slide.dataset.scene]) {
        canvas.hidden = true;
        return null;
      }
      canvas.hidden = false;
      const s = sceneFor(slide);
      s.scene.background.set(params.bg);
      s.update(t * params.speed, params);
      if (params.light || params.bloom === 0) renderer.render(s.scene, s.camera);
      else {
        s.bloom.intensity = params.bloom;
        s.composer.render();
      }
      return s;
    },
    // 가벼운 모드를 바꾸면 점 수 · 해상도가 달라지므로 장면을 다시 만든다
    rebuild() {
      for (const s of made.values()) {
        s.dispose();
        s.composer.dispose();
      }
      made = new Map();
      size();
    },
  };
}
