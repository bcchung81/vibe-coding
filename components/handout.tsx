import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { DocNav } from "./doc-nav";

// "## 제목" lines become anchors named by their line number, matching what react-markdown reports
const sectionId = (line: number) => `s${line}`;

// A markdown handout with its contents list, reading progress and a copy button on each code block
export function Handout({ body, readKey }: { body: string; readKey: string }) {
  const toc = body
    .split("\n")
    .flatMap((line, i) => (line.startsWith("## ") ? [{ id: sectionId(i + 1), text: line.slice(3).replace(/[`*]/g, "") }] : []));

  return (
    <div className="doc">
      <DocNav readKey={readKey} toc={toc} />
      <article className="prose">
        <Markdown
          // "13:30~17:00" is a time range, not strikethrough: only ~~ strikes
          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
          components={{
            h2: ({ node, ...props }) => <h2 id={sectionId(node?.position?.start.line ?? 0)} {...props} />,
            pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          }}
        >
          {body}
        </Markdown>
      </article>
    </div>
  );
}
