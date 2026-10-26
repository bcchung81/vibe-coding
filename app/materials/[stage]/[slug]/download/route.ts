import { readFileSync } from "node:fs";
import { findMaterial, listMaterials } from "../../../../../lib/materials";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return listMaterials().map(({ stage, slug }) => ({ stage, slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ stage: string; slug: string }> }) {
  const { stage, slug } = await params;
  const item = findMaterial(stage, slug);
  if (!item) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(item.path), {
    headers: {
      "content-type": item.kind === "doc" ? "text/markdown; charset=utf-8" : "application/octet-stream",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(item.name)}`,
    },
  });
}
