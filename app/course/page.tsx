import { connection } from "next/server";
import { Band } from "../../components/band";
import { PrepChecklist, type PrepRow } from "../../components/prep-checklist";
import { COURSE_FIELDS } from "../../lib/course";
import { courseGuide } from "../../lib/course-files";
import { courseInfo } from "../../lib/db";

export const metadata = { title: "교육 안내" };

// Before the course: date · place · contact (typed in on the admin screen), the two days from docs/00_전체목차.md,
// and the preparation list from the pre-course notice (00_사전안내.md), filtered by the days one takes part in
export default async function CoursePage() {
  await connection(); // read the admin's values on every visit, not once at build
  const info = await courseInfo();
  const { days, participation, prep } = courseGuide();
  const items: PrepRow[] = prep.map((p) =>
    p.label.includes("웹앱 주제")
      ? { key: p.ref + p.label, label: p.label + " 고르기", day1: p.day1, day2: p.day2, href: "/topics", go: "주제 보기" }
      : { key: p.ref + p.label, label: p.label, day1: p.day1, day2: p.day2, href: p.href, go: `사전안내 ${p.ref}` },
  );

  return (
    <>
      <Band title="교육 안내" lead="참여할 날짜를 고르고, 필요한 준비를 하나씩 마치세요." />
      <div className="content">
        <div className="course-overview">
        <section className="panel" aria-labelledby="info-title">
          <h2 id="info-title">일시 · 장소</h2>
          <dl className="facts">
            {COURSE_FIELDS.map((f) => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd className={info[f.key] ? undefined : "todo"}>{info[f.key] ?? "확정되면 안내"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <PrepChecklist items={items} />
        </div>

        {days.map((d) => (
          <section className="panel" key={d.day} aria-labelledby={`day${d.day}-title`}>
            <div className="panel-head">
              <h2 id={`day${d.day}-title`}>
                {d.day}일차 · {d.title}
              </h2>
              <span className="meta">{d.hours}</span>
            </div>
            <div className="table-wrap">
              <table className="outline">
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>교시</th>
                    <th>하는 일</th>
                    <th>남는 것</th>
                  </tr>
                </thead>
                <tbody>
                  {d.slots.map((s) => (
                    <tr key={s.time} className={s.period ? undefined : "rest"}>
                      <td>{s.time}</td>
                      <td>{s.period ?? ""}</td>
                      <td>
                        {s.title}
                        {s.gain && <span className="note gain">남는 것: {s.gain}</span>}
                      </td>
                      <td>{s.gain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section className="panel" aria-labelledby="who-title">
          <h2 id="who-title">참여 유형별로 남는 것</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>참여</th>
                  <th>남는 것</th>
                </tr>
              </thead>
              <tbody>
                {participation.map((p) => (
                  <tr key={p.who}>
                    <td className="who">{p.who}</td>
                    <td>{p.gain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </>
  );
}
