import { topicCounts } from "../../../../lib/db";

// How many trainees picked each web app topic, for the live counts on /topics. Counts only, no names.
// The CDN keeps one answer for 5 seconds, so every open page polling still costs the database one query per 5 seconds.
export async function GET() {
  return Response.json(
    { counts: await topicCounts() },
    { headers: { "cache-control": "public, max-age=0, s-maxage=5, stale-while-revalidate=5" } },
  );
}
