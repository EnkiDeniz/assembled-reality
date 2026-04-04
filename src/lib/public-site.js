import {
  ACTION_LINE,
  COMPANY_NAME,
  PRODUCT_DESCRIPTOR,
  PRODUCT_MARK,
  PRODUCT_NAME,
} from "@/lib/product-language";

const founder = {
  name: "Deniz Sengun",
  title: "Founder",
  location: "New York City",
};

const relatedProducts = [
  {
    name: "GetReceipts",
    href: "https://getreceipts.com",
    description:
      "The evidence layer. Loegos can optionally push receipt drafts there when you connect it.",
  },
  {
    name: "PromiseMe",
    href: "https://promiseme.ai",
    description:
      "The commitment layer in the broader Lakin system. It sits beside Loegos rather than inside the workspace.",
  },
];

const betaPosture = [
  "Invite-only beta",
  "Desktop-first",
  "Solo operator first",
];

const supportedInputs = [
  "PDF",
  "DOCX",
  "Markdown / TXT",
  "Pasted text",
  "Link import",
  "Voice memo capture",
];

const loop = [
  {
    title: "Think",
    body: "Open sources, listen, ask Seven questions, and orient to what is in the Box.",
  },
  {
    title: "Create",
    body: "Stage what matters and shape the working seed from the material you brought in.",
  },
  {
    title: "Operate",
    body: "Run the box-read engine to name Aim, Ground, Bridge, gradient, trust, convergence, and the next move.",
  },
];

const operateOutputs = [
  "Aim",
  "Ground",
  "Bridge",
  "Gradient",
  "Trust floor and ceiling",
  "Convergence state",
  "One next move",
  "Receipt draft",
];

export const publicSite = {
  name: PRODUCT_NAME,
  mark: PRODUCT_MARK,
  actionLine: ACTION_LINE,
  descriptor: PRODUCT_DESCRIPTOR,
  company: {
    name: "Lakin",
    legalName: COMPANY_NAME,
    founder,
  },
  betaPosture,
  supportedInputs,
  loop,
  operateOutputs,
  relatedProducts,
  keywords: [
    "Loegos",
    "Lœgos",
    "box workspace",
    "source material",
    "operate",
    "receipts",
    "proof",
    "desktop-first workbench",
    "solo operator workspace",
  ],
  llms: {
    title: PRODUCT_MARK,
    summary:
      "Loegos is an invite-only, desktop-first workspace for solo operators. It turns source material into a Box you can think in, create from, and read with Operate.",
    homeSummary:
      "Homepage summary of the Box model, the live Think/Create/Operate loop, supported inputs, and the proof model.",
    aboutSummary:
      "What Loegos is, how Boxes and Operate work, and how the product relates to GetReceipts and PromiseMe.",
    trustSummary:
      "Public trust and provenance model, including L1-L3 trust levels and the rule that normalization is not verification.",
    privacySummary:
      "Draft privacy posture covering sign-in, analytics, uploads, AI processing, and optional GetReceipts sync.",
    termsSummary:
      "Draft beta terms covering access, acceptable use, content ownership, third-party services, and output limits.",
    contextSummary:
      "Expanded Loegos context for AI agents, including live beta truth, supported inputs, the trust model, and the public policy pages.",
  },
};

