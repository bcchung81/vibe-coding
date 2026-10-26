import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { listTopics } from "./topics";

// The day-1 starter folder trainees unzip into C:\workspace\vibe and use as their repository.
// Commands are written once in .agents/skills (Codex · Antigravity); Claude Code gets a copy in .claude/skills,
// and the topic cards come from their own folder so each file has one source.
export type StarterFile = { path: string; data: Buffer };

// Fixed to this folder so the server bundle traces only the starter
const ROOT = join(process.cwd(), "docs", "교육생_배포", "vibe");

// Never ship a local install, build output or a key file, even if someone ran the starter in place
export function shipped(name: string) {
  if (["node_modules", ".next", ".vercel", ".DS_Store"].includes(name)) return false;
  return !name.startsWith(".env") || name === ".env.example";
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => shipped(entry.name))
    .flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
}

export function starterFiles(): StarterFile[] {
  const own = walk(ROOT).map((file) => ({ path: relative(ROOT, file).split(sep).join("/"), data: readFileSync(file) }));
  const claude = own.filter((f) => f.path.startsWith(".agents/skills/")).map((f) => ({ ...f, path: f.path.replace(/^\.agents\//, ".claude/") }));
  const topics = listTopics().map((t) => ({ path: `topics/${t.name}`, data: readFileSync(t.path) }));
  return [...own, ...claude, ...topics].sort((a, b) => a.path.localeCompare(b.path));
}
