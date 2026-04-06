import { siteUrl } from "@/lib/public-metadata";
import { publicPages, publicSite } from "@/lib/public-site";

function listMarkdownLinks() {
  return [
    publicPages.home,
    publicPages.about,
    publicPages.selfAssembly,
    publicPages.disclaimer,
    publicPages.trust,
    publicPages.privacy,
    publicPages.terms,
  ]
    .map((page) => `- [${page.title}](${siteUrl(page.markdownPath)}) — ${page.description}`)
    .join("\n");
}

export function GET() {
  const body = `# ${publicSite.mark} Context Pack

> ${publicSite.llms.contextSummary}

## Company

- Company: ${publicSite.company.legalName}
- Founder: ${publicSite.company.founder.name}
- Built in: ${publicSite.company.founder.location}

## Live beta truth

- ${publicSite.betaPosture.join("\n- ")}

## Supported inputs

- ${publicSite.supportedInputs.join("\n- ")}

## Live loop

${publicSite.loop.map((step) => `- **${step.title}** — ${step.body}`).join("\n")}

## Operate output

- ${publicSite.operateOutputs.join("\n- ")}

## Related products

${publicSite.relatedProducts
  .map((product) => `- [${product.name}](${product.href}) — ${product.description}`)
  .join("\n")}

## Public pages

${listMarkdownLinks()}

## Policy

- Public site robots policy: search=yes, ai-input=yes, ai-train=no
- The public AI-use policy applies to public site content, not to private user Boxes
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
