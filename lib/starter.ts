import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { listTopics } from "./topics";

// The day-1 starter folder trainees unzip into C:\workspace\vibe and use as their repository.
// Commands live in .agents/skills, where Codex reads them, and the topic cards come from their own folder
// so each file has one source.
export type StarterFile = { path: string; data: Buffer };

// Fixed to these folders so the server bundle traces only the starters
const ROOT = join(process.cwd(), "docs", "교육생_배포", "vibe");
const DECK_ROOT = join(process.cwd(), "docs", "교육생_배포", "deck");

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

// The day-2 deck folder (C:\workspace\deck) — the same Vercel CLI rule, so its .gitignore also comes from code
export const DECK_GITIGNORE = `node_modules
dist
out
`;

// Never ship a local install, build output or a key file, even if someone ran the starter in place
export function shipped(name: string) {
  if (["node_modules", ".next", ".vercel", "dist", "out", ".DS_Store"].includes(name)) return false;
  return !name.startsWith(".env") || name === ".env.example";
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => shipped(entry.name))
    .flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
}

function folderFiles(root: string, gitignore: string): StarterFile[] {
  return walk(root)
    .map((file) => ({ path: relative(root, file).split(sep).join("/"), data: readFileSync(file) }))
    .filter((f) => f.path !== ".gitignore")
    .concat({ path: ".gitignore", data: Buffer.from(gitignore) });
}

export function starterFiles(): StarterFile[] {
  const own = folderFiles(ROOT, GITIGNORE);
  const topics = listTopics().map((t) => ({ path: `topics/${t.name}`, data: readFileSync(t.path) }));
  return [...own, ...topics].sort((a, b) => a.path.localeCompare(b.path));
}

// The day-2 starter: deck frame, three 3D scenes, three commands and the video export script
export function deckFiles(): StarterFile[] {
  return folderFiles(DECK_ROOT, DECK_GITIGNORE).sort((a, b) => a.path.localeCompare(b.path));
}
