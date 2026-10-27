import { redirect } from "next/navigation";
import { SurveyForm } from "../../../components/survey-form";
import { signedIn } from "../../../lib/auth";
import { findStudent, mySurvey } from "../../../lib/db";

export const metadata = { title: "사전 수요조사" };

// Answering needs the trainee's login (one answer sheet each, which they can change); everyone else logs in first and comes back
export default async function SurveyAnswerPage() {
  const session = await signedIn("student");
  const me = session && (await findStudent(session.id));
  if (!me) redirect("/login?next=survey");
  return <SurveyForm name={me.name} saved={await mySurvey(me.id)} />;
}
