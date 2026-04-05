import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { parseDocument } from "@/lib/document";
import {
  buildWorkspaceBlocksFromDocument,
  stripMarkdownSyntax,
} from "@/lib/document-blocks";
import {
  normalizeHistoryExportEntries,
  SUPPORTED_HISTORY_EXPORTS,
} from "@/lib/history-normalization";
import { PRODUCT_MARK } from "@/lib/product-language";
import {
  createSourceProvenanceSeed,
  createSourceTrustProfileSeed,
  SOURCE_MODALITIES,
  SOURCE_ORIGINS,
} from "@/lib/source-model";
import { buildExcerpt } from "@/lib/text";
import { finalizeLaneEntry, LANE_KIND_LABELS, LANE_GROUP_LABELS } from "@/lib/box-view-models";

const CORPUS_ROOT_SEGMENTS = ["docs", "First seed"];
const MARKDOWN_HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;

const SOURCE_ROLE_LABELS = Object.freeze({
  "origin-fragment": "Origin fragment",
  theory: "Theory",
  "product-spec": "Product spec",
  "evidence-spine": "Evidence spine",
  "platform-history": "Platform history",
});

const CHRONOLOGY_AUTHORITY_LABELS = Object.freeze({
  primary: "Primary chronology",
  corroborating: "Corroborating chronology",
  contextual: "Contextual",
});

const EVIDENCE_BASIS_LABELS = Object.freeze({
  "direct-text": "Direct text",
  "image-derived-markdown": "Image-derived markdown",
  "platform-export": "Platform export",
});

const SELF_ASSEMBLY_SOURCE_DEFS = Object.freeze([
  {
    id: "words-are-loegos",
    title: "words are lœgos",
    relativePath: "docs/First seed/words are lœgos/words are lœgos.md",
    sourceRole: "origin-fragment",
    evidenceBasis: "direct-text",
    chronologyAuthority: "primary",
  },
  {
    id: "assembled-reality",
    title: "Assembled Reality",
    relativePath: "docs/First seed/# ASSEMBLED REALITY/# ASSEMBLED REALITY.md",
    sourceRole: "theory",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
  },
  {
    id: "operator-sentences",
    title: "Operator Sentences",
    relativePath: "docs/First seed/# Operator Sentences/# Operator Sentences.md",
    sourceRole: "theory",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
  },
  {
    id: "ghost-operator",
    title: "The Ghost Operator",
    relativePath: "docs/First seed/# The Ghost Operator/# The Ghost Operator.md",
    sourceRole: "theory",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
  },
  {
    id: "law-of-the-echo",
    title: "The Law of the Echo",
    relativePath: "docs/First seed/# The Law of the Echo/# The Law of the Echo.md",
    sourceRole: "theory",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
  },
  {
    id: "meaning-operator",
    title: "The Meaning Operator",
    relativePath: "docs/First seed/# The Meaning Operator/# The Meaning Operator.md",
    sourceRole: "theory",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
  },
  {
    id: "monolith-does-not-move",
    title: "A monolith does not move.",
    relativePath: "docs/First seed/A monolith does not move./A monolith does not move..md",
    sourceRole: "theory",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
  },
  {
    id: "echo-canon",
    title: "Echo Canon",
    relativePath: "docs/First seed/ECHO CANON/ECHO CANON.md",
    sourceRole: "theory",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
  },
  {
    id: "loegos-self-assembly-spec",
    title: "Lœgos Self-Assembly Seed Spec",
    relativePath: "docs/First seed/Loegos_Self_Assembly_Seed_Spec_v0.2.md",
    sourceRole: "product-spec",
    evidenceBasis: "direct-text",
    chronologyAuthority: "contextual",
  },
  {
    id: "loegos-origin-receipt-arc",
    title: "Lœgos — Origin, Evolution, Feedback, and Receipt",
    relativePath:
      "docs/First seed/# Lœgos — Origin, Evolution, Feedback, and Receipt/# Lœgos — Origin, Evolution, Feedback, and Receipt.md",
    sourceRole: "evidence-spine",
    evidenceBasis: "image-derived-markdown",
    chronologyAuthority: "primary",
  },
  {
    id: "loegos-git-history",
    title: "Loegos Git history export",
    relativePath:
      "docs/First seed/commit c71b1d6cf6c34916fbc85d08ecfd1bf05371aebf/commit c71b1d6cf6c34916fbc85d08ecfd1bf05371aebf.md",
    sourceRole: "platform-history",
    evidenceBasis: "platform-export",
    chronologyAuthority: "corroborating",
    historyKind: "git-log",
    platform: "github",
  },
]);

