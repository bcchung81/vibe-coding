---
name: 바이브코딩 중급 운영 허브
description: 발표자료와 한 벌. 네이비 구조 · 오커 강조 하나 · Pretendard로, 수업 화면에서 본 모양 그대로 교육 안내 · 자료 · 웹앱 주제를 여는 교육 운영 허브
colors:
  accent: "#8a5617"
  accent-bar: "#a56921"
  accent-soft: "#fbf1e3"
  nav: "#193957"
  nav-mark: "#f0c38a"
  on-nav: "#c9d8e5"
  red: "#b3261e"
  bg: "#e8edf1"
  paper: "#ffffff"
  soft: "#edf3f7"
  line: "#ccd6de"
  ink: "#193957"
  ink-2: "#2d5574"
  text: "#202f3d"
  muted: "#536675"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "clamp(30px, 3.4vw, 46px)"
    fontWeight: 800
    lineHeight: 1.22
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  lead:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.65
  label:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.65
  meta:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  base: "8px"
  sm: "6px"
  full: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  gutter: "clamp(18px, 3vw, 36px)"
components:
  top-bar:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    padding: "0 clamp(18px, 3vw, 36px)"
    height: "72px"
  kicker:
    backgroundColor: "#fffaf3"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "1px 12px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "0 18px"
    height: "46px"
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "0 14px"
    height: "42px"
  button-ghost-hover:
    backgroundColor: "{colors.soft}"
  button-ghost-done:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-danger:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "0 16px"
    height: "44px"
  tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "0 20px"
    height: "44px"
  tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  status-todo:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: "2px 9px"
    height: "29px"
  status-done:
    backgroundColor: "{colors.soft}"
  status-next:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.base}"
    padding: "26px clamp(18px, 3vw, 28px)"
  topic-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.base}"
    padding: "20px 16px"
  topic-card-mine:
    backgroundColor: "{colors.soft}"
  input-text:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "0 12px"
    height: "46px"
---

# Design System: 바이브코딩 중급 운영 허브

## Overview

**Creative North Star: "발표자료와 한 벌 (The Report Deck)"**

허브는 수업 때 프로젝터에 띄우는 발표자료(`docs/발표자료/발표.html` · `slides.css`)와 같은 옷을 입는다. 수강생이 슬라이드에서 본 네이비 띠 · 오커 꼬리표 · 문장 제목을 허브에서도 그대로 만나서, "지금 보는 화면이 수업의 어디인지"를 따로 배우지 않는다 (2026-11-06, 라벤더 · 자두색 갤러리 우선 방향에서 바꿨다).

첫 화면(`/`)은 교육 전까지 교육 안내(`/course`)로 넘긴다. 교육 전 할 일은 교육 안내(`/course`) 한 곳에 모은다. 화면마다 맨 위 제목 머리가 이 화면이 무엇을 위한 곳인지 말하고, 오른쪽 오커 버튼 하나가 다음 행동을 맡는다.

재료는 청회색 책상(`bg`), 그 위 흰 종이 패널(1px 선), 네이비 잉크와 상단 띠, 그리고 오커 강조 하나다. 모서리는 8px(작은 칩 6px), 그림자는 없다. 위계는 한 서체(Pretendard)의 크기와 굵기, 네이비 제목 · 본문 잉크 · 흐린 잉크의 세 단계로 만든다. 상태는 색만이 아니라 글자(완료 · 다음 · 아직)와 선 모양(실선 · 점선 · 채움)으로 읽힌다. 기준 환경은 노트북, 휴대폰은 보조다.

움직임은 PRODUCT.md의 "누르면 바로 보인다"를 맡는다. 제목이 바뀌면 살짝 내려앉고, 주제를 고르면 체크 표시가 튄다. 동작 줄이기 설정에서는 이동이 빠지고 짧은 페이드만 남는다.

