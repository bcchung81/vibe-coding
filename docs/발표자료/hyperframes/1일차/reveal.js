// 단계 공개 — 누를 때마다 한 묶음씩 보인다.
// 묶음 k 는 시간 k+1 에서 다 보이고(발표 화면이 그 시간으로 건너뛴다), 뒤 묶음이 보이는 동안 앞 묶음은 흐려진다.
// 마지막 묶음에서는 전부 진하게 돌아와 화면에 오래 두어도 읽힌다. 이동은 건너뛰기라 움직임은 보이지 않는다.
window.hfReveal = function (id, groups) {
  const tl = gsap.timeline({ paused: true });
  const els = groups.map((sels) => sels.flatMap((s) => gsap.utils.toArray("[data-composition-id=\"" + id + "\"] " + s)));
  const last = els.length - 1;
  els.forEach((g, k) => tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, k + 0.7));
  els.forEach((g, k) => {
    if (k > last - 2) return;
    tl.fromTo(g, { opacity: 1 }, { opacity: 0.55, duration: 0.3, ease: "none", immediateRender: false }, k + 1.7);
    tl.fromTo(g, { opacity: 0.55 }, { opacity: 1, duration: 0.3, ease: "none", immediateRender: false }, last + 0.7);
  });
  return tl;
};
