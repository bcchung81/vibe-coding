import { Band } from "../components/band";
import { DemoNote } from "../components/demo-note";
import { GalleryWall } from "../components/gallery-view";
import { Guide } from "../components/guide";
import { guideItems } from "../lib/materials";
import { topicItems } from "../lib/topics";

// Gallery first: everyone's sites are the page, preparation waits in a drawer above them
export default function Home() {
  return (
    <>
      <Band title="우리가 만든 작은 쓸모" lead="서로의 사이트를 열고, 마음에 드는 아이디어에 좋아요." action={{ href: "/me", label: "내 사이트 올리기" }} />
      <DemoNote />
      <div className="content">
        <Guide items={guideItems()} topics={topicItems()} drawer />
        <GalleryWall />
      </div>
    </>
  );
}
