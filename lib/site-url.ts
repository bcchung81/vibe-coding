// A trainee's site address. Same rules as capture-test/lib/target.ts (https, one *.vercel.app name, no credentials or port),
// with plain-language reasons for non-developers.
export type SiteCheck = { ok: true; url: string } | { ok: false; reason: string };

// Per-deployment addresses (<project>-<9-char hash>-<scope>, <project>-git-<branch>-<scope>) sit behind Vercel login
const DEPLOYMENT = /-(git-[a-z0-9-]+|(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{9})-[a-z0-9-]+$/;

export function checkSiteUrl(input: string): SiteCheck {
  const text = input.trim();
  if (!text) return { ok: false, reason: "사이트 주소를 넣어 주세요" };
  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { ok: false, reason: "주소 모양이 아닙니다. 예: https://my-app.vercel.app" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, reason: "https:// 로 시작하는 주소를 넣어 주세요" };
  if (url.username || url.password || url.port) return { ok: false, reason: "주소에 계정이나 포트 번호를 넣지 마세요" };
  const name = url.hostname.endsWith(".vercel.app") ? url.hostname.slice(0, -".vercel.app".length) : "";
  if (!name || name.includes(".")) return { ok: false, reason: "https://<이름>.vercel.app 주소만 받습니다" };
  if (DEPLOYMENT.test(name)) return { ok: false, reason: "배포할 때마다 생기는 긴 주소입니다. Vercel 프로젝트의 기본 주소(Domains)를 넣어 주세요" };
  const path = url.pathname === "/" ? "" : url.pathname;
  return { ok: true, url: `https://${url.hostname}${path}` };
}
