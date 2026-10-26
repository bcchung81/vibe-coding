---
name: 바이브코딩 중급 운영 허브
description: 갤러리 우선. 수강생 사이트의 첫 화면이 벽을 채우고, 준비 자료는 그 위 서랍으로 물러서는 교육 운영 허브
colors:
  accent: "#633b86"
  nav: "#342443"
  nav-mark: "#dcc5ed"
  red: "#b3261e"
  bg: "#eeeaf5"
  paper: "#ffffff"
  soft: "#e5dcef"
  line: "#cbbfd8"
  ink: "#30233e"
  muted: "#65566f"
typography:
  display:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "clamp(30px, 3.4vw, 46px)"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "21px"
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
    fontFeature: "tnum"
  label:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.65
  meta:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  base: "4px"
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
    backgroundColor: "{colors.accent}"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  like-toggle:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "0 12px"
    height: "42px"
  like-toggle-pressed:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  status-todo:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.base}"
    padding: "2px 9px"
    height: "29px"
  status-done:
    backgroundColor: "{colors.soft}"
  status-next:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  now-card:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "30px 32px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.base}"
    padding: "26px clamp(18px, 3vw, 28px)"
  drawer:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "18px 24px"
  gallery-shot:
    backgroundColor: "{colors.soft}"
    rounded: "{rounded.base}"
  rank-chip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    padding: "3px 8px"
  topic-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.base}"
    padding: "20px 16px"
  topic-card-mine:
    backgroundColor: "{colors.soft}"
  input-text:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "0 12px"
    height: "46px"
---

# Design System: 바이브코딩 중급 운영 허브

## Overview

**Creative North Star: "갤러리 우선 (The Gallery Wall)"**

허브의 첫 화면은 전시 벽이다. 연보라 바닥 위에 수강생 사이트의 첫 화면 캡처가 세 줄로 크게 걸리고, 카드 자체는 테두리도 바탕도 없이 캡처 아래 글 몇 줄로 물러선다. 준비 자료와 웹앱 주제는 벽 위의 접힌 서랍 하나에 들어가고, 접힌 상태에서도 요약 줄이 "다음: ○○" 하나를 말한다. 화면마다 맨 위 큰 제목 한 줄이 이 화면이 무엇을 위한 곳인지 말하고, 오른쪽 보라 버튼 하나가 다음 행동을 맡는다.

재료는 연보라 바닥, 흰 종이, 짙은 자두색 상단 막대, 그리고 보라 강조 하나다. 모서리는 4px로 살짝 무르고, 그림자는 없다. 위계는 한 서체(Noto Sans KR)의 크기와 400 / 700 / 900 굵기, 그리고 바닥 · 종이 · 연보라 면의 단계로 만든다. 상태는 색만이 아니라 글자(완료 · 다음 · 아직)와 선 모양(실선 · 점선 · 채움)으로 읽힌다. 기준 환경은 노트북, 휴대폰은 보조다.

움직임은 PRODUCT.md의 "누르면 바로 보인다"를 맡는다. 제목이 바뀌면 살짝 내려앉고, 좋아요를 누르면 하트가 튀고 숫자가 올라가며 카드가 새 순위 자리로 미끄러진다. 동작 줄이기 설정에서는 이동이 빠지고 짧은 페이드만 남는다.

**Key Characteristics:**
- 갤러리가 첫 화면: 3열 벽, 16:10 큰 첫 화면 캡처, 카드는 캡처 + 글뿐
- 준비는 벽 위 접히는 서랍 하나, 요약 줄에 다음 할 일 하나
- 화면마다 큰 제목 한 줄과 보라 주 버튼 하나
- 72px 자두색 상단 막대, 현재 위치는 연보라 3px 밑줄
- 보라 하나가 "누름 · 선택 · 다음 · 지금"을 맡는다
- 4px 모서리, 그림자 없음, 1px 선
- 상태는 완료 · 다음 · 아직 글자 칩과 실선 · 점선 · 채움으로

## Colors

연보라 바닥과 흰 종이 위에 자두색 막대와 보라 강조 하나. 모든 중립색이 같은 보라 기운을 띤다.

