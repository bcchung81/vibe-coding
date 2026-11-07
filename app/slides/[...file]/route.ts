import { SLIDE_FILES, slideFile } from "../../../lib/slides";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SLIDE_FILES).map((path) => ({ file: path.split("/") }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string[] }> }) {
  const file = slideFile((await params).file.join("/"));
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: { "content-type": file.type } });
}
