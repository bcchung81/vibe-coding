# AGENTS.md

이 저장소(바이브코딩 중급교육 자료 + 교육 운영 허브 웹앱)에서 일하는 에이전트의 공통 규칙. Claude Code는 `CLAUDE.md` 가 이 파일을 불러온다.

## 1. 저장소와 환경

- 사용자는 이 과정의 강사다. 한국어로 짧게 답한다.
- 작업 PC는 macOS · zsh. 한글 폴더명이 많으니 경로는 따옴표로 감싼다.
- **공개 저장소**다 (github.com/bcchung81/vibe-coding). 커밋한 것은 누구나 본다. 임시 파일은 저장소 밖에 둔다.

| 위치 | 내용 | 기준 |
|---|---|---|
| `README.md` (root) · `docs/00_전체목차.md` · `docs/01_1일차_계획.md` · `docs/02_2일차_계획.md` · `docs/03_추천_명령어_스킬.md` · `docs/04_교육운영_웹앱_기획.md` | 과정 안내 · 목차 · 일차별 계획 · 추천 명령/스킬 · 웹앱 기획 | 비개발자용 쉬운 한국어 |
| `docs/교육생_배포/` | 수강생에게 주는 파일 — 웹앱 `/materials` 가 그대로 읽어 보여 준다 (`00_사전안내.md` · `setup.ps1` · `00_환경설정.md` · `AGENTS.global.md` · `00_보고서도구.md`). 번호 없는 `웹앱_주제/` 는 주제 카드 10개로 `/topics` 가 읽고, `vibe/` 는 시작 폴더 원본으로 `/vibe.zip` 이 주제 카드와 함께 묶는다(명령은 `.agents/skills` 에만 쓰면 `.claude/skills` 복사본은 ZIP이 만든다) | **Windows 11 · PowerShell** |
| `package.json` · `tsconfig.json` · `vercel.json` | 교육 운영 허브 웹앱 — Next.js 16.4.2 · React 19.3.1 · TypeScript · vitest 5.0.5 | macOS에서 개발, Vercel 배포 |

- 웹앱 코드: `app/` · `components/` · `lib/` · `db/schema.sql` · `next.config.ts`. 기능과 만드는 순서는 `docs/04_교육운영_웹앱_기획.md` 를 따른다. DB는 Neon Postgres(`lib/db.ts` · `db/schema.sql`), 첫 화면 캡처는 Vercel Blob(`lib/capture.ts`, 한글 폰트 `fonts/`).
- 문서는 `docs/` 아래에 둔다. root에는 `README.md` · `AGENTS.md` · `CLAUDE.md` 와 웹앱 설정 파일만 둔다. 예외: impeccable 디자인 기록 `PRODUCT.md` · `DESIGN.md` 는 도구가 root에서 찾으므로 root에 둔다. 화면 디자인 방향은 `.impeccable/surfaces/` 에 있다.

## 2. 교육생 배포 파일 (`docs/교육생_배포/`)

- 수강생 PC 기준(Windows 11 · PowerShell · `C:\workspace`)을 유지한다. 명령 예시는 PowerShell로 쓴다 (`npm.cmd` · `npx.cmd`).
- `setup.ps1` 은 ASCII만 쓰고 Windows PowerShell 5.1에서 돌아가야 한다. 고친 뒤 `iconv -f ASCII -t ASCII <파일> >/dev/null` 로 ASCII만 확인하고, 실행은 Windows에서 확인해야 한다고 보고한다.
- 파일 이름을 바꾸지 않는다. `setup.ps1` 이 `AGENTS.global.md` · `00_*.md` 를 이름으로 찾는다. 폴더를 옮기면 `lib/materials.ts` 의 `MATERIALS_DIR` 도 고친다.
- `AGENTS.global.md` 는 수강생 전역 규칙이다. 모델 상한 · `npm.cmd` 같은 수강생용 규칙은 거기에만 두고 이 파일과 섞지 않는다.
- `setup.ps1` 이 하는 일을 바꾸면 `00_환경설정.md` 와 `01_1일차_계획.md` 의 설명도 맞춘다.

## 3. 코딩 전에

- 가정은 한 줄로 밝힌다. 해석이 갈리거나 불분명하면 멈추고 묻는다. 질문은 한 번에 2개, 선택지는 3개까지.
- 더 단순한 방법이 있으면 말한다.
- 여러 파일 구조를 바꾸는 일, 설계가 필요한 일, 원인 모르는 오류는 계획을 먼저 보이고 승인받는다.

## 4. 단순하게

- 요청한 것만 만든다. 요청하지 않은 기능 · 설정 · 추상화, 일어날 수 없는 상황의 오류 처리는 넣지 않는다.
- 길게 썼으면 더 짧게 쓸 수 있는지 다시 본다.

## 5. 필요한 곳만 고친다