const HISTORY_CLUSTER_DEFS = Object.freeze([
  {
    id: "initial-scaffold",
    title: "Initial scaffold and document viewer",
    description:
      "The earliest structural commits that establish the project shell and the first document-viewer form.",
    milestoneIds: ["box-home"],
  },
  {
    id: "collaborative-reader",
    title: "Collaborative reader",
    description:
      "Reader-focused iterations that made the product feel like a shared reading surface rather than a static file.",
    milestoneIds: ["box-home", "document-player"],
  },
  {
    id: "receipt-integration",
    title: "Receipt integration",
    description:
      "Commits that pull proof, GetReceipts, sealing, and receipt-oriented workflows into the product surface.",
    milestoneIds: ["box-home", "receipt-feed", "sealed-receipt"],
  },
  {
    id: "audio-seven-evolution",
    title: "Audio and Seven evolution",
    description:
      "Commits that pushed the reader toward a player through listening, Seven, manuscript, and playback flows.",
    milestoneIds: ["document-player"],
  },
  {
    id: "box-architecture",
    title: "Root, workspace, and box architecture",
    description:
      "Commits where root, workspace chrome, box architecture, and assembly surfaces become explicit product primitives.",
    milestoneIds: ["declare-root"],
  },
]);

const MILESTONE_DEFS = Object.freeze([
  {
    id: "naming",
    label: "Image 1",
    sectionPattern: /^Image 1\b/i,
    supportingSourceIds: ["words-are-loegos"],
    historyClusterIds: [],
    stagedSummary:
      "Select the naming fragment and stage the ligature explanation as the first live seed candidate.",
    sealedSummary: "Not sealed yet. This remains an origin fragment, not a receipt.",
  },
  {
    id: "box-home",
    label: "Image 2",
    sectionPattern: /^Image 2\b/i,
    supportingSourceIds: ["assembled-reality", "loegos-self-assembly-spec"],
    historyClusterIds: ["initial-scaffold", "collaborative-reader", "receipt-integration"],
    stagedSummary:
      "Stage the first visible box grammar: sources, assemblies, receipts, and a next move.",
    sealedSummary: "Not sealed. This is product-state evidence rather than a proof artifact.",
  },
  {
    id: "document-player",
    label: "Image 3",
    sectionPattern: /^Image 3\b/i,
    supportingSourceIds: ["assembled-reality", "operator-sentences"],
    historyClusterIds: ["collaborative-reader", "audio-seven-evolution"],
    stagedSummary:
      "Advance the reader into a player by staging block playback, voiced navigation, and operable source blocks.",
    sealedSummary: "Not sealed. This move shows interaction form, not external proof.",
  },
  {
    id: "declare-root",
    label: "Image 4",
    sectionPattern: /^Image 4\b/i,
    supportingSourceIds: ["loegos-self-assembly-spec", "meaning-operator"],
    historyClusterIds: ["box-architecture"],
    stagedSummary:
      "Stage the architectural turn where the box needs a fixed origin before assembly can move cleanly.",
    sealedSummary: "Not sealed. This is an architectural move, not a receipt event.",
  },
  {
    id: "investor-share",
    label: "Image 5",
    sectionPattern: /^Image 5\b/i,
    supportingSourceIds: ["loegos-self-assembly-spec"],
    historyClusterIds: [],
    stagedSummary:
      "Stage the first outside contact: the prototype is shared, the privacy posture is stated, and reality answers back.",
    sealedSummary: "Contact happened here. The receipt closes in the following moves.",
  },
  {
    id: "receipt-feed",
    label: "Image 6",
    sectionPattern: /^Image 6\b/i,
    supportingSourceIds: ["assembled-reality", "law-of-the-echo"],
    historyClusterIds: ["receipt-integration"],
    stagedSummary:
      "Stage the proof layer as an operational ledger where the share becomes countable, reviewable evidence.",
    sealedSummary:
      "The product share appears in the ledger as a sealed L3 receipt, but this view is still the feed-level witness.",
  },
  {
    id: "sealed-receipt",
    label: "Image 7",
    sectionPattern: /^Image 7\b/i,
    supportingSourceIds: ["assembled-reality", "law-of-the-echo", "loegos-self-assembly-spec"],
    historyClusterIds: ["receipt-integration"],
    stagedSummary:
      "Seal the strongest public proof in the corpus: the tool receipted its own release with attached evidence and verification.",
    sealedSummary:
      "Sealed by the WhatsApp screenshot, AI verification, receipt status, and the visible receipt hash.",
  },
]);

const ROLE_ORDER = Object.freeze([
  "origin-fragment",
  "evidence-spine",
  "platform-history",
  "product-spec",
  "theory",
]);

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function readCorpusFile(relativePath) {
  const filePath = path.join(process.cwd(), ...relativePath.split("/"));
  if (!fs.existsSync(filePath)) {
    throw new Error(`Self-assembly source is missing: ${relativePath}`);
  }

  return {
    filePath,
    raw: fs.readFileSync(filePath, "utf8"),
    stats: fs.statSync(filePath),
  };
}

