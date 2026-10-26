import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import chromium from "@sparticuz/chromium-min";
import { del, put } from "@vercel/blob";
import puppeteer from "puppeteer-core";
import { finishCapture } from "./db";

// First-screen capture of a trainee's site, as tested in the capture-test project (2026-10, 11–20 s per site).
// Only the address saved in the database is captured; nothing outside calls this.

// Same version as @sparticuz/chromium-min; downloaded once per cold instance
const PACK_URL = "https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar";
const VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 1 };
// Folders the bundled fontconfig reads; ./fonts holds Noto Sans KR (the Chromium build has no Korean font)
const FONT_DIRS = ["/var/task/.fonts", "/var/task/fonts", "/opt/fonts", "/tmp/fonts"];
// Charts and maps draw after their data arrives
const SETTLE_MS = 1500;
// At most two Chromium per instance: one instance may get many registrations at once
const PARALLEL = 2;

// One shared promise: concurrent cold calls must not unpack Chromium twice (Sparticuz/chromium#507)
let executable: Promise<string> | undefined;
let running = 0;
const waiting: (() => void)[] = [];

// Our ./fonts go into /tmp/fonts unless the bundle already put them in a font folder.
// Call after Chromium is unpacked: the package skips unpacking its fonts.conf when /tmp/fonts already exists.
function installFonts() {
  const bundled = join(process.cwd(), "fonts");
  if (!existsSync(bundled) || FONT_DIRS.includes(bundled)) return;
  mkdirSync("/tmp/fonts", { recursive: true });
  for (const file of readdirSync(bundled)) {
    const dest = join("/tmp/fonts", file);
    if (!existsSync(dest)) cpSync(join(bundled, file), dest);
  }
}

async function shoot(url: string) {
  executable ??= chromium.executablePath(PACK_URL);
  const executablePath = await executable;
  installFonts();
  const browser = await puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath,
    headless: "shell",
    defaultViewport: VIEWPORT,
  });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 30_000 });
    // maps and apps that keep polling never go quiet: wait up to 10 s, then shoot what is there
    // (rehearsal 2026-10-26: a 3D map page timed out under networkidle0 when 30 sites were captured at once)
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 10_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, SETTLE_MS));
    return await page.screenshot({ type: "webp", quality: 80 });
  } finally {
    await browser.close();
  }
}

async function inTurn<T>(work: () => Promise<T>) {
  if (running >= PARALLEL) await new Promise<void>((r) => waiting.push(r));
  running++;
  try {
    return await work();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

// Captures, stores the image in Blob, and records the result. Runs after the response (next/server `after`).
export async function captureProject(studentId: number, url: string) {
  try {
    const image = await inTurn(() => shoot(url));
    const blob = await put(`captures/${studentId}.webp`, Buffer.from(image), { access: "public", contentType: "image/webp", addRandomSuffix: true });
    const old = await finishCapture(studentId, { url: blob.url });
    if (old) await del(old);
  } catch (e) {
    console.error("capture failed", studentId, e);
    await finishCapture(studentId, { error: e instanceof Error ? e.message.slice(0, 200) : "capture failed" });
  }
}
