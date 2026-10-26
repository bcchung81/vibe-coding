import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { RosterRow } from "./roster";

// Neon over HTTP, created on first use so `next build` runs without DATABASE_URL. Tables: db/schema.sql
let client: NeonQueryFunction<false, false> | null = null;
const sql = () => (client ??= neon(process.env.DATABASE_URL!));

export type Student = { id: number; name: string; team: string; topic: string | null };
export type SavedProject = { url: string; app: string; tagline: string };
export type StatusRow = { name: string; team: string; topic: string | null; app: string | null; url: string | null; likes: number };

export async function listStudents() {
  return (await sql()`select id, name, team from students order by team, name`) as Omit<Student, "topic">[];
}

export async function findStudent(id: number) {
  const rows = (await sql()`select id, name, team, topic from students where id = ${id}`) as Student[];
  return rows[0] ?? null;
}

// Adds new names and keeps the ones already there (their projects stay). Returns how many were new.
export async function addStudents(rows: RosterRow[]) {
  const added = await sql()`
    insert into students (name, team)
    select * from unnest(${rows.map((r) => r.name)}::text[], ${rows.map((r) => r.team)}::text[])
    on conflict (name, team) do nothing
    returning id`;
  return added.length;
}

export async function findProject(studentId: number) {
  const rows = (await sql()`select app_url as url, app_name as app, tagline from projects where student_id = ${studentId}`) as SavedProject[];
  return rows[0] ?? null;
}

export async function saveProject(studentId: number, p: SavedProject) {
  await sql()`
    insert into projects (student_id, app_url, app_name, tagline) values (${studentId}, ${p.url}, ${p.app}, ${p.tagline})
    on conflict (student_id) do update set app_url = excluded.app_url, app_name = excluded.app_name, tagline = excluded.tagline, updated_at = now()`;
}

export async function setTopic(studentId: number, slug: string | null) {
  await sql()`update students set topic = ${slug} where id = ${studentId}`;
}

// How many people picked each topic: { "03": 7, ... }. No names leave the database.
export async function topicCounts() {
  const rows = (await sql()`select topic, count(*)::int as n from students where topic is not null group by topic`) as { topic: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.topic, r.n]));
}

export async function rosterStatus() {
  return (await sql()`
    select s.name, s.team, s.topic, p.app_name as app, p.app_url as url,
      (select count(*) from likes l where l.project_id = s.id)::int as likes
    from students s left join projects p on p.student_id = s.id
    order by s.team, s.name`) as StatusRow[];
}

// Wrong course PINs from one address in the last 10 minutes (the classroom shares one, so the limit is generous)
export const PIN_FAILURE_LIMIT = 30;

export async function recentPinFailures(ip: string) {
  const rows = (await sql()`select count(*)::int as n from pin_failures where ip = ${ip} and at > now() - interval '10 minutes'`) as { n: number }[];
  return rows[0].n;
}

export async function recordPinFailure(ip: string) {
  await sql()`delete from pin_failures where at < now() - interval '1 day'`;
  await sql()`insert into pin_failures (ip) values (${ip})`;
}
