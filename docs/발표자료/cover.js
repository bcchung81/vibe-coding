/* Three.js r180, bundled locally in vendor/three.min.js (MIT).
 * aimotion 148: only the technique of groups at rest + direction * progress,
 * with staggered, time-derived transforms. All objects, layout and copy are
 * authored here for this course; no demo subject, palette or choreography reused.
 */
(async () => {
  const cover = document.querySelector('.cover');
  const art = cover?.querySelector('.cover-art');
  const canvas = art?.querySelector('canvas');
  if (!canvas || !window.THREE) return;
  await document.fonts.ready;

  const T = window.THREE;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return; // The semantic cover and day buttons remain usable without WebGL.
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(960, 760, false);
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-5.7, 5.7, 4.5125, -4.5125, 0.1, 60);
  camera.position.set(0, 0.1, 18);
  camera.lookAt(0, 0.1, 0);
  scene.add(new T.HemisphereLight(0xffffff, 0xc0cbd9, 2.3));
  const key = new T.DirectionalLight(0xffffff, 3.2);
  key.position.set(-4, 7, 10);
  scene.add(key);
  const fill = new T.DirectionalLight(0xc3dfff, 1.2);
  fill.position.set(7, 1, 3);
  scene.add(fill);

  const root = new T.Group();
  root.rotation.set(0.13, -0.29, -0.045);
  root.position.set(0.05, 0.12, 0);
  scene.add(root);
  const ink = '#1d1d1f', blue = '#0066cc', muted = '#606067';
  const font = '"Slides Sans", Pretendard, sans-serif';
  const white = new T.MeshStandardMaterial({ color: 0xe7edf4, roughness: 0.65, metalness: 0.06 });
  const blueMat = new T.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.36, metalness: 0.12 });

  function rect(c, x, y, w, h, r, color) {
    c.fillStyle = color;
    c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  }
  function text(c, value, x, y, size = 28, color = ink, weight = 600) {
    c.fillStyle = color; c.font = `${weight} ${size}px ${font}`; c.fillText(value, x, y);
  }
  function roundedShape(w, h, r) {
    const x = -w / 2, y = -h / 2, s = new T.Shape();
    s.moveTo(x + r, y); s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function panel(w, h, draw) {
    const g = new T.Group();
    const geo = new T.ExtrudeGeometry(roundedShape(w, h, 0.13), {
      depth: 0.09, bevelEnabled: true, bevelSegments: 3, steps: 1,
      bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 8,
    });
    g.add(new T.Mesh(geo, white));
    const image = document.createElement('canvas');
    image.width = Math.round(w * 180); image.height = Math.round(h * 180);
    const c = image.getContext('2d');
    c.scale(image.width / 1000, image.width / 1000);
    const H = 1000 * h / w;
    rect(c, 0, 0, 1000, H, 23, '#ffffff');
    draw(c, H);
    const texture = new T.CanvasTexture(image);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const face = new T.Mesh(new T.PlaneGeometry(w - 0.02, h - 0.02), new T.MeshBasicMaterial({ map: texture, transparent: true }));
    face.position.z = 0.13;
    g.add(face);
    root.add(g);
    return g;
  }

  const web = panel(6.1, 3.95, c => {
    rect(c, 0, 0, 1000, 72, 22, '#f5f5f7');
    for (let i = 0; i < 3; i++) { c.fillStyle = '#c6cbd2'; c.beginPath(); c.arc(35 + i * 25, 35, 7, 0, Math.PI * 2); c.fill(); }
    text(c, '내가 만든 웹앱', 135, 44, 23, muted, 500);
    text(c, '자격시험 공지', 52, 133, 26);
    text(c, '필요한 공지를, 한곳에서.', 52, 207, 45);
    rect(c, 52, 244, 896, 64, 12, '#f5f5f7');
    text(c, '공지 검색', 78, 285, 25, muted, 500);
    text(c, '전체', 52, 356, 25, blue);
    text(c, '접수 안내', 150, 356, 25, muted, 500);
    text(c, '예시 화면', 830, 133, 21, muted, 500);
    const rows = ['정기 자격검정 시행 안내', '필기시험 원서접수 안내'];
    rows.forEach((s, i) => {
      const y = 410 + i * 100;
      rect(c, 52, y - 20, 896, 2, 0, '#e5e8ec');
      text(c, s, 52, y + 28, 28);
      text(c, '공지 확인하기 →', 52, y + 64, 21, blue, 500);
    });
  });
  const report = panel(2.65, 3.45, c => {
    text(c, '보고서', 85, 140, 53, blue);
    text(c, '결론부터,', 85, 270, 76);
    text(c, '한 쪽으로.', 85, 365, 76);
    rect(c, 85, 440, 830, 5, 0, ink);
    text(c, '결론', 85, 535, 38, blue);
    text(c, '활용 기준을 정리하고', 85, 620, 43);
    text(c, '시범 적용을 추진함', 85, 685, 43);
    rect(c, 85, 755, 830, 2, 0, '#d2d2d7');
    text(c, '자료 조사 → 초안 → 윤문', 85, 845, 36, muted, 500);
    text(c, '규칙을 더해 문서로 완성', 85, 910, 36, muted, 500);
    text(c, '.hwpx', 85, 1155, 48, blue);
  });
  const video = panel(3.8, 2.65, (c, H) => {
    text(c, '발표 · 영상', 56, 92, 38, blue);
    text(c, '숫자에 흐름을 더하다', 56, 157, 44);
    rect(c, 56, H - 95, 890, 3, 0, '#d2d2d7');
    rect(c, 56, H - 95, 570, 3, 0, blue);
    text(c, '▶', 56, H - 40, 28, blue);
    text(c, '00:30', 819, H - 40, 27, muted, 500);
  });
  const bars = [];
  [0.48, 0.72, 1.02, 1.3].forEach((height, i) => {
    const bar = new T.Mesh(new T.BoxGeometry(0.37, 1, 0.38), blueMat);
    bar.position.set(-0.8 + i * 0.54, -0.62, 0.38);
    video.add(bar); bars.push({ mesh: bar, height });
  });
  const prompt = panel(3.45, 0.72, c => {
    rect(c, 0, 0, 1000, 209, 23, '#0066cc');
    text(c, '「 내 업무에 쓸 수 있게 만들어줘 」', 45, 126, 45, '#ffffff');
  });

  const parts = [
    { group: web, rest: [0.25, 0.95, 0], dir: [0, 0.45, -0.3], delay: 0, tilt: -0.025 },
    { group: report, rest: [-2.4, -1.25, 1.2], dir: [-0.7, -0.55, 0.4], delay: 0.12, tilt: 0.07 },
    { group: video, rest: [2, -1.65, 1.65], dir: [0.65, -0.3, 0.8], delay: 0.24, tilt: -0.04 },
    { group: prompt, rest: [-0.2, 3.38, 0.2], dir: [0, 0.22, 0.2], delay: 0.04, tilt: 0 },
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 2100;
  let frame = 0, start = 0;
  const ease = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 4);

  // Each pose comes from elapsed time, never from the previous frame.
  function draw(ms) {
    const t = ms / 1000;
    parts.forEach(p => {
      const progress = ease((t - p.delay) / 1.5);
      const amount = 0.4 + 0.6 * progress;
      p.group.position.fromArray(p.rest).addScaledVector(new T.Vector3(...p.dir), amount);
      p.group.rotation.z = p.tilt * amount;
    });
    bars.forEach(({ mesh, height }, i) => {
      const h = height * (0.35 + 0.65 * ease((t - 0.45 - i * 0.07) / 1.1));
      mesh.scale.y = h;
      mesh.position.y = -0.62 + h / 2;
    });
    renderer.render(scene, camera);
  }
  function tick(now) {
    frame = 0;
    if (document.hidden || !cover.classList.contains('is-on')) return;
    const elapsed = Math.min(now - start, duration);
    draw(elapsed);
    if (elapsed < duration) frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0;
    if (!cover.classList.contains('is-on') || document.hidden) return;
    if (reduced.matches) { draw(duration); return; }
    start = performance.now();
    draw(0);
    frame = requestAnimationFrame(tick);
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); cancelAnimationFrame(frame);
    art.classList.remove('ready');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    art.classList.add('ready'); sync();
  });
  new MutationObserver(sync).observe(cover, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  draw(duration);
  art.classList.add('ready');
  sync();
})();
