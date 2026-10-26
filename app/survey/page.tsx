import { SurveyView, type SurveyResults } from "../../components/survey-view";
import { signedIn } from "../../lib/auth";
import { surveyResponses } from "../../lib/db";
import { attends, QUESTIONS, tally, type Day } from "../../lib/survey";

export const metadata = { title: "사전 수요조사 결과" };

const DAYS: Day[] = ["all", "day1", "day2"];

// Counts only for everyone; written answers (8 · 10 · 기타) only on the admin's screen, the one on the projector
export default async function SurveyPage() {
  const admin = Boolean(await signedIn("admin"));
  const responses = await surveyResponses();
  const results = Object.fromEntries(
    DAYS.map((day) => {
      const group = responses.filter((r) => attends(r, day));
      const tallies = QUESTIONS.map((q) => {
        const t = tally(group, q);
        return { ...t, others: admin ? t.others : [], hiddenOthers: admin ? 0 : t.others.length };
      });
      return [day, { count: group.length, tallies }];
    }),
  ) as SurveyResults;
  return <SurveyView results={results} questions={QUESTIONS} admin={admin} />;
}
