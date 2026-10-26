import { readFileSync } from "node:fs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band } from "../../../../components/band";
import { DocNav } from "../../../../components/doc-nav";
import { Handout } from "../../../../components/handout";
import { findMaterial, listMaterials } from "../../../../lib/materials";

type Params = { stage: string; slug: string };

// Every handout is known at build time
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return listMaterials().map(({ stage, slug }) => ({ stage, slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { stage, slug } = await params;
  return { title: findMaterial(stage, slug)?.title };
}

export default async function MaterialPage({ params }: { params: Promise<Params> }) {
  const { stage, slug } = await params;
  const item = findMaterial(stage, slug);
  if (!item) notFound();
  const download = `/materials/${stage}/${slug}/download`;

  return (
    <>
      <Band
        title={item.kind === "doc" ? item.title : `다음: ${item.short} 내려받기`}
        lead={`${item.stage} · ${item.stageTitle} · ${item.name}`}
        action={item.kind === "file" ? { href: download, label: "내려받기", download: item.name } : undefined}
      />
      <div className="content wide">
        <div className="tools">
          <Link className="ghost" href="/">
            ← 자료 목록
          </Link>
          {item.kind === "doc" && (
            <a className="ghost" href={download} download={item.name}>
              {item.name} 내려받기
            </a>
          )}
        </div>
        {item.kind === "doc" && (
          // the band already shows the document's first heading
          <Handout body={readFileSync(item.path, "utf8").replace(/^# .+\n/, "")} readKey={`${stage}/${slug}`} />
        )}
        {item.kind === "file" && <DocNav readKey={`${stage}/${slug}`} toc={[]} />}
      </div>
    </>
  );
}
