import { cookies } from "next/headers";
import { SurveyForm } from "../../../components/survey-form";
import { signedIn } from "../../../lib/auth";
import { findStudent, surveyByToken } from "../../../lib/db";
import { isSurveyToken, SURVEY_COOKIE } from "../../../lib/survey";

export const metadata = { title: "사전 수요조사" };

// No login: the person types their own name and e-mail. This browser's key fills in what it sent last;
// a trainee who is logged in starts with their roster name.
export default async function SurveyAnswerPage() {
  const token = (await cookies()).get(SURVEY_COOKIE)?.value;
  const sheet = isSurveyToken(token) ? await surveyByToken(token) : null;
  const session = sheet ? null : await signedIn("student");
  const me = session ? await findStudent(session.id) : null;
  return <SurveyForm person={sheet ? { name: sheet.name, email: sheet.email } : { name: me?.name ?? "", email: "" }} saved={sheet?.answers ?? null} />;
}