export const publicPages = {
  home: {
    id: "home",
    path: "/",
    markdownPath: "/index.md",
    label: "Home",
    title: PRODUCT_MARK,
    metaTitle: "Loegos",
    description:
      "Loegos is an invite-only, desktop-first workspace for solo operators. It turns source material into a Box you can think in, create from, and read with Operate.",
    quote: "Meaning is an assembled object.",
    lede:
      "Loegos is an invite-only, desktop-first web workbench for solo operators. You bring source material into a Box, shape a seed from it, and run Operate when you need an honest read of where intention and reality meet.",
    sections: [
      {
        title: "The live loop",
        paragraphs: [
          "The user-facing loop in the current product is Think, Create, Operate. That is the public language for how work moves inside a Box.",
        ],
        items: loop,
      },
      {
        title: "Supported inputs in the current beta",
        paragraphs: [
          "The public 1.0 promise is intentionally tight. Loegos currently centers on source material that can support real work without pretending every future modality is equally ready.",
        ],
        bullets: supportedInputs,
      },
      {
        title: "Proof, not just output",
        paragraphs: [
          "Operate is not chat, not summary, and not rewrite. It reads the active Box and returns the minimum structure needed to understand the current position honestly.",
        ],
        bullets: operateOutputs,
        callout: "Receipts start local-first. GetReceipts sync is optional.",
      },
    ],
  },
  about: {
    id: "about",
    path: "/about",
    markdownPath: "/about.md",
    label: "About",
    title: `About ${PRODUCT_MARK}`,
    metaTitle: "About Loegos",
    description:
      "What Loegos is, how the Box and Operate model work, and how the product fits inside the broader Lakin system.",
    quote: "A workspace where thinking becomes testable.",
    lede:
      "Loegos is a workspace for turning source material into a Box you can inspect, shape, and pressure toward proof. It is not just an editor, not just an AI assistant, and not just a receipt system. It is a workbench for closing the gap between what you think and what you do.",
    sections: [
      {
        title: "What the product does",
        paragraphs: [
          "You add supported sources to a Box: documents, pasted notes, links, and voice memos in the current beta. Then you work through the live loop: Think, Create, Operate.",
          "Think helps you orient to the material. Create helps you shape a seed from it. Operate reads the Box and returns the current position in a form that can be checked.",
        ],
        items: loop,
      },
      {
        title: "What happens after Operate",
        paragraphs: [
          "Operate returns three sentences: what you aimed, what is real, and where they meet or do not. In the live product those appear as Aim, Ground, and Bridge, alongside gradient, trust, convergence, and one next move.",
          "If the Box has earned it, you can draft a receipt. If the Box has not earned it, the gap stays visible. The point is not judgment. The point is signal.",
        ],
      },
      {
        title: "The deeper grammar",
        paragraphs: [
          "Loegos has a symbolic layer, but it should sit underneath the practical explanation rather than replace it.",
        ],
        items: [
          {
            title: "△ Aim",
            body: "What was intended or claimed.",
          },
          {
            title: "□ Reality",
            body: "What pushes back, what exists, and what can actually be grounded.",
          },
          {
            title: "œ The weld",
            body: "Where aim and reality fuse tightly enough to travel as a receipt.",
          },
        ],
        callout:
          "Every receipt tracks convergence and trust. In the live beta, trust is surfaced as L1 to L3.",
      },
      {
        title: "Live beta truth",
        paragraphs: [
          "Loegos 1.0 is invite-only, desktop-first, and solo-operator first. The public promise is narrower than the north star on purpose.",
          "The broader product vision is multimodal and multi-human, but the live front door should speak in terms the current product can actually support.",
        ],
        bullets: betaPosture,
      },
      {
        title: "Who builds it",
        paragraphs: [
          `${PRODUCT_MARK} is built by Lakin, a coordination intelligence company based in ${founder.location}. Founded by ${founder.name}.`,
          "Loegos sits inside a larger system. GetReceipts is the evidence layer. PromiseMe is the commitment layer.",
        ],
        items: relatedProducts.map((product) => ({
          title: product.name,
          body: product.description,
        })),
      },
    ],
  },
  privacy: {
    id: "privacy",
    path: "/privacy",
    markdownPath: "/privacy.md",
    label: "Privacy",
    title: "Privacy",
    metaTitle: "Privacy",
    description:
      "Draft privacy note for the Loegos invite-only beta, covering sign-in, analytics, uploaded sources, AI processing, and optional GetReceipts sync.",
    quote: "A working privacy note for the current beta.",
    lede:
      "This is a draft privacy note for the invite-only Loegos beta. It explains the product’s current posture in plain language. It is informative, not attorney-reviewed final policy text.",
    notice:
      "Draft beta policy. The product and this page may change as Loegos matures.",
    sections: [
      {
        title: "How sign-in works",
        paragraphs: [
          "Loegos currently supports Apple sign-in and email magic links when those methods are enabled. Sign-in and session handling run through NextAuth.",
          "Magic links are sent through the configured email provider when that flow is enabled.",
        ],
      },
      {
        title: "What data enters the product",
        paragraphs: [
          "The current beta can store account identity, Box titles, imported source material, working assemblies, and local receipt drafts.",
          "If you connect GetReceipts, Loegos can also store the connection state needed to push receipt drafts outward when you choose to do that.",
        ],
      },
      {
        title: "Analytics and operational data",
        paragraphs: [
          "The app uses Vercel Analytics for product and page-level events. In the current beta this is used to understand usage and failure patterns rather than to build an advertising profile.",
        ],
      },
      {
        title: "AI and speech processing",
        paragraphs: [
          "Some Loegos features rely on external model providers to process source material and generate outputs. In the current product that can include OpenAI-powered reading, transcription, Operate outputs, and related box processing.",
          "Where enabled, voice playback may also use an external speech provider. These flows should be treated as part of the product’s draft AI-processing layer, not as a private local-only system.",
        ],
      },
      {
        title: "Optional GetReceipts sync",
        paragraphs: [
          "GetReceipts is optional. Local receipt drafts can exist without any external sync.",
          "If you connect GetReceipts and choose to push a receipt draft, the relevant draft payload is sent to GetReceipts under that separate service.",
        ],
      },
      {
        title: "Control and deletion in the current beta",
        paragraphs: [
          "The product supports deleting documents and Boxes from inside the workspace. Self-serve account deletion is not yet a first-class live surface.",
          "Because this is still a working beta, removal and retention behavior should be treated as evolving product behavior rather than as a final legal commitment.",
        ],
      },
    ],
  },
  terms: {
    id: "terms",
    path: "/terms",
    markdownPath: "/terms.md",
    label: "Terms",
    title: "Terms",
    metaTitle: "Terms",
    description:
      "Draft terms for the Loegos invite-only beta, covering access, acceptable use, ownership, third-party services, and output limitations.",
    quote: "Working beta terms for the current product.",
    lede:
      "These are draft beta terms for Loegos. They describe the current product posture in plain language. They are not final production terms and should be treated as a working statement of intent.",
    notice:
      "Draft beta terms. Final legal review has not happened in this pass.",
    sections: [
      {
        title: "Beta status",
        paragraphs: [
          "Loegos is an invite-only beta. Access, features, routes, and output behavior may change without the stability guarantees you would expect from a mature public SaaS product.",
        ],
      },
      {
        title: "Your content",
        paragraphs: [
          "You keep ownership of the source material and working content you bring into Loegos.",
          "By using the product, you authorize Loegos to store, process, transform, and transmit that content as needed to operate the beta, including optional integrations and configured AI providers.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "Do not use the beta to break the law, abuse access, interfere with other users, or upload material you do not have the right to process.",
          "Do not rely on the beta as if it were a safety-critical, compliance-complete, or attorney-reviewed system unless and until the product explicitly says that it is.",
        ],
      },
      {
        title: "Third-party services",
        paragraphs: [
          "The current beta may rely on third-party providers for authentication, analytics, email delivery, AI processing, speech, hosting, and optional GetReceipts sync.",
          "Those services operate under their own terms and policies as well as Loegos’s product behavior.",
        ],
      },
      {
        title: "Output limitations",
        paragraphs: [
          "Operate, Seven, transcription, image interpretation, and other generated outputs are tools for judgment, not replacements for judgment.",
          "Receipts, summaries, and AI-assisted outputs should be checked against the underlying sources before you treat them as external proof or operational truth.",
        ],
      },
      {
        title: "No warranty",
        paragraphs: [
          "The beta is provided as-is and may contain failures, omissions, or incorrect output. The product may also suspend or change access while the system is still being shaped.",
        ],
      },
    ],
  },
  trust: {
    id: "trust",
    path: "/trust",
    markdownPath: "/trust.md",
    label: "Trust",
    title: "Trust",
    metaTitle: "Trust",
    description:
      "Public trust and provenance model for Loegos, including L1-L3 trust levels, provenance rules, and the distinction between normalization and verification.",
    quote: "Everything can enter the Box. Not everything carries the same weight.",
    lede:
      "Loegos accepts many kinds of source material, but it does not treat them as equally trustworthy. The point of the trust model is not to exclude signal. The point is to keep the product from rewarding ambiguity with fake confidence.",
    sections: [
      {
        title: "What provenance means",
        paragraphs: [
          "Provenance answers where a source came from, who brought it in, when it was captured, and how it was transformed.",
        ],
        bullets: [
          "Origin method",
          "Author or speaker when available",
          "Importer",
          "Capture time",
          "Source URL",
          "Filename and mime type",
          "Parent source for derived material",
        ],
      },
      {
        title: "The live trust levels",
        paragraphs: [
          "The current product surfaces L1 to L3. Those levels are intentionally modest in the live beta.",
        ],
        items: [
          {
            title: "L1",
            body: "Self-reported, weakly attributed, or minimally grounded material.",
          },
          {
            title: "L2",
            body: "Supporting exhibit-level evidence such as stable links, files with meaningful metadata, or captured media with useful origin context.",
          },
          {
            title: "L3",
            body: "Material that has been meaningfully audited for coherence or provenance inside the current product model.",
          },
        ],
      },
      {
        title: "Normalization is not verification",
        paragraphs: [
          "Loegos can transcribe voice, structure documents, extract text, or describe an image. That makes a source more readable. It does not, by itself, make the source more trustworthy.",
          "Verification changes how much weight a source carries. Normalization only changes how usable it is.",
        ],
      },
      {
        title: "Derived material keeps lineage",
        paragraphs: [
          "Derived material may compress or interpret, but it should not erase the source that produced it. That rule applies to summaries, image descriptions, transcript reductions, and Operate-linked receipt metadata.",
        ],
      },
      {
        title: "Public AI-use policy",
        paragraphs: [
          "The public Loegos site declares a machine-use policy through robots.txt and Content Signals: search indexing is allowed, AI inference input is allowed, and AI training is not allowed.",
          "That policy applies to the public site content surfaces. It does not grant access to private workspace content or override the access controls on user Boxes.",
        ],
      },
    ],
  },
};

