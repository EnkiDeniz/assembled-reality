import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

function getBlockId(node, sectionSlug, fallback) {
  const start = node?.position?.start?.offset;
  const end = node?.position?.end?.offset;

  if (typeof start === "number") {
    return typeof end === "number"
      ? `${sectionSlug}-${start}-${end}`
      : `${sectionSlug}-${start}`;
  }

  return `${sectionSlug}-${fallback}`;
}

export default function MarkdownRenderer({ markdown, sectionSlug, className = "" }) {
  return (
    <div className={`markdown-flow ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p({ node, children }) {
            return <p data-block-id={getBlockId(node, sectionSlug, "p")}>{children}</p>;
          },
          blockquote({ node, children }) {
            return (
              <blockquote data-block-id={getBlockId(node, sectionSlug, "blockquote")}>
                {children}
              </blockquote>
            );
          },
          li({ node, children }) {
            return <li data-block-id={getBlockId(node, sectionSlug, "li")}>{children}</li>;
          },
          table({ node, children }) {
            return (
              <div className="table-wrap" data-block-id={getBlockId(node, sectionSlug, "table")}>
                <table>{children}</table>
              </div>
            );
          },
          hr({ node }) {
            return <hr data-block-id={getBlockId(node, sectionSlug, "hr")} />;
          },
          a({ href, children }) {
            return (
              <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
