import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseOutline, parseParticipation, parsePrep, sectionLines } from "./course";

// Fixed paths so the server bundle traces just these two documents
const OUTLINE = join(process.cwd(), "docs", "00_전체목차.md");
const NOTICE = join(process.cwd(), "docs", "교육생_배포", "1_교육전_사전안내", "00_사전안내.md");

// The handout page of the pre-course notice (lib/materials.ts: stage 1, slug 00)
export const NOTICE_HREF = "/materials/1/00";

// The pre-install script, downloaded straight from the guide (lib/materials.ts: stage 1, slug setup)
export const SETUP_HREF = "/materials/1/setup/download";

export function courseGuide() {
  const outline = readFileSync(OUTLINE, "utf8");
  const notice = readFileSync(NOTICE, "utf8");
  // the handout page drops the title line before numbering (app/materials/[stage]/[slug]/page.tsx), so count the same way
  const sections = sectionLines(notice.replace(/^# .+\n/, ""));
  return {
    days: parseOutline(outline),
    participation: parseParticipation(outline),
    prep: parsePrep(notice).map((p) => ({ ...p, href: `${NOTICE_HREF}#s${sections[p.section] ?? ""}` })),
  };
}
