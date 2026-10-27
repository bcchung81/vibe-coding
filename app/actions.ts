"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { del, list } from "@vercel/blob";
import { signIn, signOut, signedIn } from "../lib/auth";
import { captureProject } from "../lib/capture";
import { addStudents, captureState, findStudent, listStudents, pinFailures, recordPinFailure, saveProject, saveSurvey, setTopic, toggleLike, wipeAll } from "../lib/db";
import { pinLocked, type PinKind } from "../lib/pin-limit";
import { checkAnswers } from "../lib/survey";
import { canApply, cleanCell, planRoster } from "../lib/roster";
import { matchesSecret } from "../lib/session";
import { checkSiteUrl } from "../lib/site-url";
import { isTopicSlug } from "../lib/topic-counts";

// Server Functions are public endpoints: each one checks the PIN, password or cookie itself.

// "ok", "wrong", or "locked" after too many wrong PINs (lib/pin-limit.ts). Vercel sets x-forwarded-for.
async function checkPin4(kind: PinKind, pin: string, expected: string | undefined) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (pinLocked(kind, await pinFailures(kind, ip))) return "locked";
  if (/^\d{4}$/.test(pin) && matchesSecret(pin, expected)) return "ok";
  await recordPinFailure(kind, ip);
  return "wrong";
}

const checkCoursePin = (pin: string) => checkPin4("course", pin, process.env.COURSE_PIN);

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
  const saved = { url: check.url, app, tagline: input.tagline.trim().slice(0, 40) };
  await saveProject(me.id, saved);
  // the first screen is captured after the response; the page asks myCapture() until it is done
  after(() => captureProject(me.id, saved.url));
  return { saved };
}

export async function myCapture() {
  const me = await signedIn("student");
  return me ? captureState(me.id) : null;
}

// null when not logged in (or your own project)
export async function likeProject(projectId: number) {
  const me = await signedIn("student");
  if (!me || !Number.isInteger(projectId)) return null;
  return toggleLike(me.id, projectId);
}

// Saved only for a logged-in trainee; the browser keeps its own copy either way. Returns whether it counted.
export async function pickTopic(slug: string | null) {
  const me = await signedIn("student");
  if (!me || (slug !== null && !isTopicSlug(slug))) return false;
  await setTopic(me.id, slug);
  return true;
}

// The admin PIN (4 digits, ADMIN_PASSWORD in Vercel): "ok", "wrong" or "locked"
export async function adminLogIn(pin: string) {
  const result = await checkPin4("admin", pin, process.env.ADMIN_PASSWORD);
  if (result === "ok") {
    await signIn({ kind: "admin", id: 0 });
    refresh();
  }
  return result;
}

export async function adminLogOut() {
  await signOut("admin");
  refresh();
}

// The ticked rows of the roster grid. The server judges them again against the saved roster (lib/roster.ts) and adds new names only;
// names already there and their projects stay. Each row comes back with whether it went in and, if not, why.
export async function saveRoster(input: unknown) {
  if (!(await signedIn("admin"))) return { error: "관리자 로그인이 풀렸습니다. 새로 고침 후 다시 들어오세요." };
  const rows = (Array.isArray(input) ? input : []).slice(0, 300).map((r) => ({ name: cleanCell(String(r?.name ?? "")), team: cleanCell(String(r?.team ?? "")) }));
  const plan = planRoster(rows, await listStudents());
  const fit = rows.filter((_, i) => canApply(plan[i]));
  const added = fit.length ? await addStudents(fit) : [];
  const went = new Set(added.map((r) => `${r.name}\u0000${r.team}`));
  refresh();
  return { results: rows.map((r, i) => (canApply(plan[i]) && went.has(`${r.name}\u0000${r.team}`) ? { ok: true as const } : { ok: false as const, note: plan[i]?.note || "이미 명단에 있습니다" })) };
}

// Removes every trainee, project, like, survey answer and capture image. The admin types 삭제 to confirm.
export async function wipeEverything(confirm: string) {
  if (!(await signedIn("admin")) || confirm !== "삭제") return false;
  await wipeAll();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "captures/", cursor });
    if (page.blobs.length) await del(page.blobs.map((b) => b.url));
    cursor = page.cursor;
  } while (cursor);
  refresh();
  return true;
}

// The trainee's own pre-course survey, checked the same way the form checks it; answering again replaces it
export async function answerSurvey(draft: unknown) {
  const me = await signedIn("student");
  if (!me) return { error: "로그인이 풀렸습니다. 다시 로그인해 주세요.", no: 0 };
  const result = checkAnswers(draft);
  if ("error" in result) return result;
  await saveSurvey(me.id, result.answers);
  return { saved: result.answers };
}
