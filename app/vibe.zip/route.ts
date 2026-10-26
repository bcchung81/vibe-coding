import { zipSync } from "fflate";
import { starterFiles } from "../../lib/starter";

// The starter folder as one download. Files sit at the top of the zip, so it unzips straight into C:\workspace\vibe.
export const dynamic = "force-static";

export function GET() {
  const zip = zipSync(Object.fromEntries(starterFiles().map((f) => [f.path, new Uint8Array(f.data)])));
  return new Response(Buffer.from(zip), {
    headers: { "content-type": "application/zip", "content-disposition": 'attachment; filename="vibe.zip"' },
  });
}
