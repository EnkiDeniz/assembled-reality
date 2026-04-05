import { siteUrl } from "@/lib/public-metadata";
import { publicPages, publicSite } from "@/lib/public-site";

export function GET() {
  const body = `# ${publicSite.mark}

> ${publicSite.llms.summary}

${publicSite.mark} is built by ${publicSite.company.name}. It is an invite-only, desktop-first workspace for solo operators.

## Key pages

- [Home](${siteUrl(publicPages.home.markdownPath)}): ${publicSite.llms.homeSummary}
- [About](${siteUrl(publicPages.about.markdownPath)}): ${publicSite.llms.aboutSummary}
- [Self-Assembly](${siteUrl(publicPages.selfAssembly.markdownPath)}): ${publicSite.llms.selfAssemblySummary}
- [Trust](${siteUrl(publicPages.trust.markdownPath)}): ${publicSite.llms.trustSummary}
- [Privacy](${siteUrl(publicPages.privacy.markdownPath)}): ${publicSite.llms.privacySummary}
- [Terms](${siteUrl(publicPages.terms.markdownPath)}): ${publicSite.llms.termsSummary}

## Product truth

- ${publicSite.betaPosture.join("\n- ")}

## Optional

- [Expanded context pack](${siteUrl("/llms-ctx.txt")}): ${publicSite.llms.contextSummary}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
