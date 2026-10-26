import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { slugOf } from "./materials";

// Day-1 web app topic cards, one handout per public-data idea.
// The folder has no step number, so the handout list on the home page leaves it out.
export type Topic = { slug: string; name: string; path: string; title: string; summary: string };

// "# 우산 챙겨?" then "> 날씨 · 기상청 단기예보 · 난이도 중"
export function parseTopic(text: string) {
  return { title: text.match(/^# (.+)$/m)?.[1] ?? "", summary: text.match(/^> (.+)$/m)?.[1] ?? "" };
}

// The body under the title and summary lines, which the page shows in the band instead
export function topicBody(text: string) {
  return text.replace(/^# .+\n+(> .+\n)?/, "");
}

// Fixed to this folder so the server bundle traces only the topic cards
const ROOT = join(process.cwd(), "docs", "교육생_배포", "웹앱_주제");

export function listTopics(): Topic[] {
  return readdirSync(ROOT)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const path = join(ROOT, name);
      return { slug: slugOf(name), name, path, ...parseTopic(readFileSync(path, "utf8")) };
    });
}

// What the browser needs to show and pick a topic
export function topicItems() {
  return listTopics().map(({ slug, title, summary }) => ({ slug, title, summary }));
}

export function findTopic(slug: string) {
  return listTopics().find((t) => t.slug === slug);
}