- 요청과 관계없는 코드 · 문서 · 서식은 건드리지 않는다. 기존 스타일을 따른다.
- 내 변경으로 안 쓰게 된 것만 지운다. 원래 있던 안 쓰는 코드는 알려만 준다.
- 문서는 쉬운 한국어로 짧게, 나열보다 표로 쓴다. 확인한 사실과 가정 · 미확인은 나눠 적는다.
- 교육 일정 · 내용을 바꾸면 `docs/00_전체목차.md` → `docs/01_1일차_계획.md` · `docs/02_2일차_계획.md` → `README.md` 를 함께 맞춘다.

## 6. 웹앱 (Next.js 16)

- Next.js 16은 예전 버전과 다르다. 확실하지 않은 API는 `node_modules/next/dist/docs/` 를 먼저 읽는다 (바뀐 점: `01-app/02-guides/upgrading/version-16.md`).
- `middleware.ts` 는 `proxy.ts` 로 바뀌었다. 기본이 Node 런타임이고 `runtime` 설정은 쓸 수 없다.
- `lib/` 의 순수 함수에는 vitest 테스트를 붙인다 (`npm test`). 화면 테스트는 요청할 때만 쓴다.
- 배포는 Vercel(Pro), 리전 `icn1` (`vercel.json`). 명단 · 설문 · 업로드 데이터는 DB · Blob에만 두고 저장소에 넣지 않는다.

## 7. 확인은 가볍게

- 작업 전에 성공 기준을 한 줄로 정한다. 여러 단계면 `1. [단계] → 확인: [방법]` 형식으로 짧게 계획을 보인다.
- 확인은 가장 가벼운 방법 한 번: 코드는 `npm run build` 나 해당 테스트 파일(`npx vitest run <파일>`), 화면은 사용자가 브라우저로 본다.
- 문서는 바꾼 시간 · 교시 · 파일명을 `grep` 으로 다른 문서에서 찾아 어긋난 곳이 없는지 본다.
- 같은 문제로 2번 실패하면 멈추고 오류 원문 · 원인 추정 · 대안을 보고한다.

## 8. 토큰 아끼기

- 필요한 부분만 읽는다. `grep -rn` · `find` 로 위치를 먼저 찾는다. `setup.ps1`(1,000줄 넘음)은 통째로 읽지 않는다.
- 읽지 않는다: `node_modules`(단 `node_modules/next/dist/docs/` 는 필요한 쪽만) · `.next` · `package-lock.json` · 빌드 결과물 · 이미지 · 영상.
- 긴 출력(설치 · 빌드 로그)은 끝부분만 본다: `... | tail -30`
- 이미 읽은 파일을 통째로 다시 읽거나, 고친 파일 전체를 다시 보여 주지 않는다.
- hwpx · pdf 같은 큰 문서는 필요한 쪽 · 표만 읽는다.
- MCP · 스킬 · 하위 에이전트는 필요할 때만 쓴다.
- 개발 서버(`npm run dev`)는 한 번 띄워 두고 다시 쓴다.

## 9. 보안 (공개 저장소)

- 키 · 토큰 · DB 연결 문자열은 `.env.local` 이나 Vercel 환경변수에만 둔다. 코드 · 커밋 · 대화창 · 결과 파일에 쓰지 않고, 붙여넣으라고 하지 않는다. 필요한 변수 이름은 `.env.example` 에 값 없이 적는다.
- 커밋하지 않는다: `.env*`(`.env.example` 만 예외) · 명단 · 설문 결과 CSV · 수강생 이름 · 연락처 · 업로드된 영상 · 스크린샷. `.gitignore` 에 `.env*` · `!.env.example` · `*.csv` 가 있어도 커밋 전에 `git status` 로 확인한다.
- 예시 · 테스트 데이터는 가짜 이름으로 만든다.
- 공개자료만 쓴다. 내부자료 · 개인정보로 보이면 쓰기 전에 묻는다.
- 샌드박스를 끄거나 전체 권한을 요구하지 않는다. 저장소 밖 대량 삭제, 시스템 설정 변경은 하지 않는다.
- 대화형 로그인(`vercel login` · `gh auth login`)은 사용자가 직접 터미널에서 하게 안내한다.

## 10. 커밋과 보고

- 커밋 · 푸시는 사용자가 시킬 때만 한다. 커밋 메시지는 한국어 한 줄 요약 (예: `전체목차 교시별 제목·시간대별 세부내용 구체화`).
- 커밋 신원은 저장소 로컬 설정(GitHub noreply 이메일)을 그대로 쓰고 바꾸지 않는다.
- 끝나면 3줄 이내: 바꾼 것 · 확인한 방법 · 다음에 할 일. 확인하지 못한 것은 그렇다고 말한다.

---
원본: `docs/교육생_배포/2_1일차_당일/AGENTS.global.md` 를 이 저장소(macOS 관리 작업)에 맞게 고침 — 수강생 전용(Windows 명령 바꾸기 · 모델 상한)은 뺐다.
