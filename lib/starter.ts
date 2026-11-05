import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { listTopics } from "./topics";

// The day-1 starter folder trainees unzip into C:\workspace\vibe and use as their repository.
// Commands are written once in .agents/skills (Codex · Antigravity); Claude Code gets a copy in .claude/skills,
// and the topic cards come from their own folder so each file has one source.
export type StarterFile = { path: string; data: Buffer };

// Fixed to this folder so the server bundle traces only the starter
const ROOT = join(process.cwd(), "docs", "교육생_배포", "vibe");

// The Vercel CLI never uploads a file named .gitignore, so the deployed server cannot read the starter's own copy.
// The zip carries this text instead; starter.test.ts keeps it equal to the file in the folder.
export const GITIGNORE = `node_modules
.next
out
.vercel
*.tsbuildinfo
next-env.d.ts

# 키는 .env.local 에만 둔다 — .env.example 만 커밋한다
.env*
!.env.example
`;

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
  const own = walk(ROOT)
    .map((file) => ({ path: relative(ROOT, file).split(sep).join("/"), data: readFileSync(file) }))
    .filter((f) => f.path !== ".gitignore")
    .concat({ path: ".gitignore", data: Buffer.from(GITIGNORE) });
  const claude = own.filter((f) => f.path.startsWith(".agents/skills/")).map((f) => ({ ...f, path: f.path.replace(/^\.agents\//, ".claude/") }));
  const topics = listTopics().map((t) => ({ path: `topics/${t.name}`, data: readFileSync(t.path) }));
  return [...own, ...claude, ...topics].sort((a, b) => a.path.localeCompare(b.path));
}
