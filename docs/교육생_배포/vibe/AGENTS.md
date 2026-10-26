# 이 프로젝트 규칙 — 내 웹앱 (vibe)

`setup.ps1` 이 설치한 전역 규칙에 더해, 이 폴더에서만 지킨다.

## 1. 무엇을 만드나

- 공공데이터 API 하나로 만드는 **한 화면** 웹앱이다.
- 주제 카드는 `topics/` (사용자가 고른 번호 하나), 요구사항은 `PRD.md`, 단계 계획은 `PLAN.md`. 작업 전에 이 셋을 먼저 읽는다. 맥락은 대화가 아니라 파일에 둔다.
- 카드의 "향후 고도화"는 만들지 않는다. 사용자가 원하면 `PRD.md` 의 "나중에" 칸에 적어만 둔다.

## 2. 구조

- Next.js App Router · TypeScript. 화면은 `app/page.tsx`. 데이터는 반드시 서버 라우트 `app/api/data/route.ts` 를 거친다.
- 처음에는 라우트가 `data/snapshot.json` 을 돌려준다. 실제 API 단계에서 **같은 라우트**가 실제 API를 부른다. 화면 코드는 바꾸지 않는다.
- `data/snapshot.json` 이 비어 있으면(강사 파일을 아직 못 받았으면) 주제 카드의 "응답에서 쓸 항목" 이름으로 예시 5건을 만들고 `"source": "예시"` 라고 적는다.
- 배포 지역은 서울(`vercel.json` 의 `icn1`)이다. 바꾸지 않는다.

## 3. 키와 오류

- 공공데이터 키는 `.env.local` 의 `DATA_GO_KR_KEY` (Decoding 키)다. 서버 라우트 안에서만 `process.env.DATA_GO_KR_KEY` 로 읽고, `NEXT_PUBLIC_` 을 붙이지 않는다.
- 키가 없거나 호출이 실패해도 화면은 돈다. 라우트는 `data/snapshot.json` 을 대신 돌려주고, 화면에 "예시 데이터"라고 표시한다. 오류 원문 · 키 · 요청 주소는 화면에 보내지 않는다 (서버 로그에만 남긴다).
- 요청 파라미터는 `URLSearchParams` 로 조립한다 (키 · 한글 · 대괄호가 안전하게 인코딩된다).

## 4. 처음 준비 — "시작하기.md 대로 준비해줘"

1. `git init` — 이미 저장소면 건너뛴다
2. `npm.cmd install`
3. `npm.cmd run build` 로 뼈대가 빌드되는지 확인한다
4. 3줄로 보고하고 사용자의 주제 번호를 묻는다. 다음은 `/vibe-prd 번호`

## 5. 명령 (스킬)

- `vibe-prd` · `vibe-plan` · `vibe-step` · `vibe-fix` · `vibe-check` 가 `.agents/skills/` (Codex · Antigravity) 와 `.claude/skills/` (Claude Code) 에 같은 내용으로 있다. 하나를 고치면 다른 쪽도 똑같이 고친다.
- **전역 설치** — 사용자가 "vibe 명령을 전역에도 설치해줘" 하면 `.agents/skills/vibe-*` 폴더를 아래 전역 스킬 폴더에 복사한다. `setup.ps1` 이 `think` 를 둔 곳과 같다.
  - 이 PC에 있는 폴더에만 복사한다 (없는 에이전트 폴더는 만들지 않는다).
  - 같은 이름 폴더가 이미 있으면 덮어쓰기 전에 묻는다.
  - 끝나면 에이전트를 다시 열라고 안내한다.

| 에이전트 | 전역 스킬 폴더 |
|---|---|
| Codex | `~\.agents\skills` |
| Claude Code | `~\.claude\skills` |
| Antigravity | `~\.gemini\config\skills` · `~\.gemini\antigravity-cli\skills` |

## 6. 커밋

- 커밋 · 푸시는 사용자가 시킬 때만 한다. 커밋 전에 `git status` 로 `.env.local` 이 없는지 본다.
