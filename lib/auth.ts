import { cookies } from "next/headers";
import { makeToken, readToken } from "./session";

// The admin's signed cookie — the only login left on the hub
const NAME = "vibe-admin";
const DAYS = 3; // the course runs two days

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

export async function signedIn() {
  // cookies() first: it marks the page as per-request before the secret is needed
  const token = (await cookies()).get(NAME)?.value;
  return readToken(secret(), token, Date.now());
}

export async function signIn(session: { kind: "admin"; id: number }) {
  const expires = Date.now() + DAYS * 24 * 60 * 60 * 1000;
  (await cookies()).set(NAME, makeToken(secret(), session, expires), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function signOut() {
  (await cookies()).delete(NAME);
}