### Primary
- **자두 보라 (Plum Accent)** (`accent`): 행동과 현재 상태 전용. 주 버튼, 선택된 정렬 탭, 누른 좋아요 · 고른 주제 버튼, "다음" 상태 칩, 추천 1·2·3 칩, 끝난 동작(복사함) 반전, focus 테두리, 텍스트 선택색, 문서 목차의 현재 항목과 점, 읽기 진행 막대, 인용 왼쪽 선, 단계 번호, 통과 힌트, 서랍 펼침 표시, 고른 주제 카드의 2px 테두리.

### Secondary
- **밤 자두 (Night Plum)** (`nav`): 상단 막대 바탕, 캡처 중 칸의 바탕.
- **연보라 표시 (Pale Mark)** (`nav-mark`): 자두색 면 위에서만. 현재 메뉴 3px 밑줄, 로그인 칸의 현재 테두리, 막대 안 focus 테두리, 캡처 중 훑는 선.

### Tertiary
- **오류 빨강 (Error Red)** (`red`): 잘못된 입력칸 테두리, 오류 힌트, 명단의 중복 이름, "모두 삭제" 버튼. 그 밖에는 쓰지 않는다.

### Neutral
- **연보라 바닥 (Lavender Ground)** (`bg`): 페이지 바닥, 펼친 서랍 안쪽, 코드 블록 바탕.
- **종이 (Paper)** (`paper`): 패널 · 서랍 · 문서 본문 · 주제 카드 · 입력칸 · 고스트 버튼 바탕, 보라 · 자두 위 글자.
- **연보라 면 (Soft Lilac)** (`soft`): "지금 할 일" 카드, 캡처 칸의 빈 바탕, 버튼 hover, "완료" 칩, 고른 주제 카드, 표 머리 · 인라인 코드 · 인용 바탕.
- **선 (Line)** (`line`): 1px 테두리와 구분선. 고스트 · 탭 · 좋아요 · 입력칸 테두리, 자료 행 사이 선, 서랍 테두리, 표 칸 선. 장식이 아니라 경계를 보여 주는 선이다.
- **잉크 (Ink)** (`ink`): 본문과 제목 글자, 관리 표 머리 아래 2px 선.
- **흐린 잉크 (Muted Ink)** (`muted`): 설명 · 보조 줄 · 카드 주소 · 목차 · 힌트 · placeholder, "아직" 칩과 빈 캡처 칸 · 비활성 버튼의 점선. 바닥 · 종이 · 연보라 면 위 모두 4.5:1 이상.

### Named Rules
**The One Plum Rule.** 보라는 "누른 것 · 고른 것 · 다음 것 · 지금 위치"에만 쓴다. 보라 면은 주 버튼, 눌린 버튼 · 탭, "다음" 칩, 추천 칩뿐이고 구역 바탕이나 장식으로 깔지 않는다.

**The Plum Bar Rule.** 연보라 표시(`nav-mark`)는 자두색 막대 · 캡처 중 칸 위에서만 쓴다. 밝은 면 위의 현재 표시는 보라(`accent`)다.

## Typography

**Display Font:** Noto Sans KR (with sans-serif)
**Body Font:** Noto Sans KR (with sans-serif)

**Character:** 한 서체, 세 굵기(400 / 700 / 900). 큰 제목 한 줄이 화면의 목적을 말하고, 나머지는 굵기로 정리한다. 숫자는 `tabular-nums`, 한글은 `word-break: keep-all`, 제목은 `text-wrap: balance`.

### Hierarchy
| 역할 | 토큰 | 쓰는 곳 |
|---|---|---|
| Display | `display` | 화면 맨 위 제목 한 줄 하나 |
| Headline | `headline` | 패널 · 단계 · 시작 폴더 구역 제목 |
| Title | `title` | 갤러리 카드 앱 이름, 주제 카드 이름 |
| Body | `body` | 본문 · 입력값 · 주 버튼(700) · 상단 막대 메뉴(700). 문서 본문은 줄 간격 1.75 |
| Label | `label` | 고스트 · 좋아요 · 고르기 버튼, 입력 레이블, 표, 목차, 카드 아래 이름 · 팀 |
| Meta | `meta` | 상태 칩, 힌트, 카드 주소, 예시 안내 줄, 관리 칩 |

