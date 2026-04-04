import { getPublicPageByMarkdownPath, renderPublicPageMarkdown } from "@/lib/public-site";

function estimateTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

function markdownResponse(markdown, status = 200) {
  return new Response(markdown, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Markdown-Tokens": String(estimateTokens(markdown)),
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(
  _request,
  { params },
) {
  const resolved = await params;
  const path = Array.isArray(resolved?.path) ? resolved.path.join("/") : "";
  const page = getPublicPageByMarkdownPath(path);

  if (!page) {
    return markdownResponse("# 404\n\nPage not found.\n", 404);
  }

  return markdownResponse(renderPublicPageMarkdown(page));
}
