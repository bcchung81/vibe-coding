import { readFileSync } from "node:fs";
import { findTopic, listTopics } from "../../../../lib/topics";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return listTopics().map(({ slug }) => ({ slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(topic.path), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(topic.name)}`,
    },
  });
}
