// 덱을 영상으로 — 녹화가 아니라 t를 1/30초씩 넣어 한 장씩 찍고(Edge) FFmpeg로 묶는다. 느린 PC도 영상은 매끈하다.
// 실행: npm.cmd run export -- --slides 1,3,6 --sec 10   (장 번호 · 장마다 초. 빼면 모든 장 · 장의 data-sec)
//       --gif 메신저용 GIF도 · --hd 1920×1080 (기본 1280×720) · --light 가벼운 모드로
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { build, preview } from "vite";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name) => args.includes(`--${name}`);
const numbers = (opt("slides") ?? "").split(",").map(Number).filter((n) => n > 0);
const sec = Number(opt("sec")) || 0;
const FPS = 30;
const [W, H] = flag("hd") ? [1920, 1080] : [1280, 720];
const OUT = "out/deck.mp4";

// Windows는 늘 있는 Edge, Mac은 Edge · Chrome. 다른 브라우저는 BROWSER 환경변수로
const browserPath = [
  process.env.BROWSER,
  `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => p && existsSync(p));
if (!browserPath) {
  console.error("Edge를 찾지 못했습니다. Edge가 설치돼 있는지 확인하세요.");
  process.exit(1);
}
if (spawnSync("ffmpeg", ["-version"]).error) {
  console.error("FFmpeg를 찾지 못했습니다. setup.ps1 결과 표의 FFmpeg 줄을 확인하세요 (새 창에서 ffmpeg -version).");
  process.exit(1);
}

const started = Date.now();
console.log("1/3 덱을 빌드합니다");
await build({ logLevel: "error" });
const server = await preview({ preview: { port: 5199, host: "127.0.0.1" }, logLevel: "error" });
const url = server.resolvedUrls.local[0];

const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: true,
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  args: ["--hide-scrollbars", "--mute-audio", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("덱 오류:", e.message));
  await page.goto(`${url}?export${flag("light") ? "&light" : ""}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.deck?.ready, { timeout: 60_000 });
  const plan = await page.evaluate((n, s) => window.deck.plan(n, s), numbers, sec);
  const frames = Math.round(plan.total * FPS);
  console.log(`2/3 ${plan.slides.map((s) => `${s.no}장 ${s.sec}초`).join(" → ")} · 모두 ${plan.total}초 · ${frames}장을 찍습니다 (${W}×${H})`);

  mkdirSync("out", { recursive: true });
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", `${FPS}`, "-c:v", "png", "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", OUT], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error(`FFmpeg가 ${code}로 끝났습니다`)))));
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));

  for (let f = 0; f < frames; f++) {
    // 그 순간을 그리고 화면에 한 번 칠해진 뒤 찍는다
    await page.evaluate((t) => new Promise((res) => {
      window.deck.renderAt(t);
      requestAnimationFrame(() => res());
    }), f / FPS);
    await write(await page.screenshot({ type: "png", optimizeForSpeed: true }));
    if ((f + 1) % FPS === 0) process.stdout.write(`\r   ${(f + 1) / FPS} / ${plan.total}초`);
  }
  ff.stdin.end();
  await done;
  console.log(`\n3/3 ${OUT} (${(statSync(OUT).size / 1e6).toFixed(1)}MB)`);

  if (flag("gif")) {
    spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", OUT, "-vf", "fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse", "out/deck.gif"], { stdio: "inherit" });
    console.log("   out/deck.gif");
  }
  console.log(`끝 — ${Math.round((Date.now() - started) / 1000)}초 걸렸습니다`);
} finally {
  await browser.close();
  server.httpServer.close();
}
