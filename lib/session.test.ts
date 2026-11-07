import { describe, expect, test } from "vitest";
import { makeToken, matchesSecret, readToken } from "./session";

const SECRET = "test-secret";
const NOW = 1_000_000;

describe("readToken", () => {
  test("reads back the admin until the cookie expires", () => {
    const token = makeToken(SECRET, { kind: "admin", id: 0 }, NOW + 1000);
    expect(readToken(SECRET, token, NOW)).toEqual({ kind: "admin", id: 0 });
    expect(readToken(SECRET, token, NOW + 1000)).toBeNull();
  });

  test("rejects a changed id, another secret, or no cookie", () => {
    const token = makeToken(SECRET, { kind: "admin", id: 0 }, NOW + 1000);
    expect(readToken(SECRET, token.replace("admin:0", "admin:1"), NOW)).toBeNull();
    expect(readToken("other-secret", token, NOW)).toBeNull();
    expect(readToken(SECRET, undefined, NOW)).toBeNull();
    expect(readToken(SECRET, "garbage", NOW)).toBeNull();
  });

  test("no longer reads an old trainee cookie, even a correctly signed one", () => {
    const old = makeToken(SECRET, { kind: "student", id: 7 } as never, NOW + 1000);
    expect(readToken(SECRET, old, NOW)).toBeNull();
  });
});

describe("matchesSecret", () => {
  test("matches only the exact value, and never an unset one", () => {
    expect(matchesSecret("1234", "1234")).toBe(true);
    expect(matchesSecret("1235", "1234")).toBe(false);
    expect(matchesSecret("12345", "1234")).toBe(false);
    expect(matchesSecret("", undefined)).toBe(false);
    expect(matchesSecret("", "")).toBe(false);
  });
});
