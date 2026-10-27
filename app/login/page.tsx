import { redirect } from "next/navigation";
import { LoginFlow } from "../../components/login-flow";
import { signedIn } from "../../lib/auth";
import { findStudent } from "../../lib/db";

export const metadata = { title: "로그인" };

// ?next=survey: the survey sent them here, so they go back to it once logged in
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const toSurvey = (await searchParams).next === "survey";
  const session = await signedIn("student");
  const me = session && (await findStudent(session.id));
  if (me && toSurvey) redirect("/survey/answer");
  return <LoginFlow me={me ? { name: me.name, team: me.team } : undefined} toSurvey={toSurvey} />;
}