function normalizeLineEndings(value = "") {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeComparableText(value = "") {
  return stripMarkdownSyntax(String(value || ""))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanHeadingText(text = "") {
  return String(text || "")
    .replace(/[*_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function stripFrontmatter(markdown = "") {
  if (!markdown.startsWith("---\n")) return markdown;
  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex === -1) return markdown;
  return markdown.slice(endIndex + 5).trim();
}

function stripLeadingTitleHeading(markdown = "", title = "") {
  const normalized = String(markdown || "").trim();
  const match = normalized.match(/^#\s+(.+?)\s*(?:\n+|$)/);
  if (!match) return normalized;
  if (cleanHeadingText(match[1]) !== cleanHeadingText(title)) {
    return normalized;
  }
  return normalized.slice(match[0].length).trim();
}

function countWords(text = "") {
  return String(text || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function chooseSectionHeadingLevel(markdown = "", title = "") {
  const headingLevels = String(markdown || "")
    .split("\n")
    .map((line) => line.match(MARKDOWN_HEADING_RE))
    .filter(Boolean)
    .map((match) => ({
      level: match[1].length,
      text: cleanHeadingText(match[2]),
    }));

  const filtered = headingLevels.filter(
    (heading, index) =>
      !(index === 0 && heading.level === 1 && heading.text === cleanHeadingText(title)),
  );

  const levelCounts = filtered.reduce((accumulator, heading) => {
    accumulator[heading.level] = (accumulator[heading.level] || 0) + 1;
    return accumulator;
  }, {});

  if (levelCounts[2]) return 2;
  if ((levelCounts[1] || 0) > 1) return 1;
  if (levelCounts[3]) return 3;
  return null;
}

function buildCanonicalMarkdown({ title, introMarkdown = "", sections = [] }) {
  const parts = [`# ${title}`];

  if (String(introMarkdown || "").trim()) {
    parts.push("", String(introMarkdown).trim());
  }

  sections.forEach((section, index) => {
    parts.push(
      "",
      `## ${index + 1} · ${cleanHeadingText(section.title) || `Section ${index + 1}`}`,
      "",
      String(section.markdown || "").trim() || "No content yet.",
    );
  });

  return parts.join("\n").trim();
}

function structureLooseMarkdown(rawMarkdown = "", titleHint = "") {
  const normalized = stripFrontmatter(normalizeLineEndings(rawMarkdown)).trim();
  const lines = normalized.split("\n");
  const detectedTitle = cleanHeadingText(
    lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, "") || "",
  );
  const title = detectedTitle || titleHint || "Untitled source";
  const sectionLevel = chooseSectionHeadingLevel(normalized, title);

  if (!sectionLevel) {
    const stripped = stripLeadingTitleHeading(normalized, title);
    return {
      title,
      introMarkdown: "",
      sections: [
        {
          title,
          markdown: stripped || detectedTitle || normalized || "No content yet.",
        },
      ],
    };
  }

  let skippedTitle = false;
  let currentSection = null;
  const introLines = [];
  const sections = [];

  lines.forEach((line) => {
    const headingMatch = line.match(MARKDOWN_HEADING_RE);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = cleanHeadingText(headingMatch[2]);

      if (!skippedTitle && level === 1 && headingText === cleanHeadingText(title)) {
        skippedTitle = true;
        return;
      }

      if (level === sectionLevel) {
        if (currentSection) {
          sections.push({
            title: currentSection.title,
            markdown: currentSection.lines.join("\n").trim(),
          });
        }

        currentSection = {
          title: headingText || `Section ${sections.length + 1}`,
          lines: [],
        };
        return;
      }
    }

    if (currentSection) {
      currentSection.lines.push(line);
      return;
    }

    introLines.push(line);
  });

  if (currentSection) {
    sections.push({
      title: currentSection.title,
      markdown: currentSection.lines.join("\n").trim(),
    });
  }

  return {
    title,
    introMarkdown: introLines.join("\n").trim(),
    sections: sections
      .map((section, index) => ({
        title: section.title || `Section ${index + 1}`,
        markdown: section.markdown || "No content yet.",
      }))
      .filter((section) => String(section.markdown || "").trim()),
  };
}

function normalizeGitHistoryExport(definition, rawText = "") {
  const normalizedHistory = normalizeHistoryExportEntries({
    historyKind: definition.historyKind,
    rawText,
  });
  const entries = normalizedHistory.entries;

  const introMarkdown = [
    `This exported Git history is treated as a platform history source for the self-assembly demo.`,
    `It contains ${entries.length} normalized commits and functions as a chronology witness for software evolution rather than as the narrative spine of the box.`,
  ].join("\n\n");

  const sections = entries.map((entry) => ({
    title: entry.title,
    markdown: entry.markdown,
  }));

  const canonicalMarkdown = buildCanonicalMarkdown({
    title: definition.title,
    introMarkdown,
    sections,
  });
  const parsed = parseDocument(canonicalMarkdown, { documentKey: definition.id });
  const blocks = buildWorkspaceBlocksFromDocument(
    {
      ...parsed,
      documentKey: definition.id,
    },
    {
      documentKey: definition.id,
      defaultSourceDocumentKey: definition.id,
      defaultAuthor: "human",
      defaultOperation: "imported",
      defaultSourceType: "source",
    },
  );

  return {
    canonicalMarkdown,
    parsed,
    blocks,
    entries,
    historyKind: normalizedHistory.historyKind || definition.historyKind,
    platform: normalizedHistory.platform || definition.platform,
  };
}

function normalizeSourceDocument(definition) {
  const file = readCorpusFile(definition.relativePath);

  if (definition.historyKind) {
    const normalizedHistory = normalizePlatformHistoryExport(definition, file.raw);
    return buildSourceRecord(definition, file, normalizedHistory);
  }

  const structured = structureLooseMarkdown(file.raw, definition.title);
  const canonicalMarkdown = buildCanonicalMarkdown(structured);
  const parsed = parseDocument(canonicalMarkdown, { documentKey: definition.id });
  const blocks = buildWorkspaceBlocksFromDocument(
    {
      ...parsed,
      documentKey: definition.id,
    },
    {
      documentKey: definition.id,
      defaultSourceDocumentKey: definition.id,
      defaultAuthor: "human",
      defaultOperation: "imported",
      defaultSourceType: "source",
    },
  );

  return buildSourceRecord(definition, file, {
    canonicalMarkdown,
    parsed,
    blocks,
    entries: [],
    historyKind: "",
    platform: "",
  });
}

function normalizePlatformHistoryExport(definition, rawText = "") {
  if (definition.historyKind === "git-log") {
    return normalizeGitHistoryExport(definition, rawText);
  }

  throw new Error(`Unsupported self-assembly history export kind: ${definition.historyKind}`);
}

function buildSourceRecord(definition, file, normalized) {
  const plainText = stripMarkdownSyntax(normalized.canonicalMarkdown);
  const sections = normalized.parsed.sections.map((section, index) => {
    const sectionLabel = `${section.number} · ${section.title}`;
    const blocks = normalized.blocks.filter((block) => block.sectionLabel === sectionLabel);
    return {
      ...section,
      index,
      sectionLabel,
      blocks,
      excerpt: buildExcerpt(
        stripMarkdownSyntax(
          [section.markdown, blocks.map((block) => block.text).join(" ")].join(" "),
        ),
        200,
      ),
    };
  });

  const transformationHistory = [definition.evidenceBasis];
  if (definition.historyKind) {
    transformationHistory.push(`history:${definition.historyKind}`);
  }
  if (definition.evidenceBasis === "image-derived-markdown") {
    transformationHistory.push("derived-from-images");
  }

  const provenance = createSourceProvenanceSeed({
    modality: SOURCE_MODALITIES.text,
    origin: SOURCE_ORIGINS.uploaded,
    captureMethod: definition.evidenceBasis,
    capturedAt: file.stats.mtime.toISOString(),
    sourceLabel: definition.title,
    transformationHistory,
  });

  const trustSummary =
    definition.evidenceBasis === "platform-export"
      ? "Downloaded platform history export. Strong for chronology and change sequence; weaker than receipts for proof."
      : definition.evidenceBasis === "image-derived-markdown"
        ? "Derived markdown witness of screenshots and images. Strong for narrative chronology, but still secondary to raw assets."
        : "Direct text source preserved in the corpus. Useful as contextual or foundational material.";

  const trustProfile = createSourceTrustProfileSeed({
    basis:
      definition.evidenceBasis === "platform-export"
        ? "platform-history-export"
        : definition.evidenceBasis === "image-derived-markdown"
          ? "image-derived-markdown"
          : "direct-text",
    verification: definition.evidenceBasis === "platform-export" ? "captured" : "normalized",
    trustLevelHint: definition.sourceRole === "platform-history" ? "L2" : "L1",
    summary: trustSummary,
  });

  return {
    id: definition.id,
    title: definition.title,
    relativePath: definition.relativePath,
    filePath: file.filePath,
    sourceRole: definition.sourceRole,
    sourceRoleLabel: SOURCE_ROLE_LABELS[definition.sourceRole] || "Source",
    evidenceBasis: definition.evidenceBasis,
    evidenceBasisLabel: EVIDENCE_BASIS_LABELS[definition.evidenceBasis] || definition.evidenceBasis,
    chronologyAuthority: definition.chronologyAuthority,
    chronologyAuthorityLabel:
      CHRONOLOGY_AUTHORITY_LABELS[definition.chronologyAuthority] || definition.chronologyAuthority,
    historyKind: normalized.historyKind || "",
    platform: normalized.platform || "",
    provenance,
    trustProfile,
    parsed: normalized.parsed,
    sections,
    blocks: normalized.blocks,
    rawMarkdown: normalized.canonicalMarkdown,
    excerpt: buildExcerpt(plainText, 180),
    wordCount: countWords(plainText),
    blockCount: normalized.blocks.length,
    sectionCount: normalized.parsed.sections.length,
    historyEntries: normalized.entries || [],
  };
}

function categorizeGitHistoryEntry(entry) {
  const normalizedTitle = String(entry?.title || "").toLowerCase();

  if (/receipt|getreceipts|seal|proof|sync/.test(normalizedTitle)) {
    return "receipt-integration";
  }

  if (/seven|listen|audio|voice|playback|manuscript|listening/.test(normalizedTitle)) {
    return "audio-seven-evolution";
  }

  if (/workspace|box|root|seed|assembly|operate|project home|workspace shell|inline assist/.test(normalizedTitle)) {
    return "box-architecture";
  }

  if (/collaborative|reader|reading|mobile|discoverability|bookmarks|highlights|notes|appendix|authenticated next\.js app|unlock|navigation/.test(normalizedTitle)) {
    return "collaborative-reader";
  }

  if (/initial|initialize|document viewer|scaffold|landing page|homepage|deployable scaffold|book reader/.test(normalizedTitle)) {
    return "initial-scaffold";
  }

  return null;
}

function formatDate(value = "") {
  const parsed = Date.parse(String(value || ""));
  if (Number.isNaN(parsed)) return String(value || "").trim();
  return longDateFormatter.format(new Date(parsed));
}

function formatDateRange(from = "", to = "") {
  if (!from && !to) return "";
  if (from && !to) return formatDate(from);
  if (to && !from) return formatDate(to);
  return `${formatDate(from)} - ${formatDate(to)}`;
}

function buildHistoryClusters(historySource) {
  const byId = new Map(
    HISTORY_CLUSTER_DEFS.map((cluster) => [cluster.id, { ...cluster, entries: [] }]),
  );

  (historySource?.historyEntries || []).forEach((entry) => {
    const clusterId = categorizeGitHistoryEntry(entry);
    if (!clusterId || !byId.has(clusterId)) return;
    byId.get(clusterId).entries.push(entry);
  });

  const clusters = HISTORY_CLUSTER_DEFS.map((definition) => {
    const cluster = byId.get(definition.id) || { ...definition, entries: [] };
    const first = cluster.entries[0] || null;
    const last = cluster.entries[cluster.entries.length - 1] || null;

    return {
      ...cluster,
      commitCount: cluster.entries.length,
      entryIds: cluster.entries.map((entry) => entry.entryId),
      rangeLabel: formatDateRange(first?.occurredAt || "", last?.occurredAt || ""),
      sampleTitles: cluster.entries.slice(0, 4).map((entry) => entry.title),
    };
  });

  const clusteredIds = new Set(
    clusters.flatMap((cluster) => cluster.entries.map((entry) => entry.entryId)),
  );
  const unclusteredCount = (historySource?.historyEntries || []).filter(
    (entry) => !clusteredIds.has(entry.entryId),
  ).length;

  return {
    clusters,
    clusterMap: new Map(clusters.map((cluster) => [cluster.id, cluster])),
    unclusteredCount,
  };
}

function findSection(source, pattern) {
  if (!source) return null;
  const expression =
    pattern instanceof RegExp ? pattern : new RegExp(String(pattern || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return source.sections.find((section) => expression.test(section.title)) || null;
}

function firstBlockMatching(blocks = [], pattern) {
  const expression =
    pattern instanceof RegExp ? pattern : new RegExp(String(pattern || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return (Array.isArray(blocks) ? blocks : []).find((block) => expression.test(block.text || "")) || null;
}

function firstMeaningfulBlock(source) {
  if (!source) return null;
  return source.blocks.find((block) => normalizeComparableText(block.text).length > 0) || null;
}

function toBlockReference(block, label = "") {
  if (!block) return null;
  return {
    blockId: block.id,
    label,
    text: buildExcerpt(block.plainText || block.text, 220),
    sectionTitle: block.sectionTitle || "",
    sourceDocumentKey: block.sourceDocumentKey || block.documentKey || "",
  };
}

function buildMilestone(definition, sourcesById, historyClustersById) {
  const narrativeSource = sourcesById.get("loegos-origin-receipt-arc");
  const narrativeSection = findSection(narrativeSource, definition.sectionPattern);
  const narrativeBlocks = narrativeSection?.blocks || [];
  const descriptiveBlock =
    firstBlockMatching(narrativeBlocks, /what it shows/i) || narrativeBlocks[0] || null;
  const wiringBlock =
    firstBlockMatching(narrativeBlocks, /wiring/i) || narrativeBlocks[1] || descriptiveBlock || null;
  const operatorBlock =
    firstBlockMatching(narrativeBlocks, /operator sentence/i) ||
    narrativeBlocks[narrativeBlocks.length - 1] ||
    null;

  const supportingSources = (definition.supportingSourceIds || [])
    .map((id) => sourcesById.get(id))
    .filter(Boolean)
    .map((source) => {
      const firstBlock = firstMeaningfulBlock(source);
      return {
        id: source.id,
        title: source.title,
        excerpt: source.excerpt,
        relativePath: source.relativePath,
        selectedBlock: toBlockReference(firstBlock, source.title),
      };
    });

  const historyClusters = (definition.historyClusterIds || [])
    .map((clusterId) => historyClustersById.get(clusterId))
    .filter((cluster) => cluster && cluster.commitCount > 0);

  const selectedBlocks = [
    toBlockReference(descriptiveBlock, "Narrative witness"),
    toBlockReference(wiringBlock, "Interpretive witness"),
    ...supportingSources.map((source) => source.selectedBlock),
  ].filter(Boolean);

  return {
    id: definition.id,
    label: definition.label,
    title: narrativeSection?.title || definition.label,
    narrativeSection: {
      title: narrativeSection?.title || "",
      excerpt: narrativeSection?.excerpt || "",
      relativePath: narrativeSource?.relativePath || "",
    },
    selected: selectedBlocks,
    selectedBlockIds: selectedBlocks.map((block) => block.blockId).filter(Boolean),
    stagedSummary: definition.stagedSummary,
    advanced:
      toBlockReference(operatorBlock, "Advanced operator sentence") || {
        blockId: "",
        label: "Advanced operator sentence",
        text: "No operator sentence block was resolved for this milestone.",
        sectionTitle: narrativeSection?.title || "",
        sourceDocumentKey: narrativeSource?.id || "",
      },
    sealedSummary: definition.sealedSummary,
    supportingSources: supportingSources.map((source) => ({
      id: source.id,
      title: source.title,
      excerpt: source.excerpt,
      relativePath: source.relativePath,
    })),
    historyClusters: historyClusters.map((cluster) => ({
      id: cluster.id,
      title: cluster.title,
      description: cluster.description,
      commitCount: cluster.commitCount,
      rangeLabel: cluster.rangeLabel,
      sampleTitles: cluster.sampleTitles,
    })),
  };
}

function buildSourceGroups(sources = []) {
  return ROLE_ORDER.map((role) => ({
    id: role,
    label: SOURCE_ROLE_LABELS[role] || role,
    sources: sources.filter((source) => source.sourceRole === role),
  })).filter((group) => group.sources.length > 0);
}

function buildSeedOfSeeds(sources, historySource, milestones) {
  const sourceCount = sources.length;
  const historyCount = historySource?.historyEntries?.length || 0;
  const milestoneCount = milestones.length;

  return {
    aim:
      `Open ${PRODUCT_MARK}'s own box and show, in order, how the product moved from naming to release receipt.`,
    whatsHere:
      `The box currently holds ${sourceCount} curated sources, a seven-step image-derived chronology, and ${historyCount} normalized Git commits clustered into corroborating software moves.`,
    gap:
      "This remains a curated public reconstruction. The chronology is normalized from markdown witnesses and exports rather than computed from live connectors, and raw screenshots still carry stronger proof than their derived markdown digest.",
    sealed:
      milestoneCount > 0
        ? "The strongest seal in the public corpus is the prototype-share receipt loop: WhatsApp contact, GetReceipts ledger witness, and sealed receipt detail."
        : "No sealed milestone available yet.",
  };
}

function buildSelfAssemblyLane(sources, milestones, seed, historySource) {
  const sourceGroups = buildSourceGroups(sources);
  const sourceIdsCarriedBySeed = new Set(
    milestones.flatMap((milestone) => [
      "loegos-origin-receipt-arc",
      ...milestone.supportingSources.map((source) => source.id),
    ]),
  );
  if (historySource?.id) {
    sourceIdsCarriedBySeed.add(historySource.id);
  }

  const originEntries = sourceGroups.flatMap((group) =>
    group.sources.map((source) => {
      const kind =
        source.sourceRole === "platform-history"
          ? "history-export"
          : source.evidenceBasis === "image-derived-markdown"
            ? "derived-source"
            : "source";
      const carried = sourceIdsCarriedBySeed.has(source.id);
      const stageStatus =
        source.sourceRole === "platform-history"
          ? "staged"
          : carried
            ? "advanced"
            : source.sourceRole === "theory" || source.sourceRole === "product-spec"
              ? "staged"
              : "selected";
      const proofStatus =
        source.sourceRole === "platform-history"
          ? "witness"
          : carried
            ? "supported"
            : "open";

      return finalizeLaneEntry({
        id: `demo-source-${source.id}`,
        kind,
        kindLabel: LANE_KIND_LABELS[kind] || LANE_KIND_LABELS.source,
        title: source.title,
        detail: source.excerpt,
        occurredAt: "",
        orderKind: "inferred",
        stageStatus,
        proofStatus,
        evidenceBasis: source.evidenceBasis,
        evidenceBasisLabel: source.evidenceBasisLabel,
        certaintyKind: "inferred",
        trustSummary: source.trustProfile.summary,
        linkedEntryIds: [],
        linkedSourceKeys: [source.id],
        linkedSeedDocumentKey: carried ? "seed-of-seeds" : "",
        linkedReceiptId: "",
        sourceRefs: [
          {
            documentKey: source.id,
            title: source.title,
          },
        ],
        documentKey: source.id,
        actionKind: "",
        nextAction: null,
      });
    }),
  );

  const assemblyEntries = milestones.map((milestone, index) =>
    finalizeLaneEntry({
      id: `demo-move-${milestone.id}`,
      kind: "move",
      kindLabel: LANE_KIND_LABELS.move,
      title: milestone.title,
      detail: milestone.stagedSummary,
      occurredAt: "",
      orderKind: "inferred",
      stageStatus: milestone.id === "sealed-receipt" ? "sealed" : "advanced",
      proofStatus:
        milestone.id === "sealed-receipt"
          ? "sealed"
          : milestone.id === "receipt-feed" || milestone.id === "investor-share"
            ? "witness"
            : "open",
      evidenceBasis: "curated-move",
      evidenceBasisLabel: "Curated move",
      certaintyKind: "inferred",
      trustSummary: milestone.sealedSummary,
      linkedEntryIds: [],
      linkedSourceKeys: [
        "loegos-origin-receipt-arc",
        ...milestone.supportingSources.map((source) => source.id),
      ],
      linkedSeedDocumentKey: "seed-of-seeds",
      linkedReceiptId:
        milestone.id === "receipt-feed" || milestone.id === "sealed-receipt"
          ? `demo-receipt-${milestone.id}`
          : "",
      sourceRefs: [
        {
          documentKey: "loegos-origin-receipt-arc",
          title: "Lœgos — Origin, Evolution, Feedback, and Receipt",
        },
      ],
      documentKey: "",
      actionKind: "",
      nextAction: null,
      sortIndex: index,
    }),
  );

  const seedEntry = finalizeLaneEntry({
    id: "seed-of-seeds",
    kind: "seed",
    kindLabel: LANE_KIND_LABELS.seed,
    title: "Seed of seeds",
    detail: seed.whatsHere,
    occurredAt: "",
    orderKind: "inferred",
    stageStatus: "advanced",
    proofStatus: "supported",
    evidenceBasis: "live-assembly",
    evidenceBasisLabel: "Live assembly",
    certaintyKind: "inferred",
    trustSummary: seed.gap,
    linkedEntryIds: [],
    linkedSourceKeys: [...sourceIdsCarriedBySeed],
    linkedSeedDocumentKey: "seed-of-seeds",
    linkedReceiptId: "demo-receipt-sealed-receipt",
    sourceRefs: [
      {
        documentKey: "seed-of-seeds",
        title: "Seed of seeds",
      },
    ],
    isLeadingEdge: true,
    documentKey: "seed-of-seeds",
    actionKind: "",
    nextAction: null,
  });

  const proofEntries = [
    finalizeLaneEntry({
      id: "demo-receipt-receipt-feed",
      kind: "receipt",
      kindLabel: LANE_KIND_LABELS.receipt,
      title: "Receipt feed witness",
      detail:
        milestones.find((milestone) => milestone.id === "receipt-feed")?.sealedSummary ||
        "The share is visible in the receipt ledger.",
      occurredAt: "",
      orderKind: "inferred",
      stageStatus: "advanced",
      proofStatus: "witness",
      evidenceBasis: "proof-witness",
      evidenceBasisLabel: "Proof witness",
      certaintyKind: "inferred",
      trustSummary: "The receipt feed witnesses that the share entered a proof surface.",
      linkedEntryIds: [],
      linkedSourceKeys: ["loegos-origin-receipt-arc", historySource?.id].filter(Boolean),
      linkedSeedDocumentKey: "seed-of-seeds",
      linkedReceiptId: "demo-receipt-receipt-feed",
      sourceRefs: [],
      documentKey: "",
      actionKind: "",
      nextAction: null,
    }),
    finalizeLaneEntry({
      id: "demo-receipt-sealed-receipt",
      kind: "receipt",
      kindLabel: LANE_KIND_LABELS.receipt,
      title: "Sealed receipt",
      detail:
        milestones.find((milestone) => milestone.id === "sealed-receipt")?.sealedSummary ||
        seed.sealed,
      occurredAt: "",
      orderKind: "inferred",
      stageStatus: "sealed",
      proofStatus: "sealed",
      evidenceBasis: "proof-closure",
      evidenceBasisLabel: "Proof closure",
      certaintyKind: "inferred",
      trustSummary: seed.sealed,
      linkedEntryIds: [],
      linkedSourceKeys: ["loegos-origin-receipt-arc", historySource?.id].filter(Boolean),
      linkedSeedDocumentKey: "seed-of-seeds",
      linkedReceiptId: "demo-receipt-sealed-receipt",
      sourceRefs: [],
      documentKey: "",
      actionKind: "",
      nextAction: null,
    }),
  ];

  const moveGroups = [
    {
      id: "origin",
      label: LANE_GROUP_LABELS.origin,
      entries: originEntries,
    },
    {
      id: "assembly",
      label: LANE_GROUP_LABELS.assembly,
      entries: [...assemblyEntries, seedEntry],
    },
    {
      id: "proof",
      label: LANE_GROUP_LABELS.proof,
      entries: proofEntries,
    },
  ];

  const entryIdByDocumentKey = new Map();
  moveGroups.forEach((group) => {
    group.entries.forEach((entry) => {
      if (!entry?.documentKey) return;
      const current = entryIdByDocumentKey.get(entry.documentKey) || [];
      current.push(entry.id);
      entryIdByDocumentKey.set(entry.documentKey, current);
    });
  });
  const entryIdByReceiptId = new Map(
    proofEntries
      .filter((entry) => entry?.linkedReceiptId)
      .map((entry) => [entry.linkedReceiptId, entry.id]),
  );

  const normalizedMoveGroups = moveGroups.map((group) => ({
    ...group,
    entries: group.entries.map((entry) =>
      finalizeLaneEntry({
        ...entry,
        linkedEntryIds: [
          ...(Array.isArray(entry?.linkedEntryIds) ? entry.linkedEntryIds : []),
          ...(entry?.linkedSeedDocumentKey
            ? entryIdByDocumentKey.get(entry.linkedSeedDocumentKey) || []
            : []),
          ...(Array.isArray(entry?.linkedSourceKeys)
            ? entry.linkedSourceKeys.flatMap((key) => entryIdByDocumentKey.get(key) || [])
            : []),
          ...(entry?.linkedReceiptId && entryIdByReceiptId.has(entry.linkedReceiptId)
            ? [entryIdByReceiptId.get(entry.linkedReceiptId)]
            : []),
        ].filter((linkedEntryId) => linkedEntryId && linkedEntryId !== entry.id),
      }),
    ),
  }));

  const entries = normalizedMoveGroups.flatMap((group) => group.entries);
  const normalizedSeedEntry = entries.find((entry) => entry.id === "seed-of-seeds") || seedEntry;

  return {
    boxTitle: `${PRODUCT_MARK} Self-Assembly Demo`,
    boxSubtitle: "Curated public reconstruction",
    entryCount: entries.length,
    realSourceCount: sources.length,
    recentWitnessCount: historySource ? 1 : 0,
    confirmationCount: 0,
    confirmationQueue: [],
    root: {
      text: "",
      gloss: "",
      hasRoot: false,
    },
    stateSummary: {
      chipLabel: "Curated demo",
    },
    protocolPosition: "proving",
    protocolStateLabel: "Curated demo",
    contextualAction: null,
    receiptSummary: {
      sealedDraftCount: 1,
    },
    liveEdge: normalizedSeedEntry,
    resumeTarget: null,
    entries,
    moveGroups: normalizedMoveGroups,
    proofSummary: {
      line: "Proof closure available",
      detail: seed.sealed,
      sealedCount: 1,
    },
  };
}

export const getSelfAssemblyDemo = cache(() => {
  const sources = SELF_ASSEMBLY_SOURCE_DEFS.map(normalizeSourceDocument);
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  const historySource = sourcesById.get("loegos-git-history") || null;
  const { clusters, clusterMap, unclusteredCount } = buildHistoryClusters(historySource);
  const milestones = MILESTONE_DEFS.map((definition) =>
    buildMilestone(definition, sourcesById, clusterMap),
  );
  const seed = buildSeedOfSeeds(sources, historySource, milestones);
  const assemblyLane = buildSelfAssemblyLane(sources, milestones, seed, historySource);

  return {
    title: `${PRODUCT_MARK} Self-Assembly Demo`,
    corpusRoot: path.join(process.cwd(), ...CORPUS_ROOT_SEGMENTS),
    excludedPaths: ["full-commit-history.txt"],
    sources,
    sourceGroups: buildSourceGroups(sources),
    milestones,
    seed,
    assemblyLane,
    history: {
      primarySourceId: historySource?.id || "",
      commitCount: historySource?.historyEntries?.length || 0,
      clusters,
      unclusteredCount,
      supportedExports: SUPPORTED_HISTORY_EXPORTS,
    },
  };
});
