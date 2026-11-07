import { slidesPage } from "../../lib/slides";

// The instructor's deck (docs/발표자료/발표.html). It brings its own look and keys, outside the hub's layout.
export const dynamic = "force-static";

export function GET() {
  return new Response(slidesPage(), { headers: { "content-type": "text/html; charset=utf-8" } });
}
