import { Band } from "../../components/band";
import { Guide } from "../../components/guide";
import { guideItems } from "../../lib/materials";

export const metadata = { title: "자료" };

export default function MaterialsPage() {
  return (
    <div className="materials-page">
      <Band title="교육 자료" lead="사전 준비부터 당일 실습까지, 순서대로 읽고 내려받으세요." action={{ href: "/course", label: "준비할 것 확인" }} />
      <div className="content">
        <Guide items={guideItems()} />
      </div>
    </div>
  );
}
