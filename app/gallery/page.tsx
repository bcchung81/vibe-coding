import { Band } from "../../components/band";
import { GalleryWall } from "../../components/gallery-view";
import { signedIn } from "../../lib/auth";
import { galleryProjects, likedBy } from "../../lib/db";

export const metadata = { title: "갤러리" };

// The gallery: everyone's sites are the page. What to do before the course is on /course
export default async function GalleryPage() {
  const me = await signedIn("student");
  const projects = await galleryProjects();
  // Before anyone has posted (before the course), the one next step is the course guide
  const band = projects.length
    ? { lead: "사이트를 둘러보고 마음에 드는 아이디어에 좋아요를 눌러 주세요.", action: { href: "/me", label: "내 사이트 올리기" } }
    : { lead: "1일차에 만든 웹앱을 함께 나누는 공간입니다.", action: { href: "/course", label: "교육 안내 보기" } };
  return (
    <>
      <Band kicker="갤러리" title="우리가 만든 작은 쓸모" {...band} />
      <div className="content">
        <GalleryWall projects={projects} liked={me ? await likedBy(me.id) : []} myId={me?.id ?? null} />
      </div>
    </>
  );
}
