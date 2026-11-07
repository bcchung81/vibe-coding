// 장면들이 함께 쓰는 시간 계산 — 모두 t(초)만 보고 정해진다 (영상에서 같은 t면 같은 그림)
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);
