export const DISCLAIMER_VERSION = "2026-04";
export const DISCLAIMER_ACCEPT_PHRASE = "understand";
export const DISCLAIMER_SUPPORT_EMAIL = "hello@lakin.ai";

export const disclaimerGate = {
  eyebrow: "Before you open the box",
  title: "Stay close to the sources. Keep human judgment in the loop.",
  lede:
    "Loegos is an experimental tool for structuring promises, evidence, and decisions. It can surface uncomfortable mismatches between what you intended, what you believe, and what reality returns.",
  boundary: "Seven infers. Humans interpret. Seal commits. Receipts record.",
  highlights: [
    "Coherence is not truth.",
    "Seven can infer structure and flag contradictions, but it does not decide what matters.",
    "The box can make pressure visible faster than you are ready to act on it.",
  ],
  guidance: [
    "Pause before making major personal, financial, legal, or relationship decisions surfaced by the box.",
    "If the product increases urgency, compulsion, confusion, or isolation, stop and return later.",
    "Talk to someone you trust outside the box if the work starts feeling bigger than your judgment.",
  ],
  consent:
    "I understand Loegos is experimental. Seven may infer, but I am the interpreter of record. I will pause and seek human support if the tool increases distress or urgency.",
  prompt: `Type "${DISCLAIMER_ACCEPT_PHRASE}" to continue`,
  proceedLabel: "Open the box",
  reviewLabel: "Read the full disclaimer",
  deferLabel: "Not now",
  supportLine:
    "This tool is not therapy, diagnosis, emergency support, or a substitute for professional judgment. If you are in crisis or feel unsafe, contact a clinician or your local emergency services.",
};

export const disclaimerPage = {
  id: "disclaimer",
  path: "/disclaimer",
  markdownPath: "/disclaimer.md",
  label: "Disclaimer",
  title: "Disclaimer",
  metaTitle: "Disclaimer",
  description:
    "Experimental-use disclaimer for the current Loegos beta, covering boundaries, human responsibility, and when not to proceed.",
  quote: "Seven infers. Humans interpret. Seal commits.",
  lede:
    "Loegos is an experimental tool for structuring promises, evidence, and decisions. It can surface uncomfortable mismatches between what you intended, what you believe, and what reality returns. Use it only if you can stay close to the sources, pause before acting, and keep human judgment in the loop.",
  notice:
    "Experimental-use notice. This is product guidance for the current beta, not attorney-reviewed final legal language.",
  sections: [
    {
      title: "What this tool does",
      paragraphs: [
        "Loegos helps you write blocks, carry evidence, inspect convergence, and seal receipts. Seven can infer structure, flag contradictions, and run preflight checks across the current box.",
        "The product can make patterns, gaps, and pressure more legible. That is the point of the tool, but it also means the tool may surface things you were not ready to name yet.",
      ],
    },
    {
      title: "What this tool does not do",
      paragraphs: [
        "Loegos does not decide what matters, tell you whether an aim is morally right, or replace human judgment. Seven is an inference agent, not an authority.",
        "The product is not therapy, diagnosis, emergency support, or a substitute for legal, financial, clinical, or relationship advice.",
      ],
    },
    {
      title: "Human responsibility",
      bullets: [
        "Seven may infer. Only humans interpret.",
        "Only humans decide whether a weld is sufficient.",
        "Only humans decide whether a seal should carry commitment.",
        "Coherence is not the same thing as truth.",
      ],
    },
    {
      title: "Use it safely",
      paragraphs: [
        "Stay close to receipts, witnesses, and the underlying sources. If a reading matters, check what the box is actually grounded in before you act on it.",
        "Pause before making major personal, financial, legal, or relationship decisions surfaced by the box. The assembly does not expire.",
        "If the product increases urgency, compulsion, confusion, or isolation, stop and return later. Talk to someone you trust outside the box before treating the output as decisive.",
      ],
    },
    {
      title: "If you need to stop",
      paragraphs: [
        `Close the application. Step away. If you need help or want to report a safety concern, contact ${DISCLAIMER_SUPPORT_EMAIL}.`,
        "If you are in distress, feel unsafe, or think the product is intensifying a mental health episode, stop using it immediately and contact a clinician or your local emergency services.",
      ],
      callout:
        "Proceed only if you understand that the tool can structure and infer, but the human remains the interpreter of record.",
    },
  ],
};
