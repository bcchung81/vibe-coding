import { createHmac, timingSafeEqual } from "node:crypto";

// Who a signed cookie belongs to: a trainee (students.id) or the admin. No session table — the signature is the proof.
export type Session = { kind: "student" | "admin"; id: number };

const sign = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("base64url");

// "<kind>:<id>:<expires ms>.<signature>"
export function makeToken(secret: string, session: Session, expires: number) {
  const body = `${session.kind}:${session.id}:${expires}`;
  return `${body}.${sign(secret, body)}`;
}

export function readToken(secret: string, token: string | undefined, now: number): Session | null {
  const dot = token?.lastIndexOf(".") ?? -1;
  if (!token || dot < 0) return null;
  const body = token.slice(0, dot);
  if (!same(token.slice(dot + 1), sign(secret, body))) return null;
  const [kind, id, expires] = body.split(":");
  if ((kind !== "student" && kind !== "admin") || !Number.isInteger(Number(id)) || !(Number(expires) > now)) return null;
  return { kind, id: Number(id) };
}

// A typed PIN or password against the value set in Vercel; an unset value never matches
export function matchesSecret(input: string, expected: string | undefined) {
  return Boolean(expected) && same(input, expected!);
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
