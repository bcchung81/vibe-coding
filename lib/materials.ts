import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

// Trainee handouts live in this repo; the site lists them so nothing is sent around by hand
export const MATERIALS_DIR = "docs/교육생_배포";

export type Material = {
  stage: string;
  stageTitle: string;
  slug: string;
  name: string;
  path: string;
  kind: "doc" | "file";
  title: string;
  short: string;
};

// "1_교육전_사전안내" → step "1", title "교육전 사전안내"
export function stageOf(folder: string) {
  const m = folder.match(/^(\d+)_(.+)$/);
  return m ? { stage: m[1], title: m[2].replaceAll("_", " ") } : null;
}

// ASCII URL part: "00_사전안내.md" → "00", "AGENTS.global.md" → "AGENTS.global"
export function slugOf(name: string) {
  return name.match(/^(\d+)_/)?.[1] ?? name.slice(0, name.length - extname(name).length);
}

// Plain names for trainees: a list title where the heading or file name says little, and a short name for "다음: ○○"
const NAMES: Record<string, { title?: string; short: string }> = {
  "00_사전안내.md": { short: "사전 안내" },
  "00_환경설정.md": { short: "환경설정 안내" },
  "AGENTS.global.md": { title: "AI 에이전트 공통 규칙", short: "공통 규칙" },
  "setup.ps1": { title: "설치 스크립트", short: "설치 스크립트" },
  "00_보고서도구.md": { short: "보고서 도구 설치" },
};

// Fixed to this folder so the server bundle traces only the handouts, not the whole project
const ROOT = join(process.cwd(), "docs", "교육생_배포");

export function listMaterials(): Material[] {
  return readdirSync(ROOT, { withFileTypes: true })
    .flatMap((dir) => {
      const stage = dir.isDirectory() ? stageOf(dir.name) : null;
      if (!stage) return [];
      return readdirSync(join(ROOT, dir.name))
        .filter((name) => !name.startsWith("."))
        .sort()
        .map((name): Material => {
          const path = join(ROOT, dir.name, name);
          const kind = extname(name) === ".md" ? "doc" : "file";
          const heading = kind === "doc" ? readFileSync(path, "utf8").match(/^# (.+)$/m)?.[1] : undefined;
          const title = NAMES[name]?.title ?? heading ?? name;
          return { stage: stage.stage, stageTitle: stage.title, slug: slugOf(name), name, path, kind, title, short: NAMES[name]?.short ?? title };
        });
    })
    .sort((a, b) => Number(a.stage) - Number(b.stage));
}

// What the browser needs to list the handouts: everything but the file path, keyed "stage/slug" like the reading state
export function guideItems() {
  return listMaterials().map(({ stage, stageTitle, slug, title, short, name, kind }) => ({ key: `${stage}/${slug}`, stage, stageTitle, title, short, name, kind }));
}

export function findMaterial(stage: string, slug: string) {
  return listMaterials().find((m) => m.stage === stage && m.slug === slug);
}
