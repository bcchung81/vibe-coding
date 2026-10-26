"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { signIn, signOut, signedIn } from "../lib/auth";
import { addStudents, findStudent, listStudents, PIN_FAILURE_LIMIT, recentPinFailures, recordPinFailure, saveProject, setTopic } from "../lib/db";
import { parseRoster } from "../lib/roster";
import { matchesSecret } from "../lib/session";
import { checkSiteUrl } from "../lib/site-url";
import { isTopicSlug } from "../lib/topic-counts";

// Server Functions are public endpoints: each one checks the PIN, password or cookie itself.

// "ok", "wrong", or "locked" after too many wrong PINs from this address. Vercel sets x-forwarded-for.
async function checkCoursePin(pin: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if ((await recentPinFailures(ip)) >= PIN_FAILURE_LIMIT) return "locked";
  if (/^\d{4}$/.test(pin) && matchesSecret(pin, process.env.COURSE_PIN)) return "ok";
  await recordPinFailure(ip);
  return "wrong";
}

// The roster is only handed out to someone who knows the course PIN
export async function checkPin(pin: string) {
  const result = await checkCoursePin(pin);
  return result === "ok" ? { ok: true as const, roster: await listStudents() } : { ok: false as const, locked: result === "locked" };
}

// `topic` is what this browser picked before logging in; it counts unless the trainee already has one saved
export async function logIn(pin: string, id: number, topic: string | null) {
  const me = Number.isInteger(id) && (await checkCoursePin(pin)) === "ok" ? await findStudent(id) : null;
  if (!me) return null;
  await signIn({ kind: "student", id: me.id });
  if (!me.topic && isTopicSlug(topic)) await setTopic(me.id, topic);
  return { name: me.name, team: me.team };
}

export async function logOut() {
  await signOut("student");
}

export async function saveMyProject(input: { url: string; app: string; tagline: string }) {
  const me = await signedIn("student");
  if (!me) return { error: "로그인이 풀렸습니다. 다시 로그인해 주세요." };
  const check = checkSiteUrl(input.url);
  if (!check.ok) return { error: check.reason };
  const app = input.app.trim().slice(0, 20);
  if (!app) return { error: "앱 이름을 넣어 주세요" };
  await saveProject(me.id, { url: check.url, app, tagline: input.tagline.trim().slice(0, 40) });
  return { saved: { url: check.url, app, tagline: input.tagline.trim().slice(0, 40) } };
}

// Saved only for a logged-in trainee; the browser keeps its own copy either way. Returns whether it counted.
export async function pickTopic(slug: string | null) {
  const me = await signedIn("student");
  if (!me || (slug !== null && !isTopicSlug(slug))) return false;
  await setTopic(me.id, slug);
  return true;
}

export async function adminLogIn(password: string) {
  if (!matchesSecret(password, process.env.ADMIN_PASSWORD)) return false;
  await signIn({ kind: "admin", id: 0 });
  refresh();
  return true;
}

// Adds new names only; existing ones and their projects stay
export async function saveRoster(text: string) {
  if (!(await signedIn("admin"))) return { error: "관리자 로그인이 풀렸습니다. 새로 고침 후 다시 들어오세요." };
  const { rows, duplicates } = parseRoster(text);
  if (!rows.length || duplicates.length) return { error: "명단을 확인해 주세요 (비어 있거나 중복이 있습니다)" };
  const added = await addStudents(rows);
  refresh();
  return { added, kept: rows.length - added };
}
