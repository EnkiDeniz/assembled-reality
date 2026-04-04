import { siteUrl } from "@/lib/public-metadata";

export function GET() {
  const body = `# Content Signals Policy
# As a condition of accessing this website, you agree to abide
# by the following content signals:
# (a) If a content-signal = yes, you may collect content
#     for the corresponding use.
# (b) If a content-signal = no, you may not collect content
#     for the corresponding use.
#
# Signals:
# search — build a search index and show results
#          (not including AI-generated summaries)
# ai-input — use as input to AI models at inference time
#            (e.g., RAG, grounding, AI overviews)
# ai-train — use to train or fine-tune AI models

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Allow: /llms.txt
Allow: /llms-ctx.txt
Allow: /index.md
Allow: /about.md
Allow: /privacy.md
Allow: /terms.md
Allow: /trust.md
Disallow: /api/
Disallow: /workspace
Disallow: /account
Disallow: /library
Disallow: /intro
Disallow: /read
Disallow: /connect

Sitemap: ${siteUrl("/sitemap.xml")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
