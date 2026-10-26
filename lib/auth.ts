import { cookies } from "next/headers";
import { makeToken, readToken, type Session } from "./session";

// One signed cookie per kind, so the instructor can be admin and a trainee in the same browser
const NAME = { student: "vibe-student", admin: "vibe-admin" } as const;
const DAYS = 3; // the course runs two days

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

export async function signedIn(kind: Session["kind"]) {
  // cookies() first: it marks the page as per-request before the secret is needed
  const token = (await cookies()).get(NAME[kind])?.value;
  const session = readToken(secret(), token, Date.now());
  return session?.kind === kind ? session : null;
}

export async function signIn(session: Session) {
  const expires = Date.now() + DAYS * 24 * 60 * 60 * 1000;
  (await cookies()).set(NAME[session.kind], makeToken(secret(), session, expires), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function signOut(kind: Session["kind"]) {
  (await cookies()).delete(NAME[kind]);
}
