"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { signIn, signOut, signedIn } from "../lib/auth";
import { checkCourseInfo } from "../lib/course";
import { pinFailures, recordPinFailure, saveCourseInfo, wipeAll } from "../lib/db";
import { pinLocked } from "../lib/pin-limit";
import { matchesSecret } from "../lib/session";

// Server Functions are public endpoints: each one checks the PIN or cookie itself.

// Vercel sets x-forwarded-for
const clientIp = async () => (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

// The admin PIN (4 digits, ADMIN_PASSWORD in Vercel): "ok", "wrong" or "locked" after too many wrong PINs (lib/pin-limit.ts)
export async function adminLogIn(pin: string) {
  const ip = await clientIp();
  if (pinLocked(await pinFailures(ip))) return "locked";
  if (!/^\d{4}$/.test(pin) || !matchesSecret(pin, process.env.ADMIN_PASSWORD)) {
    await recordPinFailure(ip);
    return "wrong";
  }
  await signIn({ kind: "admin", id: 0 });
  refresh();
  return "ok";
}

export async function adminLogOut() {
  await signOut();
  refresh();
}

// The admin's date · place · deadlines · contact for /course; empty fields show as 확정되면 안내
export async function saveCourse(input: unknown): Promise<{ ok: true } | { error: string }> {
  if (!(await signedIn())) return { error: "관리자 로그인이 풀렸습니다. 새로 고침 후 다시 들어오세요." };
  const r = checkCourseInfo(input);
  if ("error" in r) return r;
  await saveCourseInfo(r.info);
  refresh();
  return { ok: true as const };
}

// Removes what the old roster, gallery and survey left in the database. The admin types 삭제 to confirm.
export async function wipeEverything(confirm: string) {
  if (!(await signedIn()) || confirm !== "삭제") return false;
  await wipeAll();
  refresh();
  return true;
}