**Key Characteristics:**
- 발표자료의 슬라이드 머리를 그대로: 오커 꼬리표(화면 이름) → 네이비 문장 제목 → 오커 막대가 붙은 리드 → 1px 가는 선
- 72px 네이비 상단 띠, 현재 위치는 밝은 오커 3px 밑줄
- 네이비 = 구조와 고른 것, 오커 = 지금 위치와 다음 할 일
- 흰 종이 패널에 1px 선, 8px 모서리, 그림자 없음
- 표는 위 2px 네이비 선과 옅은 머리 칸 (발표자료의 말하기 표)
- 첫 화면은 교육 안내

## Colors

청회색 책상 위 흰 종이, 네이비 잉크와 띠, 오커 강조 하나. 발표자료 `slides.css` 의 값을 그대로 가져왔다.

### Primary
- **오커 (Ochre)** (`accent` #8a5617): 지금 · 다음 전용. 주 버튼, "다음" 상태 칩, focus 테두리, 입력칸 focus 테두리, 문서 목차의 현재 항목과 점, 통과 힌트, 꼬리표 글자. 흰 글자와 6.1:1.
- **오커 막대 (Ochre Bar)** (`accent-bar` #a56921): 발표자료 원래 오커. 글자가 아닌 선 · 막대에만 — 리드 왼쪽 4px 막대, 꼬리표 테두리, 읽기 진행 막대, 인용 왼쪽 선. 책상 위 3.8:1이라 글자에 쓰지 않는다.
- **연한 오커 (Ochre Soft)** (`accent-soft`): 인용 바탕.

### Secondary
- **네이비 (Navy)** (`ink` · `nav` #193957): 상단 띠, 제목 글자, 표 위 2px 선, 그리고 "고른 것"의 채움 — 선택된 탭, 누른 고르기, 체크한 선택지의 표시 칸, 끝난 동작(복사함) 반전, 고른 주제 카드의 2px 테두리.
- **둘째 네이비 (Navy 2)** (`ink-2` #2d5574): 스크롤 막대.
- **밝은 오커 (Light Ochre)** (`nav-mark` #f0c38a): 네이비 위에서만. 현재 메뉴 3px 밑줄, 띠 안 focus 테두리. 네이비 위 7.3:1.
- **띠 위 흐린 글자 (On Navy)** (`on-nav` #c9d8e5): 띠 안 이름 옆 팀명.

### Tertiary
- **오류 빨강 (Error Red)** (`red`): 잘못된 입력칸 테두리, 오류 힌트, "모두 지우기" 버튼. 그 밖에는 쓰지 않는다.

### Neutral
- **책상 (Desk)** (`bg` #e8edf1): 페이지 바닥.
- **종이 (Paper)** (`paper`): 패널 · 문서 본문 · 주제 카드 · 입력칸 · 고스트 버튼 바탕, 네이비 · 오커 위 글자.
- **옅은 면 (Pale)** (`soft` #edf3f7): 표 머리 칸, 인라인 코드 · 코드 블록, 버튼 hover, "완료" 칩, 체크한 선택지 · 고른 주제 카드 바탕.
- **선 (Line)** (`line` #ccd6de): 패널 · 버튼 · 입력칸 1px 테두리, 제목 머리 아래 가는 선, 자료 행 · 표 칸 사이 선, 문서 소제목 위 선.
- **본문 잉크 (Text)** (`text` #202f3d): 본문 · 리드 · 입력값.
- **흐린 잉크 (Muted Ink)** (`muted` #536675): 설명 · 보조 줄 · 목차 · 힌트 · placeholder · 표 머리 글자, "아직" 칩과 비활성 버튼의 점선. 책상 · 종이 · 옅은 면 위 모두 5:1 이상.

### Named Rules
**The Navy-Chosen, Ochre-Next Rule.** 네이비는 구조와 "이미 고른 것", 오커는 "지금 위치와 다음 할 일"이다. 오커 면은 주 버튼, "다음" 칩뿐이고 구역 바탕이나 장식으로 깔지 않는다 (발표자료의 `.cur` · `.now` 와 같은 뜻).

**The Text-Safe Ochre Rule.** 글자 오커는 `accent`(#8a5617)만 쓴다. 발표자료 원래 오커(`accent-bar`)는 막대 · 선 · 차트 막대에만 쓴다.

**The Navy Band Rule.** 밝은 오커(`nav-mark`)와 띠 위 흐린 글자(`on-nav`)는 네이비 면 위에서만 쓴다.

## Typography

**Display Font:** Pretendard Variable (OFL, npm `pretendard` 1.3.9 의 dynamic subset — 화면에 쓰인 한글 구역만 내려받는다)
**Body Font:** Pretendard Variable

**Character:** 발표자료와 같은 서체. 제목은 800에 자간 -0.03em, 리드는 600, 본문은 400에 자간 -0.01em. 숫자는 `tabular-nums`, 한글은 `word-break: keep-all`, 제목은 `text-wrap: balance`.

### Hierarchy
| 역할 | 토큰 | 쓰는 곳 |
|---|---|---|
| Display | `display` | 화면 맨 위 제목 한 줄 하나 (네이비) |
| Headline | `headline` | 패널 · 단계 · 시작 폴더 구역 제목 (네이비) |
| Title | `title` | 주제 카드 이름 (네이비) |
| Lead | `lead` | 제목 아래 오커 막대가 붙은 한 줄 |
| Body | `body` | 본문 · 입력값 · 주 버튼(700) · 상단 띠 메뉴(700). 문서 본문은 줄 간격 1.75 |
| Label | `label` | 꼬리표, 고스트 · 고르기 버튼, 입력 레이블, 표, 목차 |
| Meta | `meta` | 상태 칩, 힌트, 표 머리 |

상단 띠 과정명은 20px/900. 자료 단계 번호는 30px/800 네이비(발표자료의 단계 숫자).

### Named Rules
**The One Family Rule.** 허브 UI는 Pretendard 하나만 쓴다. 굵기는 400 · 600(리드) · 700 · 800(제목) · 900(과정명)만. 새 화면은 위 단계 안에서 크기를 고른다. 예외: 지도 시연의 바탕지도 이름표는 타일 글꼴(Noto Sans)이다 — 지도 안 글자만.

## Layout

- **뼈대:** 72px 네이비 상단 띠 → 제목 머리(위 36px, 아래 1px 가는 선) → 콘텐츠. 콘텐츠는 왼쪽 정렬, 최대 폭 1440px, 좌우 `gutter`, 아래 64px, 구역 사이 24px.
- **제목 머리:** 꼬리표(있으면) → 제목 → 리드(최대 72ch, 왼쪽 4px 오커 막대), 오른쪽 주 버튼, 아래쪽 정렬. 좁으면 버튼이 아래로 내려간다. 꼬리표는 제목이 상태 문장일 때 화면 이름을 붙인다 — 웹앱 주제(03) · 자료 · 관리. 제목이 곧 화면 이름이면(교육 안내 · 교육 자료) 꼬리표를 붙이지 않는다.
- **첫 화면 (`/`):** `/course` 로 넘긴다(`next.config.ts`).
- **자료 (`/materials`):** 단계 패널. 자료 행은 `84px | 1fr | auto` (상태 칩 · 제목과 파일명 · 버튼), 위 1px 선, 위아래 16px.
- **웹앱 주제:** 주제 카드 4열(간격 20px), 1180px 이하 3열, 940px 이하 2열, 760px 이하 1열. 아래 시작 폴더 패널은 세 단계를 `2fr 1fr 1fr` 로 나란히, 1000px 이하 세로로.
- **지도 시연 (`/topics/map`):** 07 카드 데이터. 이 화면만 제목 머리 · 콘텐츠의 최대 폭을 풀어 화면 전체 폭(좌우 `gutter`)을 쓴다. 주소 입력줄(오커 주 버튼 '찾기') 아래 지도 종이 패널 `1fr`(높이 화면 높이 − 160px, 480 ~ 1000px) + 가까운 순 목록 400px, 1000px 이하 세로. 지도는 MapLibre + OpenFreeMap positron(키 없음)을 55° 기울이고 −20° 돌린 3D, 이름표는 한글 우선. 무선국은 8각 기둥 — **색 = 통신사**, **높이 = 노출지수 4구간**(12 · 30 · 60 · 100m, 측정값 없음 6m, 범례와 같은 표 `LEVELS`). 통신사 색은 통신사에 고정(건수 · 순위와 무관): SKT `--carrier-1` #2a78d6 · KT `--carrier-2` #eb6834 · LGU+ `--carrier-3` #1baf7a, 그 밖은 '기타'로 접어 `--muted`. 점은 어느 둘이든 붙을 수 있어 모든 쌍 색각 검사를 통과하는 세 색까지만 쓴다(dataviz 검증기: 색각 ΔE 9.2 · 일반 24.0). 바탕 대비가 3:1 아래라 통신사 이름을 탭 · 목록 글자로 함께 보인다. 범례는 두 줄 — 색 = 통신사, 높이 = 기준 대비 세기(작은 막대). 탭 · 목록 줄 앞에도 같은 색 점. 와이파이(KCA 지역별 와이파이 정보, `lib/wifi.bin`)는 같은 반경의 **바닥에 눕힌 점** — 모양으로 무선국 기둥과 구분하고, 색은 같은 통신사 색(공공은 `--muted`, 범례 '기타 · 공공'). 범례 셋째 줄에 개수 · 사업자별 수와 '와이파이 보기' 켜기 단추(눌림 = 네이비 반전). 건물은 같은 타일에서 옅은 선 색 반투명(0.45)으로 세워 뒤의 기둥이 비친다. 오커는 '지금' — 찾은 주소 점 · 반경 300m 선(`accent-bar`). 네이비는 '고른 것' — 고른 기둥을 감싸는 네이비 기둥 · 가리킨 기둥 · 목록 줄 2px 테두리. **불러오기 패널**: 조회하는 동안 지도 왼쪽 위 종이 패널(1px 선, 그림자 없음)에 호출마다 한 줄 — 지도 바탕(tiles.openfreemap.org) · 전자파 노출지수(KCA API) · 와이파이 위치(`/api/wifi`). 줄마다 상태 칩(호출 중 = 오커 채움, 완료 = 실선, 대기 · 대체 · 없음 · 건너뜀 = 점선, 실패만 빨강) · 부르는 곳 · 경과 초나 결과(359곳 · 5.1초). 호출 중인 줄 아래 2px 오커 훑는 선(동작 줄이기면 멈춘 선). 모두 끝나면 1.2초 뒤 사라진다. 팝업 없이 목록 ↔ 지도가 서로 강조하고, 지도에서 고르면 목록 칸 안에서만 민다. 지도 컨트롤도 그림자 없이 1px 선.
- **교육 안내·자료:** 넓은 화면에서 일정 정보와 준비 목록을 나란히 둔다(1000px 이하 세로). 자료 화면은 최대 1200px로 모은다. 준비 완료 막대는 상태가 바뀔 때 400ms로 채우고, 동작 줄이기 설정에서는 즉시 반영한다.
- **문서 보기:** 왼쪽 220px 고정 목차 + 본문 종이, 간격 32px. 소제목 위 1px 선. 1000px 이하 목차를 숨긴다.
- **두 열 작업:** `repeat(auto-fit, minmax(min(340px, 100%), 1fr))`, 간격 24px (관리).
- **간격 리듬:** 8 / 16 / 24 / 32px.
- **휴대폰 (≤760px):** 상단 띠 메뉴가 둘째 줄 전체 폭 칸(48px)으로 내려간다. 자료 행은 버튼이 제목 아래로.

## Elevation & Depth

그림자는 없다. 깊이는 면과 선으로 만든다: 청회색 책상 → 1px 선을 두른 흰 종이(패널 · 문서 · 주제 카드) → 옅은 면(표 머리 · 고른 것).

### Named Rules
**The Flat Sheet Rule.** 허브 UI에 그림자를 넣지 않는다. 떠 보여야 할 것은 면 색 단계와 1px 선으로 구분한다.

## Shapes

모서리는 8px(`rounded.base`): 버튼 · 입력 · 패널 · 문서 · 주제 카드 · 코드 블록. 작은 칩은 6px(`rounded.sm`): 꼬리표 · 상태 칩 · 체크 칸. 원(`rounded.full`)은 작은 상태 표시에만 — 목차 현재 점 8px, 라디오 표시. 선은 1px(`line`)이 기본이고, 표 위 · 제출 줄 위와 고른 주제 카드만 2px 네이비. 점선은 "아직 · 비어 있음 · 비활성"의 모양이다. 픽토그램은 24 그리드, `stroke-width: 2.6`, `stroke-linecap: square`의 SVG로 버튼 글자 옆에 둔다.

## Components

### Page head
- **Kicker (`kicker`):** 1.5px 오커 막대색 테두리, 따뜻한 흰 바탕(#fffaf3), 오커 14px/700, 6px 모서리. 화면 이름 하나.
- **Title:** `display`, 네이비 800.
- **Lead:** 600, 본문 잉크, 왼쪽 4px 오커 막대(위아래 4px 띄움).
- **Rule:** 제목 머리 아래 전체 폭 1px 선.

### Buttons
- **Primary (`button-primary`):** 오커 채움 흰 글자 16px/700, 46px, 화살표 · 내려받기 픽토그램. 화면당 하나, 제목 머리 오른쪽. hover는 `brightness(1.12)`. 폼 안에서는 왼쪽 정렬.
- **Ghost (`button-ghost`):** 종이 바탕 1px 선 테두리 42px, 네이비 글자. hover는 옅은 면 + 네이비 테두리, 끝난 동작(복사함)은 네이비 반전.
- **Pick (주제 고르기):** 고스트와 같은 모양, 누르면 네이비 반전 + 하트 튐.
- **Text button:** 테두리 없는 밑줄 14px/700. 작은 되돌리기.
- **Danger (`button-danger`):** 빨강 채움 흰 글자 44px. "삭제"를 직접 입력해야 켜진다.
- **Disabled:** 투명 바탕, 흐린 잉크, 점선 테두리, `not-allowed`. 주 · 삭제 버튼 같은 모양.
- **Focus:** `outline: 3px solid` 오커, offset 3px. 상단 띠 안에서는 밝은 오커. 입력칸은 offset 0 + 오커 테두리.

### Chips
| 상태 | 자료 행 상태 칩 |
|---|---|
| 완료 · 고름 | 옅은 면 + 1px 선 실선 (`status-done`) |
| 다음 · 지금 | 오커 채움 흰 글자 700 (`status-next`) |
| 아직 | 투명 + 1px 흐린 점선 (`status-todo`) |

**The Say-It Rule.** 상태는 색을 빼도 읽혀야 한다. 칩에는 항상 낱말(완료 · 다음 · 아직 · 고름)을 쓰고, 채움 · 실선 · 점선으로 모양도 다르게 한다.

### Cards / Containers
- **Panel (`panel`):** 종이, 1px 선, 8px, 안 간격 16px.
- **Topic card (`topic-card`):** 종이 1px 선, 최소 250px, 위 번호와 데이터 출처, 이름(`title`), 설명, 아래 고르기 · 보기 버튼. 고른 카드는 2px 네이비 테두리 + 옅은 면.
- **Table:** 위 2px 네이비 선, 머리 칸은 옅은 면 · 흐린 잉크 13px, 칸 사이 1px 선. 문서 안 표도 같다.

### Inputs / Fields
- **Style:** 종이, 1px 선, 46px, 8px. 레이블 위 14px/700, 힌트 아래 13px.
- **Choice:** 1px 선 48px 칸. hover · 체크는 네이비 테두리 + 옅은 면, 체크 표시 칸은 네이비 채움.
- **Error:** 빨강 테두리 + 빨강 700 힌트. 통과는 오커 700 힌트.
- **PIN:** 56×64px 칸, 28px/800 네이비 숫자, 비어 있으면 점선.
- **Name picker:** 1px 선 44px 칸 격자, hover에서 네이비 테두리 + 옅은 면.

### Navigation
- **Top bar (`top-bar`):** 72px 네이비. 왼쪽 흰 과정명 20px/900, 메뉴 순서 교육 안내 · 자료 · 웹앱 주제 · 발표(덱 페이지로) · 관리(관리자) (16px/700 흰 글자), 현재 메뉴만 3px 밝은 오커 밑줄. 관리자일 때만 오른쪽 반투명 흰 테두리 '관리자 로그아웃'. 휴대폰에서 메뉴는 둘째 줄.
- **Sort tabs (`tab`):** 4px 띄운 분리 버튼 44px, 선택은 네이비 채움.
- **Table of contents:** 14px 흐린 글자, 현재 항목은 오커 700 + 앞 8px 오커 점. 문서 위 3px 오커 막대색 읽기 진행 막대.

### Motion
움직임은 "방금 바뀌었다"는 설명에만 쓴다. 기본 곡선 `cubic-bezier(0.16, 1, 0.3, 1)`.

| 움직임 | 어디 | 값 |
|---|---|---|
| 제목 페이드 | 첫 그리기 뒤 제목 · 리드가 바뀌면 6px 위에서 내려앉으며 나타남 | 360ms |
| 체크 튐 | 주제 고르기를 누르면 체크 표시 1.25배 | 260ms |
| 읽기 진행 | 문서 위 3px 오커 막대 | 80ms linear |
| 상태 전환 | 버튼 · 탭 hover 150ms, 메뉴 밑줄 · 목차 점 200ms, 칩 · 주제 카드 220ms | — |

**The Changed-Just-Now Rule.** 움직임은 할 일 · 숫자 · 순서 · 진행이 바뀐 순간에만 돈다. 들어올 때 장식으로 움직이는 요소는 없다. `prefers-reduced-motion`에서는 제목 160ms linear 페이드만 남고, 체크 · 칩 전환 · 진행 막대 전환은 돌지 않는다.

## Do's and Don'ts

### Do:
- **Do** 새 색 · 모양은 발표자료 `slides.css` 에서 먼저 찾아 같은 값을 쓴다.
- **Do** 화면마다 제목 머리(꼬리표 · 문장 제목 · 오커 막대 리드)와 오커 주 버튼 하나를 둔다.
- **Do** 고른 것은 네이비, 지금 · 다음은 오커로 칠한다.
- **Do** 상태 칩에 낱말을 쓰고 실선 · 점선 · 채움으로도 구분한다.
- **Do** 새 움직임은 상태 변화에만 붙이고 reduced-motion 대안을 함께 둔다.
- **Do** 예시 데이터에는 "예시" · "예시 화면" 표시를 화면 안에 남긴다 (휴대폰 포함).

### Don't:
- **Don't** 오커를 구역 바탕이나 장식으로 깔지 않는다. 오커 막대색(#a56921)을 글자에 쓰지 않는다.
- **Don't** 빨강을 오류 · 되돌릴 수 없는 삭제 밖에서 쓰지 않는다.
- **Don't** 패널 · 카드에 그림자를 넣지 않는다.
- **Don't** 꼬리표를 한 화면에 둘 이상 두거나 장식 문구로 쓰지 않는다. 화면 이름 하나만.
- **Don't** Pretendard 밖의 서체를 허브 UI에 쓰지 않는다.

`docs/교육생_배포/vibe/` 는 수강생이 내려받는 시작 프로젝트(별도 Next.js 뼈대)로, 이 디자인 시스템 밖이다. 여기 규칙을 거기에 적용하지 않는다.
