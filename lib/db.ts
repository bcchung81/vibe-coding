import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { PinFailures, PinKind } from "./pin-limit";
import type { RosterRow } from "./roster";
import type { Response } from "./survey";

// Neon over HTTP, created on first use so `next build` runs without DATABASE_URL. Tables: db/schema.sql
let client: NeonQueryFunction<false, false> | null = null;
const sql = () => (client ??= neon(process.env.DATABASE_URL!));

export type Student = { id: number; name: string; team: string; topic: string | null };
export type SavedProject = { url: string; app: string; tagline: string };
export type StatusRow = { name: string; team: string; topic: string | null; app: string | null; url: string | null; likes: number; surveyed: boolean };

export async function listStudents() {
  return (await sql()`select id, name, team from students order by team, name`) as Omit<Student, "topic">[];
}

export async function findStudent(id: number) {
  const rows = (await sql()`select id, name, team, topic from students where id = ${id}`) as Student[];
  return rows[0] ?? null;
}

// Adds new names and keeps the ones already there (their projects stay). Returns the rows that went in.
export async function addStudents(rows: RosterRow[]) {
  return (await sql()`
    insert into students (name, team)
    select * from unnest(${rows.map((r) => r.name)}::text[], ${rows.map((r) => r.team)}::text[])
    on conflict (name, team) do nothing
    returning name, team`) as RosterRow[];
}

export async function findProject(studentId: number) {
  const rows = (await sql()`select app_url as url, app_name as app, tagline from projects where student_id = ${studentId}`) as SavedProject[];
  return rows[0] ?? null;
}

// Saving always asks for a new first-screen capture
export async function saveProject(studentId: number, p: SavedProject) {
  await sql()`
    insert into projects (student_id, app_url, app_name, tagline, capture_status) values (${studentId}, ${p.url}, ${p.app}, ${p.tagline}, 'pending')
    on conflict (student_id) do update set app_url = excluded.app_url, app_name = excluded.app_name, tagline = excluded.tagline,
      capture_status = 'pending', capture_error = null, updated_at = now()`;
}

// A capture still "pending" two minutes after saving was lost with its instance: show it as failed so it can be retried
const STATUS = `case when capture_status = 'pending' and updated_at < now() - interval '2 minutes' then 'failed' else capture_status end`;
export type Capture = { status: "none" | "pending" | "done" | "failed"; shot: string | null };

export async function captureState(studentId: number) {
  const rows = (await sql().query(`select ${STATUS} as status, capture_url as shot from projects where student_id = $1`, [studentId])) as Capture[];
  return rows[0] ?? { status: "none", shot: null };
}

// Done: the new image replaces the old one, whose address comes back so the caller can delete it. Failed: the old image stays.
export async function finishCapture(studentId: number, result: { url: string } | { error: string }) {
  if ("error" in result) {
    await sql()`update projects set capture_status = 'failed', capture_error = ${result.error} where student_id = ${studentId}`;
    return null;
  }
  const rows = (await sql()`
    update projects p set capture_status = 'done', capture_url = ${result.url}, capture_error = null, captured_at = now()
    from (select capture_url from projects where student_id = ${studentId}) old
    where p.student_id = ${studentId}
    returning old.capture_url as old`) as { old: string | null }[];
  return rows[0]?.old ?? null;
}

export type GalleryRow = { id: number; name: string; team: string; app: string; tagline: string; url: string; shot: string | null; status: Capture["status"]; likes: number; updatedAt: number };

export async function galleryProjects() {
  return (await sql().query(`
    select p.student_id as id, s.name, s.team, p.app_name as app, p.tagline, p.app_url as url, p.capture_url as shot, ${STATUS} as status,
      (select count(*) from likes l where l.project_id = p.student_id)::int as likes,
      (extract(epoch from p.updated_at) * 1000)::float8 as "updatedAt"
    from projects p join students s on s.id = p.student_id
    where p.app_url is not null`)) as GalleryRow[];
}

export async function likedBy(studentId: number) {
  const rows = (await sql()`select project_id from likes where student_id = ${studentId}`) as { project_id: number }[];
  return rows.map((r) => r.project_id);
}

// Likes or unlikes someone else's project; returns the new state and count, or null for your own or a missing project
export async function toggleLike(studentId: number, projectId: number) {
  if (studentId === projectId) return null;
  const removed = await sql()`delete from likes where student_id = ${studentId} and project_id = ${projectId} returning project_id`;
  if (!removed.length) {
    const added = await sql()`insert into likes (student_id, project_id) select ${studentId}, student_id from projects where student_id = ${projectId} returning project_id`;
    if (!added.length) return null;
  }
  const rows = (await sql()`select count(*)::int as n from likes where project_id = ${projectId}`) as { n: number }[];
  return { liked: !removed.length, likes: rows[0].n };
}

// End of the course: every trainee, project, like, PIN record and survey answer (capture images are removed from Blob by the caller)
export async function wipeAll() {
  await sql()`delete from students`;
  await sql()`delete from pin_failures`;
  await sql()`delete from survey_responses`;
}

// One answer sheet per trainee; answering again replaces it
export async function saveSurvey(studentId: number, answers: Response) {
  await sql()`
    insert into survey_responses (student_id, answers) values (${studentId}, ${JSON.stringify(answers)}::jsonb)
    on conflict (student_id) do update set answers = excluded.answers`;
}

export async function mySurvey(studentId: number) {
  const rows = (await sql()`select answers from survey_responses where student_id = ${studentId}`) as { answers: Response }[];
  return rows[0]?.answers ?? null;
}

// Answers only, in an order that is not the roster's, so a written answer does not point to its writer
export async function surveyResponses() {
  const rows = (await sql()`select answers from survey_responses order by md5(student_id::text)`) as { answers: Response }[];
  return rows.map((r) => r.answers);
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
      (select count(*) from likes l where l.project_id = s.id)::int as likes,
      exists (select 1 from survey_responses r where r.student_id = s.id) as surveyed
    from students s left join projects p on p.student_id = s.id
    order by s.team, s.name`) as StatusRow[];
}

// Wrong PINs of one kind: from this address in the last 10 minutes, and from everywhere in the last hour (limits: lib/pin-limit.ts)
export async function pinFailures(kind: PinKind, ip: string) {
  const rows = (await sql()`
    select count(*) filter (where ip = ${ip} and at > now() - interval '10 minutes')::int as here,
      count(*) filter (where at > now() - interval '1 hour')::int as everywhere
    from pin_failures where kind = ${kind}`) as PinFailures[];
  return rows[0];
}

export async function recordPinFailure(kind: PinKind, ip: string) {
  await sql()`delete from pin_failures where at < now() - interval '1 day'`;
  await sql()`insert into pin_failures (kind, ip) values (${kind}, ${ip})`;
}
