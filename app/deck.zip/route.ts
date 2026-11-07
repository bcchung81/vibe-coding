import { zipSync } from "fflate";
import { deckFiles } from "../../lib/starter";

// The day-2 deck starter as one download. Files sit at the top of the zip, so it unzips straight into C:\workspace\deck.
export const dynamic = "force-static";

export function GET() {
  const zip = zipSync(Object.fromEntries(deckFiles().map((f) => [f.path, new Uint8Array(f.data)])));
  return new Response(Buffer.from(zip), {
    headers: { "content-type": "application/zip", "content-disposition": 'attachment; filename="deck.zip"' },
  });
}