상단 막대 과정명은 20px/900. 갤러리 카드의 첫 화면은 서버가 찍은 수강생 사이트 이미지(`.shot-img`)라 그 안의 글자 · 색은 UI 단계가 아니다.

### Named Rules
**The One Family Rule.** 허브 UI는 Noto Sans KR 하나, 400 / 700 / 900만 쓴다. 새 화면은 위 여섯 단계 안에서 크기를 고른다.

## Layout

- **뼈대:** 72px 자두색 상단 막대 → 큰 제목 줄(위 36px) → 콘텐츠. 콘텐츠는 왼쪽 정렬, 최대 폭 1440px, 좌우 `gutter`, 아래 64px, 구역 사이 24px.
- **제목 줄:** 왼쪽 제목과 보조 한 줄(최대 72ch), 오른쪽 주 버튼, 아래쪽 정렬. 좁으면 버튼이 아래로 내려간다.
- **홈 (`/`):** 접힌 준비 서랍 → 정렬 탭과 개수 줄 → 갤러리 벽. 벽은 3열(간격 32px 30px), 1100px 이하 2열, 640px 이하 1열. `/gallery` 는 `/` 로 넘긴다.
- **자료 (`/materials`):** "지금 할 일" 카드 하나 → 단계 패널. 자료 행은 `84px | 1fr | auto` (상태 칩 · 제목과 파일명 · 버튼), 위 1px 선, 위아래 16px.
- **웹앱 주제:** 주제 카드 5열(간격 14px), 1180px 이하 3열, 760px 이하 1열. 아래 시작 폴더 패널은 세 단계를 `2fr 1fr 1fr` 로 나란히, 1000px 이하 세로로.
- **문서 보기:** 왼쪽 220px 고정 목차 + 본문, 간격 32px. 1000px 이하 목차를 숨긴다.
- **두 열 작업:** `repeat(auto-fit, minmax(min(340px, 100%), 1fr))`, 간격 24px (내 프로젝트 · 관리).
- **간격 리듬:** 8 / 16 / 24 / 32px.
- **휴대폰 (≤760px):** 상단 막대 메뉴가 둘째 줄 전체 폭 4칸(48px)으로 내려간다. 자료 행은 버튼이 제목 아래로.

**The Wall First Rule.** 홈에서 갤러리 벽 위에 놓이는 것은 제목 줄과 접힌 서랍 하나뿐이다. 준비 내용은 펼치기 전에는 한 줄이다.

## Elevation & Depth

그림자는 없다. 깊이는 면의 단계로 만든다: 연보라 바닥 → 흰 종이(패널 · 서랍 · 주제 카드) → 연보라 면("지금 할 일" · 고른 주제). 갤러리 카드는 종이조차 없이 캡처가 바닥 위에 바로 놓인다. 펼친 서랍 안쪽은 다시 바닥색이라 "한 단계 안"으로 읽힌다.

### Named Rules
**The Flat Wall Rule.** 허브 UI에 그림자를 넣지 않는다. 떠 보여야 할 것은 면 색 단계와 1px 선으로 구분한다.

## Shapes

모서리는 4px(`rounded.base`) 하나로 통일한다: 버튼 · 칩 · 입력 · 패널 · 서랍 · 캡처 칸 · 주제 카드. 원(`rounded.full`)은 작은 상태 표시에만 쓴다 — 로그인 단계 28px 칸, 목차 현재 점 8px. 선은 1px(`line`)이 기본이고, 고른 주제 카드와 "지금" 단계 칸만 2px 보라. 점선은 "아직 · 비어 있음 · 비활성"의 모양이다. 픽토그램은 24 그리드, `stroke-width: 2.6`, `stroke-linecap: square`의 SVG로 버튼 글자 옆에 둔다.

## Components

