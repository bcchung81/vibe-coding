import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { DECK_GITIGNORE, deckFiles, GITIGNORE, shipped, starterFiles } from "./starter";

describe("shipped", () => {
  test.each([
    ["AGENTS.md", true],
    [".gitignore", true],
    [".env.example", true],
    [".env.local", false],
    [".env", false],
    ["node_modules", false],
    [".next", false],
    [".DS_Store", false],
    ["dist", false],
    ["out", false],
  ])("%s → %s", (name, ok) => {
    expect(shipped(name)).toBe(ok);
  });
});

describe("starterFiles", () => {
  const files = starterFiles();
  const paths = files.map((f) => f.path);
  const byPath = new Map(files.map((f) => [f.path, f.data.toString("utf8")]));

  test("has the rules, the start guide and a skeleton that builds on its own", () => {
    for (const p of ["시작하기.md", "AGENTS.md", "package.json", "tsconfig.json", "vercel.json", ".gitignore", ".env.example", "app/page.tsx", "app/api/data/route.ts", "data/snapshot.json"]) {
      expect(paths).toContain(p);
    }
  });

  test("has the three commands where Codex reads them, and no Claude Code copy", () => {
    expect(paths.filter((p) => p.startsWith(".agents/skills/"))).toHaveLength(3);
    expect(paths.some((p) => p.startsWith(".claude/") || p === "CLAUDE.md")).toBe(false);
  });

  test("names each command after its folder", () => {
    for (const p of paths.filter((p) => p.startsWith(".agents/skills/"))) {
      const folder = p.split("/")[2];
      expect(byPath.get(p)).toMatch(new RegExp(`^---\\nname: ${folder}\\n`));
    }
  });

  test("carries the three topic cards", () => {
    expect(paths.filter((p) => p.startsWith("topics/"))).toHaveLength(3);
    expect(paths).toContain("topics/02_공지.md");
  });

  test("keeps the region on Seoul and key files out of git", () => {
    expect(JSON.parse(byPath.get("vercel.json")!).regions).toEqual(["icn1"]);
    expect(byPath.get(".gitignore")).toMatch(/^\.env\*$/m);
  });

  test("ships one .gitignore from code, equal to the folder's copy, keeping installs and builds out too", () => {
    expect(paths.filter((p) => p === ".gitignore")).toHaveLength(1);
    expect(GITIGNORE).toBe(readFileSync(join(process.cwd(), "docs", "교육생_배포", "vibe", ".gitignore"), "utf8"));
    expect(byPath.get(".gitignore")).toBe(GITIGNORE);
    expect(GITIGNORE).toMatch(/^node_modules$/m);
    expect(GITIGNORE).toMatch(/^\.next$/m);
    expect(GITIGNORE).toMatch(/^!\.env\.example$/m);
  });
});

describe("deckFiles", () => {
  const files = deckFiles();
  const paths = files.map((f) => f.path);
  const byPath = new Map(files.map((f) => [f.path, f.data.toString("utf8")]));

  test("has the rules, the start guide, the deck and the three scenes", () => {
    for (const p of ["시작하기.md", "AGENTS.md", "deck-plan.md", "package.json", "index.html", "src/main.js", "src/deck.js", "src/stage.js", "src/params.js", "src/scenes/globe.js", "src/scenes/bars.js", "src/scenes/wave.js", "scripts/export.mjs", ".gitignore"]) {
      expect(paths).toContain(p);
    }
  });

  test("has the three deck commands, each named after its folder", () => {
    const skills = paths.filter((p) => p.startsWith(".agents/skills/"));
    expect(skills.map((p) => p.split("/")[2]).sort()).toEqual(["deck-build", "deck-export", "deck-plan"]);
    for (const p of skills) expect(byPath.get(p)).toMatch(new RegExp(`^---\\nname: ${p.split("/")[2]}\\n`));
  });

  test("pins every package to an exact version", () => {
    const pkg = JSON.parse(byPath.get("package.json")!);
    for (const v of Object.values({ ...pkg.dependencies, ...pkg.devDependencies })) expect(v).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("ships one .gitignore from code, equal to the folder's copy, keeping installs, builds and videos out", () => {
    expect(paths.filter((p) => p === ".gitignore")).toHaveLength(1);
    expect(DECK_GITIGNORE).toBe(readFileSync(join(process.cwd(), "docs", "교육생_배포", "deck", ".gitignore"), "utf8"));
    expect(byPath.get(".gitignore")).toBe(DECK_GITIGNORE);
    expect(paths.some((p) => /^(node_modules|dist|out)\//.test(p))).toBe(false);
  });
});
