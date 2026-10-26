import { describe, expect, test } from "vitest";
import { checkSiteUrl } from "./site-url";

describe("checkSiteUrl", () => {
  test.each([
    ["https://the-housing.vercel.app", "https://the-housing.vercel.app"],
    ["https://the-housing.vercel.app/", "https://the-housing.vercel.app"],
    ["the-housing.vercel.app", "https://the-housing.vercel.app"],
    ["  http://the-housing.vercel.app/citizen ", "https://the-housing.vercel.app/citizen"],
    ["https://kca-dashboard-team.vercel.app", "https://kca-dashboard-team.vercel.app"],
  ])("accepts %s", (input, url) => {
    expect(checkSiteUrl(input)).toEqual({ ok: true, url });
  });

  test.each([
    ["empty", " ", "넣어 주세요"],
    ["another domain", "https://example.com/", "vercel.app 주소만"],
    ["vercel.app itself", "https://vercel.app/", "vercel.app 주소만"],
    ["lookalike suffix", "https://the-housing.vercel.app.evil.com/", "vercel.app 주소만"],
    ["lookalike name", "https://evilvercel.app/", "vercel.app 주소만"],
    ["nested name", "https://a.b.vercel.app/", "vercel.app 주소만"],
    ["credentials", "https://user:pass@the-housing.vercel.app/", "계정이나 포트"],
    ["custom port", "https://the-housing.vercel.app:8443/", "계정이나 포트"],
    ["other scheme", "ftp://the-housing.vercel.app/", "https://"],
    ["deployment hash", "https://vibe-coding-jhq95da26-kcaev3-2151.vercel.app", "긴 주소"],
    ["branch preview", "https://the-housing-git-main-kcaev3-2151.vercel.app", "긴 주소"],
  ])("rejects %s", (_name, input, reason) => {
    const result = checkSiteUrl(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain(reason);
  });
});
