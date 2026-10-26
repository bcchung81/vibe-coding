import { Band } from "../../components/band";
import { Guide } from "../../components/guide";
import { guideItems } from "../../lib/materials";
import { topicItems } from "../../lib/topics";

export const metadata = { title: "자료" };

export default function MaterialsPage() {
  return (
    <>
      <Band title="준비 자료" lead="로그인 없이 읽고, 이어서 준비하세요. 열어 본 자료는 이 브라우저가 기억합니다." />
      <div className="content">
        <Guide items={guideItems()} topics={topicItems()} />
      </div>
    </>
  );
}
