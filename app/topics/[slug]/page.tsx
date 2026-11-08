import { readFileSync } from "node:fs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band } from "../../../components/band";
import { Handout } from "../../../components/handout";
import { TopicPick } from "../../../components/topic-picker";
import { findTopic, listTopics, topicBody } from "../../../lib/topics";

type Params = { slug: string };

// Every topic card is known at build time
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return listTopics().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return { title: findTopic(slug)?.title };
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) notFound();
  const download = `/topics/${slug}/download`;

  return (
    <>
      <Band kicker={`웹앱 주제 ${slug}`} title={topic.title} lead={topic.summary} action={{ href: download, label: "주제 카드 내려받기", download: topic.name }} />
      <div className="content wide">
        <div className="tools">
          <Link className="ghost" href="/topics">
            ← 주제 목록
          </Link>
          <TopicPick slug={slug} />
          {slug === "07" && (
            <Link className="ghost" href="/topics/map">
              지도 시연 보기
            </Link>
          )}
        </div>
        <Handout body={topicBody(readFileSync(topic.path, "utf8"))} readKey={`topics/${slug}`} />
      </div>
    </>
  );
}
