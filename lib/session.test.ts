import { describe, expect, test } from "vitest";
import { makeToken, matchesSecret, readToken } from "./session";

const SECRET = "test-secret";
const NOW = 1_000_000;

describe("readToken", () => {
  test("reads back who signed in until it expires", () => {
    const token = makeToken(SECRET, { kind: "student", id: 7 }, NOW + 1000);
    expect(readToken(SECRET, token, NOW)).toEqual({ kind: "student", id: 7 });
    expect(readToken(SECRET, token, NOW + 1000)).toBeNull();
  });

  test("rejects a changed id, another secret, or no cookie", () => {
    const token = makeToken(SECRET, { kind: "student", id: 7 }, NOW + 1000);
    expect(readToken(SECRET, token.replace("student:7", "student:8"), NOW)).toBeNull();
    expect(readToken(SECRET, token.replace("student", "admin"), NOW)).toBeNull();
    expect(readToken("other-secret", token, NOW)).toBeNull();
    expect(readToken(SECRET, undefined, NOW)).toBeNull();
    expect(readToken(SECRET, "garbage", NOW)).toBeNull();
  });

  test("keeps the admin apart from trainees", () => {
    expect(readToken(SECRET, makeToken(SECRET, { kind: "admin", id: 0 }, NOW + 1), NOW)).toEqual({ kind: "admin", id: 0 });
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