export const publicPageOrder = [
  publicPages.home,
  publicPages.about,
  publicPages.trust,
  publicPages.privacy,
  publicPages.terms,
];

export const publicFooterLinks = [
  publicPages.about,
  publicPages.privacy,
  publicPages.terms,
  publicPages.trust,
];

export function getPublicPageByMarkdownPath(pathname = "") {
  const normalized = String(pathname || "").trim().replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized === "index") return publicPages.home;

  return (
    Object.values(publicPages).find((page) => {
      const markdownPath = page.markdownPath.replace(/^\/+|\/+$/g, "");
      const markdownSlug = markdownPath.replace(/\.md$/i, "");
      const pagePath = page.path.replace(/^\/+|\/+$/g, "");

      return (
        markdownPath === normalized ||
        markdownSlug === normalized ||
        pagePath === normalized ||
        page.id === normalized
      );
    }) || null
  );
}

function renderItemsMarkdown(items = []) {
  return items
    .map((item) => `- **${item.title}** — ${item.body}`)
    .join("\n");
}

export function renderPublicPageMarkdown(page) {
  if (!page) return "";

  const parts = [`# ${page.title}`];

  if (page.quote) {
    parts.push(`> ${page.quote}`);
  }

  if (page.lede) {
    parts.push(page.lede);
  }

  if (page.notice) {
    parts.push(`**${page.notice}**`);
  }

  for (const section of page.sections || []) {
    if (section.title) {
      parts.push(`## ${section.title}`);
    }

    if (section.paragraphs?.length) {
      parts.push(section.paragraphs.join("\n\n"));
    }

    if (section.items?.length) {
      parts.push(renderItemsMarkdown(section.items));
    }

    if (section.bullets?.length) {
      parts.push(section.bullets.map((bullet) => `- ${bullet}`).join("\n"));
    }

    if (section.callout) {
      parts.push(`**${section.callout}**`);
    }
  }

  return `${parts.filter(Boolean).join("\n\n").trim()}\n`;
}
