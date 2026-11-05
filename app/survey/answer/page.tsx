import { cookies } from "next/headers";
import { SurveyForm } from "../../../components/survey-form";
import { signedIn } from "../../../lib/auth";
import { anonSurvey, findStudent, mySurvey } from "../../../lib/db";
import { isSurveyToken, SURVEY_COOKIE } from "../../../lib/survey";

export const metadata = { title: "사전 수요조사" };

// A logged-in trainee answers under their name (one sheet each, which they can change).
// Anyone else answers without a name; this browser's random key lets them change that sheet later.
export default async function SurveyAnswerPage() {
  const session = await signedIn("student");
  const me = session && (await findStudent(session.id));
  if (me) return <SurveyForm name={me.name} saved={await mySurvey(me.id)} />;
  const token = (await cookies()).get(SURVEY_COOKIE)?.value;
  return <SurveyForm name={null} saved={isSurveyToken(token) ? await anonSurvey(token) : null} />;
}
