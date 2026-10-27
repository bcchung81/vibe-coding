import { signedIn } from "../../../lib/auth";
import { findStudent } from "../../../lib/db";

// Who is looking, for the top bar's menu only (every page and Server Function checks for itself): the trainee's name and team, and whether the admin is in
export async function GET() {
  const [student, admin] = await Promise.all([signedIn("student"), signedIn("admin")]);
  const me = student && (await findStudent(student.id));
  return Response.json({ student: me ? { name: me.name, team: me.team } : null, admin: Boolean(admin) }, { headers: { "Cache-Control": "private, no-store" } });
}
