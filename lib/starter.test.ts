import { describe, expect, test } from "vitest";
import { shipped, starterFiles } from "./starter";

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
  ])("%s → %s", (name, ok) => {
    expect(shipped(name)).toBe(ok);
  });
});

describe("starterFiles", () => {
  const files = starterFiles();
  const paths = files.map((f) => f.path);
  const byPath = new Map(files.map((f) => [f.path, f.data.toString("utf8")]));

  test("has the rules, the start guide and a skeleton that builds on its own", () => {
    for (const p of ["시작하기.md", "AGENTS.md", "CLAUDE.md", "package.json", "tsconfig.json", "vercel.json", ".gitignore", ".env.example", "app/page.tsx", "app/api/data/route.ts", "data/snapshot.json"]) {
      expect(paths).toContain(p);
    }
  });

  test("gives Claude Code the same commands as Codex and Antigravity", () => {
    const skills = paths.filter((p) => p.startsWith(".agents/skills/"));
    expect(skills).toHaveLength(5);
    for (const p of skills) {
      expect(byPath.get(p.replace(/^\.agents\//, ".claude/"))).toBe(byPath.get(p));
    }
  });

  test("names each command after its folder", () => {
    for (const p of paths.filter((p) => p.startsWith(".agents/skills/"))) {
      const folder = p.split("/")[2];
      expect(byPath.get(p)).toMatch(new RegExp(`^---\\nname: ${folder}\\n`));
    }
  });

  test("carries the ten topic cards", () => {
    expect(paths.filter((p) => p.startsWith("topics/"))).toHaveLength(10);
    expect(paths).toContain("topics/02_우산.md");
  });

  test("keeps the region on Seoul and key files out of git", () => {
    expect(JSON.parse(byPath.get("vercel.json")!).regions).toEqual(["icn1"]);
    expect(byPath.get(".gitignore")).toMatch(/^\.env\*$/m);
  });
});
