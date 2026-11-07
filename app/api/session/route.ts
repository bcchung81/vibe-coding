import { signedIn } from "../../../lib/auth";

// Whether the admin is looking, for the top bar's menu only (every page and Server Function checks for itself)
export async function GET() {
  return Response.json({ admin: Boolean(await signedIn()) }, { headers: { "Cache-Control": "private, no-store" } });
}