### Buttons
- **Primary (`button-primary`):** 보라 채움 흰 글자 16px/700, 46px, 화살표 · 내려받기 픽토그램. 화면당 하나, 제목 줄 오른쪽. hover는 `brightness(1.12)`. 폼 안에서는 왼쪽 정렬.
- **Ghost (`button-ghost`):** 종이 바탕 1px 선 테두리 42px. hover는 연보라 면 + 보라 테두리, 끝난 동작(복사함)은 보라 반전. "지금 할 일" 카드 안에서는 16px · 46px로 커지고 테두리를 숨긴다.
- **Pick (주제 고르기):** 고스트와 같은 모양, 누르면 보라 반전 + 하트 튐.
- **Text button:** 테두리 없는 밑줄 14px/700. 작은 되돌리기.
- **Danger (`button-danger`):** 빨강 채움 흰 글자 44px. "삭제"를 직접 입력해야 켜진다.
- **Disabled:** 투명 바탕, 흐린 잉크, 점선 테두리, `not-allowed`. 주 · 좋아요 · 삭제 버튼 같은 모양.
- **Focus:** `outline: 3px solid` 보라, offset 3px. 상단 막대 안에서는 연보라 표시. 입력칸은 offset 0 + 보라 테두리.

### Chips
| 상태 | 자료 행 상태 칩 | 관리 칩 | 로그인 단계 칸 |
|---|---|---|---|
| 완료 · 고름 · 올림 | 연보라 면 + 1px 선 실선 (`status-done`) | 연보라 면 (`chip.done`) | 보라 채움 + 체크 |
| 다음 · 지금 | 보라 채움 흰 글자 700 (`status-next`) | — | 연보라 면 + 2px 보라 |
| 아직 | 투명 + 1px 흐린 점선 (`status-todo`) | 종이 + 안쪽 1px 점선 | 종이 + 점선, 흐린 글자 |
| 추천 순위 | — | 보라 채움 "추천 1·2·3" (`rank-chip`), 앱 이름 앞 | — |

**The Say-It Rule.** 상태는 색을 빼도 읽혀야 한다. 칩에는 항상 낱말(완료 · 다음 · 아직 · 고름)을 쓰고, 채움 · 실선 · 점선으로 모양도 다르게 한다.

### Cards / Containers
- **Gallery card (서명):** 위 16:10 캡처 칸(4px, 빈 바탕은 연보라 면), 아래 16px 띄워 추천 칩 + 앱 이름(`title`), 한 줄 소개(흐린 잉크), 주소(`meta`), 이름 · 팀과 좋아요 버튼. 카드에 바탕 · 테두리는 없다. 캡처 hover 1.03배. 찍는 중이면 자두색 칸 + 흰 글 + 훑는 선, 주소가 없으면 종이 위 흐린 점선 칸. 예시 캡처에는 "예시 화면"을 늘 표시한다.
- **Like toggle (`like-toggle`):** 종이 1px 선 42px, 하트 + 숫자. 누르면 보라 반전 + 채운 하트. 내 카드이거나 누를 수 없을 때는 점선 비활성.
- **Panel (`panel`):** 종이, 4px, 안 간격 16px.
- **Drawer (`drawer`):** 종이 + 1px 선. 요약 줄은 700 굵기 한 줄 + "다음: ○○" 흐린 글자, 보라 펼침 표시. 펼치면 선 아래 바닥색 안쪽(24px)에 "지금 할 일"과 단계 패널.
- **Now card (`now-card`):** 연보라 면, 할 일 제목(30px/900, 휴대폰 24px)과 보조 줄, 오른쪽 큰 고스트 버튼 하나. 화면에 하나.
- **Topic card (`topic-card`):** 종이 1px 선, 최소 250px, 위 번호와 데이터 출처, 이름(`title`), 설명, 아래 고르기 · 보기 버튼. 고른 카드는 2px 보라 테두리 + 연보라 면.

### Inputs / Fields
- **Style:** 종이, 1px 선, 46px, 4px. 레이블 위 14px/700, 힌트 아래 13px.
- **Error:** 빨강 테두리 + 빨강 700 힌트. 통과는 보라 700 힌트.
- **PIN:** 56×64px 칸, 28px/900 숫자, 비어 있으면 점선.
- **Name picker:** 1px 선 44px 칸 격자, hover에서 보라 테두리 + 연보라 면.

