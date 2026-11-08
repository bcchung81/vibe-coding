import { describe, expect, test } from "vitest";
import { SLIDE_FILES, slideFile, slidesPage } from "./slides";

describe("slidesPage", () => {
  test("points the deck's stylesheet and script at /slides", () => {
    expect(slidesPage('<link rel="stylesheet" href="slides.css"><script src="slides.js"></script>')).toBe('<link rel="stylesheet" href="/slides/slides.css"><script src="/slides/slides.js"></script>');
  });

  test("serves the cover and its local Three.js bundle through the hub", () => {
    const html = slidesPage();
    for (const file of ["cover.js", "vendor/three.min.js"]) {
      expect(html).toContain(`src="/slides/${file}"`);
      expect(html).not.toContain(`src="${file}"`);
      expect(slideFile(file)?.type).toBe("text/javascript; charset=utf-8");
    }
    expect(slideFile("vendor/THREE-LICENSE.txt")?.data.toString()).toContain("MIT");
  });

  test("points the video and its first frame at /slides/video", () => {
    expect(slidesPage('<video src="video/a.mp4" poster="video/a.jpg"></video>')).toBe('<video src="/slides/video/a.mp4" poster="/slides/video/a.jpg"></video>');
  });

  test("leaves no relative stylesheet or script in the real deck", () => {
    const html = slidesPage();
    expect(html).toContain('href="/slides/slides.css"');
    expect(html).toContain('src="/slides/slides.js"');
    expect(html).not.toMatch(/(href|src)="slides\.(css|js)"/);
    expect(html).not.toMatch(/(src|poster)="video\//);
  });
});

describe("slideFile", () => {
  test("serves every file the deck needs, the font licence included", () => {
    for (const [path, type] of Object.entries(SLIDE_FILES)) expect(slideFile(path)?.type).toBe(type);
    expect(Object.keys(SLIDE_FILES).filter((p) => p.startsWith("fonts/OFL-"))).toHaveLength(1);
  });

  test("serves only those files", () => {
    expect(slideFile("발표_시나리오.md")).toBeNull();
    expect(slideFile("../../.env.local")).toBeNull();
  });

  test("every font the stylesheet asks for is served", () => {
    const css = slideFile("slides.css")!.data.toString("utf8");
    for (const [, url] of css.matchAll(/url\("(fonts\/[^"]+)"\)/g)) expect(SLIDE_FILES[url]).toBeDefined();
  });
});
