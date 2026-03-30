import type { Metadata } from 'next';

type NavLink = {
  href: string;
  label: string;
};

type ExternalLink = {
  href: string;
  label: string;
};

type SocialLink = ExternalLink & {
  kind: 'x' | 'linkedin' | 'youtube' | 'instagram';
};

type ProductCard = {
  href: string;
  name: string;
  label: string;
  description: string;
};

type ProofOption = {
  description: string;
  href: string;
  name: string;
  status: string;
};

type Founder = {
  id: string;
  name: string;
};

export const siteConfig = {
  name: 'LAKIN',
  legalName: 'LAKIN AI',
  tagline: 'The Physics Engine for Intelligence',
  defaultTitle: 'LAKIN — The Physics Engine for Intelligence',
  titleTemplate: '%s | LAKIN',
  baseUrl: 'https://lakin.ai',
  ogImagePath: '/og-image.png',
  locale: 'en_US',
  themeColor: '#06060a',
  twitterHandle: '@laaboratories',
  googleSiteVerification: 'YlpILei-zWvr8smlOJVfA502nqR6x-01ouAxgJ60FEE',
  description:
    'AI made everything possible. LAKIN makes it provable. The physics engine for intelligence — turning claims into sealed receipts with verifiable proof that signals touched reality.',
  keywords: [
    'AI verification',
    'AI provability',
    'AI infrastructure',
    'proof of intelligence',
    'verifiable AI',
    'AI hallucination prevention',
    'sealed receipts',
    'claims verification',
    'enterprise AI',
    'AI trust infrastructure',
    'local-first AI',
    'edge computing',
    'assembly theory',
    'assembly theory coordination',
    'proof of assembly',
    'coordination verification',
    'coordination measurement',
    'friction measurement',
    'trust verification',
    'echo vs silence',
    'touched vs untouched',
    'LAKIN',
    'GetReceipts',
    'Box7',
    'Box9',
  ],
  navLinks: [
    { href: '/learn', label: 'Learn' },
    { href: '/developers', label: 'Developers' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ] satisfies NavLink[],
  primaryCta: {
    href: '/#join',
    label: 'Join Private Beta',
  },
  founders: [
    { id: 'deniz-sengun', name: 'Deniz Sengun' },
    { id: 'kerem-ciritci', name: 'Kerem Ciritci' },
    { id: 'melih-odemis', name: 'Melih Odemis' },
  ] satisfies Founder[],
  footer: {
    brandLine: 'LAKIN — The Physics Engine for Intelligence',
    links: [
      { href: 'https://lakin.ai', label: 'lakin.ai' },
      { href: 'https://getreceipts.com', label: 'getreceipts.com' },
      { href: 'https://box7.ai', label: 'box7.ai' },
      { href: 'https://box9.ai', label: 'box9.ai' },
    ] satisfies ExternalLink[],
    socials: [
      { kind: 'x', href: 'https://x.com/laaboratories', label: 'X (Twitter)' },
      {
        kind: 'linkedin',
        href: 'https://www.linkedin.com/company/lakin-ai',
        label: 'LinkedIn',
      },
      {
        kind: 'youtube',
        href: 'https://www.youtube.com/@laaboratories',
        label: 'YouTube',
      },
      {
        kind: 'instagram',
        href: 'https://www.instagram.com/lakin.ai/',
        label: 'Instagram',
      },
    ] satisfies SocialLink[],
  },
  home: {
    hero: {
      headlineLine1: 'AI Made Everything Possible.',
      headlineLine2: 'LAKIN Makes It',
      headlineAccent: 'Provable.',
      subhead: 'The verification layer for the age of AI.',
      support:
        'LAKIN turns claims into sealed receipts with proof they touched reality.',
      primaryCta: {
        href: '#join',
        label: 'Get Updates',
      },
      secondaryCta: {
        href: '#mechanism',
        label: 'Learn How',
      },
    },
    problem: {
      sectionLabel: 'The Problem',
      main:
        'AI can now write your quarterly report, your legal brief, your compliance doc, and your apology letter. All of them look real.',
      emphasis: 'None of them prove anything touched reality.',
      kicker: 'You can’t tell what’s real anymore.',
      reframe: 'The problem isn’t generation. It’s verification.',
    },
    mechanism: {
      sectionLabel: 'How It Works',
      steps: [
        {
          glyph: '△',
          name: 'Aim',
          description: 'The claim goes out.',
        },
        {
          glyph: '□',
          name: 'Wall',
          description: 'An independent system pushes back.',
        },
        {
          glyph: '○',
          name: 'Story',
          description: 'Who was there. What they observed.',
        },
        {
          glyph: 'seal',
          name: 'Seal',
          description: 'All three lock. The signal returns.',
        },
      ],
      equations: [
        'Aim + Wall = data.',
        'Aim + Wall + Story = testimony.',
        'Aim + Wall + Story + Seal = receipt.',
      ],
      definition:
        'A receipt is proof that a claim touched an independent system, story surrounded the contact, and the signal came back.',
      definitionEmphasis: 'Not a story about what happened.',
      definitionClose: 'Evidence that it did.',
    },
    productArchitecture: {
      sectionLabel: 'Product Architecture',
      intro:
        'LAKIN is a system, not a single feature. Three products make the loop legible from evidence to reasoning to execution.',
      closer: 'LAKIN is the engine connecting them into one verification system.',
      products: [
        {
          name: 'GetReceipts',
          href: 'https://getreceipts.com',
          label: 'Evidence Layer',
          description:
            'Create, collect, and share receipts that show what happened, what reality said back, and who was there when it did.',
        },
        {
          name: 'Box7',
          href: 'https://box7.ai',
          label: 'Reasoning Layer',
          description:
            'Think with AI grounded in receipts, so the system works from verified evidence instead of polished narrative.',
        },
        {
          name: 'Box9',
          href: 'https://box9.ai',
          label: 'Agent Telemetry',
          description:
            'Instrument agent actions, tool calls, and outcomes so teams can see what actually happened and not just what was reported.',
        },
      ] satisfies ProductCard[],
    },
    whyItMatters: {
      sectionLabel: 'Why It Matters',
      intro:
        'Writing was invented for receipts. The first coordination technology was proof of who owed what to whom. AI made claims infinite. LAKIN rebuilds the receipt layer for the digital age.',
      contrasts: [
        {
          theyHave: 'Stories about trust',
          weHave: 'Receipts with evidence of contact',
        },
        {
          theyHave: 'Optimization without proof',
          weHave: 'Interpretation grounded in receipts',
        },
        {
          theyHave: 'Prediction engines',
          weHave: 'A compass that shows what touched reality',
        },
        {
          theyHave: 'Reputation scores',
          weHave: 'Sealed records of what actually happened',
        },
      ],
      closerTop: 'They have summaries.',
      closerBottom: 'We have receipts.',
    },
    createProof: {
      sectionLabel: 'Create Your Own Proof',
      intro:
        'You can start creating proof now. Use GetReceipts for general evidence, or PromiseMe when the proof begins with a promise between people.',
      options: [
        {
          name: 'GetReceipts',
          href: 'https://getreceipts.com',
          status: 'Live',
          description:
            'Create and share general-purpose receipts when you need proof that a claim touched reality.',
        },
        {
          name: 'PromiseMe',
          href: 'https://promiseme.ai',
          status: 'Public Beta',
          description:
            'Make, seal, and share promises between people when the proof you need starts with a commitment.',
        },
      ] satisfies ProofOption[],
    },
    sovereignty: {
      sectionLabel: 'Sovereignty',
      headlineTop: 'Your receipts are yours.',
      headlineBottom: 'Period.',
      bodyPrefix: 'Every receipt lives on ',
      bodyHighlight: 'your device',
      bodySuffix:
        '. Local-first. Edge-first. Nothing leaves without your consent. LAKIN doesn’t hold your proof — you do. Share what you choose, when you choose, with whom you choose.',
      pills: [
        'Local-first',
        'Edge-first',
        'Consent before compute',
        'Your data, your device',
      ],
    },
    team: {
      sectionLabel: 'The Team',
      leadPrefix: 'Built by infrastructure engineers with ',
      leadHighlight: '$700M+ in prior exits',
      leadSuffix: ' across food delivery, pharma, and enterprise systems.',
      foundersPrefix: 'LAKIN was founded by ',
      foundersHighlight: 'Deniz Sengun, Kerem Ciritci, and Melih Odemis',
      foundersSuffix: '.',
      closeTop: 'We didn’t study coordination failures. We lived them.',
      closeBottom: 'Now we’re building the layer that was always missing.',
    },
    latestWriting: {
      sectionLabel: 'Latest Writing',
      title: 'Recent essays from the proof layer',
      description:
        'Start with the newest thinking on AI verification, trust infrastructure, and how claims touch reality.',
      linkLabel: 'See all posts',
    },
    updates: {
      sectionLabel: 'Updates',
      successTitle: 'Signal received.',
      successMessage: 'We’ll keep you in the loop.',
      headline: 'Get the signal',
      subhead:
        'Product updates, public beta invites, and the occasional proof of progress.',
      subheadClose: 'No noise.',
      placeholder: 'your@email.com',
      errorFallback: 'Something went wrong',
      privacy: 'Unsubscribe anytime. We respect your inbox.',
      createProofPrompt: 'Want to create proof now?',
      createProofLinks: [
        { href: 'https://getreceipts.com', label: 'Try GetReceipts' },
        { href: 'https://promiseme.ai', label: 'join PromiseMe beta' },
      ] satisfies ExternalLink[],
      teamPrompt: 'Ready to bring your team?',
      teamHref: 'mailto:hello@lakin.ai',
      teamLabel: 'Request early access',
      apiSource: 'website-updates',
    },
  },
  blog: {
    indexTitle: 'Thinking',
    indexDescription:
      'Insights on AI verification, Assembly Theory, coordination measurement, and why the distinction between touched and untouched claims is the only one that matters.',
    rssDescription:
      'Essays on AI verification, trust infrastructure, Assembly Theory, and the physics of proof.',
    footerMessage:
      'LAKIN is building the infrastructure to make every claim touchable and every receipt portable.',
    footerLinkLabel: 'Start at getreceipts.com',
    footerLinkHref: 'https://getreceipts.com',
  },
  learn: {
    indexTitle: 'The Canon',
    indexDescription:
      'Understand LAKIN from the ground up — shapes, seals, friction, and the physics of trust. Eight chapters, zero jargon.',
    indexIntro:
      'Eight chapters. From “what is LAKIN?” to the full glossary. Read in order or jump to what matters.',
  },
  developers: {
    title: 'Developers — API & SDK',
    description:
      'Build on the GetReceipts platform. API keys, embeddable receipt cards, and verification — like Stripe, but for proof of work.',
    ogDescription:
      'Build on the GetReceipts platform. Create receipts, embed verified cards, and verify work programmatically.',
  },
  feeds: {
    blogTitle: 'LAKIN Blog',
    blogDescription:
      'Essays on AI verification, trust infrastructure, Assembly Theory, and the physics of proof.',
  },
  llms: {
    title: 'LAKIN',
    summary:
      'LAKIN is the physics engine for intelligence. AI made everything possible — LAKIN makes it provable. It turns claims into sealed receipts with verifiable proof that signals touched reality.',
    contextTitle: 'LAKIN Context Pack',
    contextSummary:
      'Expanded context for AI agents. This file inlines the core canon and recent essays so an agent can understand LAKIN without fetching each page individually.',
    coreProducts: [
      'GetReceipts (getreceipts.com) — the refinery where receipts are created, collected, and shared',
      'Box7 (box7.ai) — AI thinking grounded by receipts, for individuals',
      'Box9 (box9.ai) — receipt-grounded coordination for teams',
    ],
  },
  betaSignup: {
    notifyEmail: 'deniz@box7.ai',
    resendFrom: 'LAKIN Updates <beta@updates.box7.ai>',
    emailSubjectPrefix: 'New Subscriber',
  },
} as const;

export function siteUrl(path = '/') {
  return new URL(path, siteConfig.baseUrl).toString();
}

export function siteAuthor() {
  return { name: siteConfig.name, url: siteConfig.baseUrl };
}

export function defaultOgImage(alt: string = siteConfig.defaultTitle) {
  return {
    url: siteConfig.ogImagePath,
    width: 1024,
    height: 536,
    alt,
    type: 'image/png',
  } as const;
}

export function buildPageMetadata({
  description,
  includeAuthor = false,
  openGraphDescription,
  openGraphTitle,
  path,
  title,
  twitterDescription,
  twitterTitle,
  type = 'website',
}: {
  description: string;
  includeAuthor?: boolean;
  openGraphDescription?: string;
  openGraphTitle?: string;
  path: string;
  title: string;
  twitterDescription?: string;
  twitterTitle?: string;
  type?: 'website' | 'article';
}): Metadata {
  const resolvedUrl = siteUrl(path);
  const resolvedOgTitle = openGraphTitle ?? title;
  const resolvedOgDescription = openGraphDescription ?? description;

  return {
    title,
    description,
    alternates: { canonical: resolvedUrl },
    ...(includeAuthor ? { authors: [siteAuthor()] } : {}),
    openGraph: {
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      url: resolvedUrl,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: [defaultOgImage(title)],
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle ?? resolvedOgTitle,
      description: twitterDescription ?? resolvedOgDescription,
      creator: siteConfig.twitterHandle,
      images: [siteConfig.ogImagePath],
    },
  };
}
