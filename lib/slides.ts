import { readFileSync } from "node:fs";
import { join } from "node:path";

// The instructor's deck, served on the hub at /slides straight from its one source folder
// Fixed to this folder so the server bundle traces only the deck
const ROOT = join(process.cwd(), "docs", "발표자료");

// Files the page asks for, with their types — the two font licences travel with the fonts (OFL)
export const SLIDE_FILES: Record<string, string> = {
  "slides.css": "text/css; charset=utf-8",
  "slides.js": "text/javascript; charset=utf-8",
  "fonts/slides-sans.woff2": "font/woff2",
  "fonts/deck-mono.woff2": "font/woff2",
  "fonts/OFL-Pretendard.txt": "text/plain; charset=utf-8",
  "fonts/OFL-NanumGothicCoding.txt": "text/plain; charset=utf-8",
};

// The page sits at /slides (no trailing slash), so its relative stylesheet and script would load from the site root
export function slidesPage(html = readFileSync(join(ROOT, "발표.html"), "utf8")) {
  return html.replace('href="slides.css"', 'href="/slides/slides.css"').replace('src="slides.js"', 'src="/slides/slides.js"');
}

export function slideFile(path: string) {
  const type = SLIDE_FILES[path];
  return type ? { type, data: readFileSync(join(ROOT, path)) } : null;
}
