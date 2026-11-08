---
version: 1
slug: "docs-html"
primary_target: "docs/발표자료/발표.html"
related_targets: ["docs/발표자료/slides.css","docs/발표자료/slides.js"]
---

# 발표덱 (표지에서 1 · 2일차 고르기 · 날마다 10장)

- 범위: `docs/발표자료/발표.html` · `slides.css` · `slides.js` · `fonts/`. 강사 PC에서 파일로 여는 1920×1080 투사 덱. 허브 `/slides` 가 같은 파일을 그대로 읽는다(`lib/slides.ts`). 예전 보고서형 판(남색 · 회갈색)은 지웠다(2026-11-07).
- 모드: Operate — 수강생이 "지금 전체 중 어디 → 할 일 → 시킬 말 → 성공 모습"을 3초 안에 찾는다.
- 청중: 초급을 마친 비개발 기관 실무자 30명, Windows 노트북 · Codex. 형광등 켠 강의실 프로젝터, 뒷자리까지.
- 내용 기준: `docs/발표자료/발표_구성안.md`. 시킬 말 · 명령은 글자 그대로. 장 틀 4가지(구조 그림 · 실습 · 비교 · 마무리). 노트 · 편집 · PDF 기능은 넣지 않는다.
- 사용자 결정(2026-11-07): 새 방향 · 흰 바탕 · 한 파일 통합 · 움직임은 구조 그림에만 · 디자인은 Apple 스타일로 깔끔하게(결정 페이지 4안 모두 거절) · 허브는 덱이 확정되면 따로 맞춘다.

## Direction contract (2026-11-07, 사용자 지정: Apple 스타일 · 흰 바탕)

THESIS: Apple 키노트와 apple.com의 문법 — 한 장에 메시지 하나, 큰 제목, 넉넉한 여백, 흰 바탕 위 옅은 회색 타일. 보고서 서식 · 띠 · 칩으로 덮인 교육 덱(예전 판 포함)을 거절한다.
OWN-WORLD: 흰 #ffffff 바탕, 옅은 회색 타일 #f5f5f7(모서리 28px, 선 · 그림자 없음), 잉크 #1d1d1f · 보조 #6e6e73. 파랑 하나 #0066cc = 지금 단계와 시킬 말. 주황 #c84f00 = 사람만 하는 것(키 · 규칙) 한 가지 뜻에만. 서체는 Pretendard 하나(SF Pro 계열), 제목 700 · 본문 500, 숫자 tabular.
STORY: 장을 넘기면 위 메뉴 줄에서 지금 단계를 보고, 제목으로 무엇을 하는지 알고, 회색 타일 안 흰 입력칸의 시킬 말을 그대로 친 뒤, 성공 모습 타일과 자기 화면을 맞춰 본다.
FIRST VIEWPORT: 맨 위 88px 제품 하위 메뉴 줄 — 왼쪽 날 이름, 가운데 단계 이름들(지금만 진하게 + 아래 2px 선), 오른쪽 쪽 번호. 그 아래 큰 제목(64px 안팎) · 회색 리드. 본문은 타일 격자: 왼쪽 넓은 단계 타일(① – ④, 누가 · 시킬 말 입력칸), 오른쪽 성공 모습 · 상자 타일. 맨 아래 막히면 한 줄. 구조 그림 장은 큰 타일 하나에 SVG 도식, 흐름선이 단계 순서대로 그려진다.
FORM: 사용자가 지정한 Apple 스타일(표준 방향 · canon). seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## 아직 정할 것

- 시안 2장(1일차 1장 · 2일차 5장)을 본 뒤 틀 확정 → 나머지 18장.
- 글꼴 서브셋(지금 시안은 Pretendard 전체 2MB) · 허브 DESIGN.md를 덱에 맞출지.
