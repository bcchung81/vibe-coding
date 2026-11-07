import { describe, expect, test } from "vitest";
import { SLIDE_FILES, slideFile, slidesPage } from "./slides";

describe("slidesPage", () => {
  test("points the deck's stylesheet and script at /slides", () => {
    expect(slidesPage('<link rel="stylesheet" href="slides.css"><script src="slides.js"></script>')).toBe('<link rel="stylesheet" href="/slides/slides.css"><script src="/slides/slides.js"></script>');
  });

  test("leaves no relative stylesheet or script in the real deck", () => {
    const html = slidesPage();
    expect(html).toContain('href="/slides/slides.css"');
    expect(html).toContain('src="/slides/slides.js"');
    expect(html).not.toMatch(/(href|src)="slides\.(css|js)"/);
  });
});

describe("slideFile", () => {
  test("serves every file the deck needs, the font licences included", () => {
    for (const [path, type] of Object.entries(SLIDE_FILES)) expect(slideFile(path)?.type).toBe(type);
    expect(Object.keys(SLIDE_FILES).filter((p) => p.startsWith("fonts/OFL-"))).toHaveLength(2);
  });

  test("serves only those files", () => {
    expect(slideFile("발표_시나리오.md")).toBeNull();
    expect(slideFile("../../.env.local")).toBeNull();
  });

  test("every font the stylesheet asks for is served", () => {
    const css = slideFile("slides.css")!.data.toString("utf8");
    for (const [, url] of css.matchAll(/url\("([^"]+)"\)/g)) expect(SLIDE_FILES[url]).toBeDefined();
  });
});
