-- 교육 운영 허브 데이터 (Neon Postgres). 적용: npm run db:setup (S2에서 추가)
-- 이 저장소는 공개다. 명단 · 프로젝트 같은 실제 데이터는 DB에만 둔다.

create table if not exists students (
  id serial primary key,
  name text not null,
  team text not null default '',      -- 로그인은 공통 PIN(COURSE_PIN) + 이름 고르기. 개인 PIN은 없다
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
