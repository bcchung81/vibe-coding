import { redirect } from "next/navigation";
import { MyProject } from "../../components/my-project";
import { signedIn } from "../../lib/auth";
import { findProject, findStudent } from "../../lib/db";

export const metadata = { title: "내 프로젝트" };

// Only a logged-in trainee has a project page; everyone else goes to log in first
export default async function MyProjectPage() {
  const session = await signedIn("student");
  const me = session && (await findStudent(session.id));
  if (!me) redirect("/login");
  return <MyProject me={{ name: me.name, team: me.team }} saved={await findProject(me.id)} />;
}
