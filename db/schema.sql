-- 교육 운영 허브 데이터 (Neon Postgres). 적용: npm run db:setup (다시 실행해도 된다)
-- 이 저장소는 공개다. 명단 · 프로젝트 같은 실제 데이터는 DB에만 둔다.

create table if not exists students (
  id serial primary key,
  name text not null,
  team text not null default '',      -- 로그인은 공통 PIN(COURSE_PIN) + 이름 고르기. 개인 PIN은 없다
  topic text,                          -- 고른 웹앱 주제 번호(01~10). 주제별 인원은 /api/topics/stats
  created_at timestamptz not null default now(),
  unique (name, team)
);

create table if not exists projects (
  student_id int primary key references students(id) on delete cascade,
  app_name text not null default '',
  tagline text not null default '',
  app_url text,                        -- https://<이름>.vercel.app (lib/site-url.ts 로 검사)
  capture_url text,                    -- Vercel Blob captures/
  capture_status text not null default 'none' check (capture_status in ('none', 'pending', 'done', 'failed')),
  capture_error text,
  captured_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 좋아요: 한 사람이 한 프로젝트에 한 번. 자기 프로젝트는 앱에서 막는다. 추천 1·2·3은 이 수로 계산 (lib/gallery.ts)
create table if not exists likes (
  student_id int not null references students(id) on delete cascade,
  project_id int not null references projects(student_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, project_id)
);

-- 틀린 PIN 기록 (lib/pin-limit.ts). 공통 PIN(course): 같은 곳(IP)에서 10분에 30번 틀리면 막는다 — 강의실은 IP 하나를 같이 쓰므로 넉넉하게.
-- 관리자 PIN(admin): 같은 곳에서 10분에 10번, 모든 곳 합쳐 1시간에 50번 틀리면 막는다. 하루 지난 기록은 지운다
create table if not exists pin_failures (
  ip text not null,
  at timestamptz not null default now()
);
alter table pin_failures add column if not exists kind text not null default 'course';
create index if not exists pin_failures_ip_at on pin_failures (ip, at);

-- 사전 수요조사 응답 — 수요조사 기능은 2026-11-07 뺐다. 이미 받은 응답을 지우지 않으려고 표만 남기고, 교육 끝 일괄 삭제(lib/db.ts wipeAll)가 지운다.
create table if not exists survey_answers (
  email text primary key,               -- 소문자로 맞춰 저장
  name text not null,
  answers jsonb not null,               -- {"1": ["이틀 모두"], "2": ["자료 조사", "기타에 적은 글"], ...}
  token text not null,                  -- 답한 브라우저의 쿠키(vibe-survey)에만 있는 무작위 열쇠. 그 브라우저에서 다시 열면 낸 답을 채운다
  at timestamptz not null default now()
);
create index if not exists survey_answers_token on survey_answers (token);

-- 교육 안내(/course) 맨 위의 일시 · 장소 · 마감 · 문의. 관리 화면에서 적는다 — 문의처를 공개 저장소에 두지 않으려고 DB에 둔다 (lib/course.ts)
create table if not exists course_info (
  id int primary key default 1 check (id = 1),  -- 한 줄만
  info jsonb not null default '{}'::jsonb       -- {"when": "...", "place": "...", "prepDue": "...", "contact": "..."}
);
