import { readFileSync } from "node:fs";
import { join } from "node:path";

// The instructor's deck, served on the hub at /slides straight from its one source folder
// Fixed to this folder so the server bundle traces only the deck
const ROOT = join(process.cwd(), "docs", "발표자료");

// Files the page asks for, with their types — the font licence travels with the font (OFL)
export const SLIDE_FILES: Record<string, string> = {
  "slides.css": "text/css; charset=utf-8",
  "slides.js": "text/javascript; charset=utf-8",
  "cover.js": "text/javascript; charset=utf-8",
  "vendor/three.min.js": "text/javascript; charset=utf-8",
  "vendor/THREE-LICENSE.txt": "text/plain; charset=utf-8",
  "fonts/slides-sans.woff2": "font/woff2",
  "fonts/OFL-Pretendard.txt": "text/plain; charset=utf-8",
  "video/day2-opening.mp4": "video/mp4",
  "video/day2-opening.jpg": "image/jpeg",
};

// The page is served at /slides/deck; absolute /slides/ paths keep its stylesheet, script and video loading wherever it is opened
export function slidesPage(html = readFileSync(join(ROOT, "발표.html"), "utf8")) {
  return html
    .replace('href="slides.css"', 'href="/slides/slides.css"')
    .replace('src="slides.js"', 'src="/slides/slides.js"')
    .replace('src="cover.js"', 'src="/slides/cover.js"')
    .replace('src="vendor/three.min.js"', 'src="/slides/vendor/three.min.js"')
    .replaceAll(/(src|poster)="video\//g, '$1="/slides/video/');
}

export function slideFile(path: string) {
  const type = SLIDE_FILES[path];
  return type ? { type, data: readFileSync(join(ROOT, path)) } : null;
}
