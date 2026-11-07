// 조절 패널의 처음 값 — 영상(npm.cmd run export)도 이 값으로 찍는다.
// 패널에서 값을 맞춘 뒤 '값 복사'를 눌러 AI에게 붙여 넣으면 이 파일을 바꿔 준다.
export const params = {
  color: "#4f9cff", // 3D 물체 색
  accent: "#f0a830", // 강조 색 — 태그 · 숫자 · 마지막 막대
  bg: "#0b1726", // 배경 색
  speed: 1, // 3D 움직임 빠르기
  bloom: 0.9, // 빛 번짐 세기 (0이면 끔)
  light: false, // 가벼운 모드 — 그래픽 가속이 없는 PC는 저절로 켜진다
};
