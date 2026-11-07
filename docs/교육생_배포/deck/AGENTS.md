# 이 프로젝트 규칙 — 3D 발표 덱 (deck)

`setup.ps1` 이 설치한 전역 규칙에 더해, 이 폴더에서만 지킨다.

## 1. 무엇을 만드나

- 보고서(`..\report`) 한 편을 **6장 발표 덱**과 **30초 영상**으로 만든다.
- 줄거리는 `deck-plan.md`, 장은 `index.html`. 작업 전에 이 둘을 먼저 읽는다. 맥락은 대화가 아니라 파일에 둔다.
- 처음부터 만들지 않는다. 예시 덱의 장 · 3D 장면 3개를 고쳐 쓴다.

## 2. 구조 — 5층

| 층 | 파일 | 고치는 법 |
|---|---|---|
| 장 | `index.html` 의 `<section class="slide">` | 장마다 제목은 하려는 말 한 문장, 본문 3줄 이하 |
| 모양 | `src/style.css` | 색은 `src/params.js` 로. 글자는 제목 72px · 본문 40px 아래로 줄이지 않는다 |
| 움직임 | 요소의 `data-in` (`up` · `fade` · `count`) · `data-at`(ms) | 새 움직임 코드를 쓰지 않고 속성으로 |
| 3D | `src/scenes/` 의 `globe.js` · `bars.js` · `wave.js`, 장의 `data-scene` | 새 장면은 셋 중 하나를 복사해 고친다 |
| 조절 | `src/panel.js` · `src/params.js` | 처음 값은 `params.js` 에서 |

- **모든 움직임은 시간 t로 그린다.** 장면은 `update(t, p)` 에서 t(초)만 보고 모양을 정한다. `Math.random` · `Date.now` · `setTimeout` 으로 움직이지 않는다 — 영상이 화면과 달라진다. 시계는 `src/deck.js` 하나뿐이다.
- 막대 숫자는 장의 `data-values` · `data-labels` · `data-unit` 에 쓴다. 숫자는 보고서 표에 있는 것만 쓰고, 지어내지 않는다.

## 3. 성능 규칙 — 그래픽 가속 없는 노트북에서도 돈다

- 새 패키지를 설치하지 않는다. `package.json` 에 있는 것만 쓴다.
- 3D는 한 장에 하나. 점(입자)은 장면마다 15,000개 이하, 막대는 12개 이하.
- 렌더 해상도는 1920×1080이 상한이다 (`src/stage.js`). 늘리지 않는다.
- 가벼운 모드를 지우지 않는다 — 그래픽 가속이 없으면 저절로 켜져 빛 번짐을 끄고 점 수와 해상도를 줄인다. 새 장면도 `light` 일 때 점을 줄인다.

## 4. 처음 준비 — "시작하기.md 대로 준비해줘"

1. `npm.cmd install`
2. `npm.cmd run build` 로 덱이 빌드되는지 확인한다
3. 3줄로 보고하고, 새 PowerShell 창에서 `npm.cmd run dev` 를 켜고 http://localhost:5173 을 열라고 안내한다. 다음은 `deck-build 스킬로 표지 3D 장면 색을 기관 색으로 바꿔줘`

## 5. 확인

- 장을 고친 뒤 `npm.cmd run build` 가 통과하는지 본다.
- `ego-browser` 스킬로 http://localhost:5173/#장번호 를 열어 글자 넘침 · 겹침을 본다. 화면을 읽는 것도 사용량을 쓰니 고친 장만 연다.
- 영상: `npm.cmd run export -- --slides 1,3,6 --sec 10` (장 번호 · 장마다 초). `--gif` 로 GIF도, `--hd` 로 1920×1080.

## 6. 명령 (스킬)

- `deck-plan`(보고서 → 6장 줄거리) · `deck-build`(장 · 3D 만들기) · `deck-export`(영상) 3개가 `.agents/skills/` 에 있다.
- 이 명령들은 `setup.ps1` 이 전역에 설치한 스킬을 불러 쓴다: `think`(줄거리 순서를 따질 때), `impeccable`(장 디자인). 보고서 hwpx는 `kordoc` MCP로 읽는다.

## 7. 커밋

- 커밋 · 푸시는 사용자가 시킬 때만 한다.
