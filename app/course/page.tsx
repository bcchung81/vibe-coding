import { Band } from "../../components/band";
import { courseGuide } from "../../lib/course-files";

export const metadata = { title: "교육 안내" };

// The two days from docs/00_전체목차.md, period by period
export default function CoursePage() {
  const { days } = courseGuide();

  return (
    <>
      <Band title="교육 안내" lead="이틀 과정의 교시별 커리큘럼입니다." />
      <div className="content">
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
      </div>
    </>
  );
}
