import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { CourseInfo } from "./course";
import type { PinFailures } from "./pin-limit";

// Neon over HTTP, created on first use so `next build` runs without DATABASE_URL. Tables: db/schema.sql
let client: NeonQueryFunction<false, false> | null = null;
const sql = () => (client ??= neon(process.env.DATABASE_URL!));

// Clears what the removed roster, gallery and survey left behind (projects and likes go with their trainees), and the PIN records
export async function wipeAll() {
  await sql()`delete from students`;
  await sql()`delete from pin_failures`;
  await sql()`delete from survey_answers`;
}

// The date · place · deadlines · contact on /course, typed in on the admin screen (one row)
export async function courseInfo() {
  const rows = (await sql()`select info from course_info where id = 1`) as { info: CourseInfo }[];
  return rows[0]?.info ?? {};
}

export async function saveCourseInfo(info: CourseInfo) {
  await sql()`insert into course_info (id, info) values (1, ${JSON.stringify(info)}::jsonb) on conflict (id) do update set info = excluded.info`;
}

// Wrong admin PINs: from this address in the last 10 minutes, and from everywhere in the last hour (limits: lib/pin-limit.ts)
export async function pinFailures(ip: string) {
  const rows = (await sql()`
    select count(*) filter (where ip = ${ip} and at > now() - interval '10 minutes')::int as here,
      count(*) filter (where at > now() - interval '1 hour')::int as everywhere
    from pin_failures where kind = 'admin'`) as PinFailures[];
  return rows[0];
}

export async function recordPinFailure(ip: string) {
  await sql()`delete from pin_failures where at < now() - interval '1 day'`;
  await sql()`insert into pin_failures (kind, ip) values ('admin', ${ip})`;
}