### Navigation
- **Top bar (`top-bar`):** 72px 자두색. 왼쪽 흰 과정명 20px/900, 메뉴 순서 갤러리 · 자료 · 웹앱 주제 · 내 프로젝트(16px/700 흰 글자), 현재 메뉴만 3px 연보라 밑줄. 오른쪽 "관리"와 반투명 흰 테두리 로그인 칸. 휴대폰에서 메뉴는 둘째 줄 4칸.
- **Sort tabs (`tab`):** 4px 띄운 분리 버튼 44px, 선택은 보라 채움.
- **Table of contents:** 14px 흐린 글자, 현재 항목은 보라 700 + 앞 8px 보라 점. 문서 위 3px 보라 읽기 진행 막대.

### Motion
움직임은 "방금 바뀌었다"는 설명에만 쓴다. 기본 곡선 `cubic-bezier(0.16, 1, 0.3, 1)`.

| 움직임 | 어디 | 값 |
|---|---|---|
| 제목 페이드 | 첫 그리기 뒤 제목 · 보조 줄이 바뀌면 6px 위에서 내려앉으며 나타남 | 360ms |
| 순위 이동 | 정렬 · 좋아요 뒤 카드가 새 자리로 (View Transitions, 카드마다 이름) | 380ms |
| 숫자 올림 | 좋아요 숫자가 아래에서 올라옴 (첫 그리기 제외) | 280ms |
| 하트 튐 | 좋아요 · 주제 고르기를 누르면 하트 1.25배 | 260ms |
| 훑는 선 | 캡처 중 칸을 연보라 3px 선이 반복해 내려감 | 1.3s, `cubic-bezier(0.45, 0, 0.55, 1)` |
| 현상 | 캡처 미리보기가 위에서 아래로 드러남 | 640ms |
| 읽기 진행 | 문서 위 3px 보라 막대 | 80ms linear |
| 상태 전환 | 버튼 · 탭 hover 150ms, 메뉴 밑줄 · 목차 점 200ms, 칩 · 주제 카드 220ms, 캡처 확대 300ms | — |

**The Changed-Just-Now Rule.** 움직임은 할 일 · 숫자 · 순서 · 진행이 바뀐 순간에만 돈다. 들어올 때 장식으로 움직이는 요소는 없다. `prefers-reduced-motion`에서는 제목 160ms · 현상 200ms linear 페이드만 남고, 순위 이동 · 숫자 · 하트 · 훑는 선 · 캡처 확대 · 칩 전환 · 진행 막대 전환은 돌지 않는다.

## Do's and Don'ts

### Do:
- **Do** 홈에서는 갤러리 벽을 첫 화면 주인공으로 두고, 준비는 접힌 서랍 한 줄로 둔다.
- **Do** 화면마다 큰 제목 한 줄과 보라 주 버튼 하나를 둔다.
- **Do** 보라는 누름 · 선택 · 다음 · 지금에만 쓴다.
- **Do** 상태 칩에 낱말을 쓰고 실선 · 점선 · 채움으로도 구분한다.
- **Do** 모서리는 4px, 원은 작은 상태 표시에만 쓴다.
- **Do** 새 움직임은 상태 변화에만 붙이고 reduced-motion 대안을 함께 둔다.
- **Do** 예시 데이터에는 "예시" · "예시 화면" 표시를 화면 안에 남긴다 (휴대폰 포함).

### Don't:
- **Don't** 갤러리 카드에 바탕 · 테두리 · 그림자를 둘러 캡처보다 카드가 보이게 하지 않는다.
- **Don't** 보라를 구역 바탕이나 장식 강조로 깔지 않는다.
- **Don't** 빨강을 오류 · 되돌릴 수 없는 삭제 밖에서 쓰지 않는다.
- **Don't** 패널 · 카드에 그림자를 넣지 않는다.
- **Don't** 제목 위에 작은 머리글(kicker · eyebrow)을 얹지 않는다.
- **Don't** Noto Sans KR 밖의 서체나 500 · 600 굵기를 허브 UI에 쓰지 않는다.

`docs/교육생_배포/vibe/` 는 수강생이 내려받는 시작 프로젝트(별도 Next.js 뼈대)로, 이 디자인 시스템 밖이다. 여기 규칙을 거기에 적용하지 않는다.
