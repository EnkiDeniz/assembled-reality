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
import {
  CHRONOLOGY_AUTHORITY_LABELS,
  EVIDENCE_BASIS_LABELS,
  LOEGOS_ORIGIN_BOX_SUBTITLE,
  LOEGOS_ORIGIN_BOX_TITLE,
  LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT,
  LOEGOS_ORIGIN_HISTORY_CLUSTER_DEFS,
  LOEGOS_ORIGIN_MILESTONE_DEFS,
  LOEGOS_ORIGIN_MOVE_DEFS,
  LOEGOS_ORIGIN_RECEIPT_SEED,
  LOEGOS_ORIGIN_ROLE_ORDER,
  LOEGOS_ORIGIN_SOURCE_DEFS,
  LOEGOS_ORIGIN_TEMPLATE_ID,
  LOEGOS_ORIGIN_TEMPLATE_VERSION,
  SOURCE_ROLE_LABELS,
  getLoegosSourceClassificationLabel,
} from "@/lib/loegos-origin-template";
import { PRODUCT_MARK } from "@/lib/product-language";
import {
  createSourceProvenanceSeed,
  createSourceTrustProfileSeed,
  SOURCE_MODALITIES,
  SOURCE_ORIGINS,
} from "@/lib/source-model";
import { buildExcerpt } from "@/lib/text";
import { finalizeLaneEntry, LANE_KIND_LABELS, LANE_GROUP_LABELS } from "@/lib/box-view-models";
import {
  annotateWordLayerWithLakinMoments,
  buildWordLayerViewModel,
} from "@/lib/word-layer";

const CORPUS_ROOT_SEGMENTS = ["docs", "LoegosSeed"];
const MARKDOWN_HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;

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
      ? "History export · captured"
      : definition.evidenceBasis === "image-derived-markdown"
        ? "Image-derived · normalized"
        : "Text · preserved";

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
    sourceClassification: definition.sourceClassification || "",
    sourceClassificationLabel: getLoegosSourceClassificationLabel(
      definition.sourceClassification,
    ),
    evidenceBasis: definition.evidenceBasis,
    evidenceBasisLabel: EVIDENCE_BASIS_LABELS[definition.evidenceBasis] || definition.evidenceBasis,
    chronologyAuthority: definition.chronologyAuthority,
    chronologyAuthorityLabel:
      CHRONOLOGY_AUTHORITY_LABELS[definition.chronologyAuthority] || definition.chronologyAuthority,
    occurredAt: definition.occurredAt || "",
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
    LOEGOS_ORIGIN_HISTORY_CLUSTER_DEFS.map((cluster) => [cluster.id, { ...cluster, entries: [] }]),
  );

  (historySource?.historyEntries || []).forEach((entry) => {
    const clusterId = categorizeGitHistoryEntry(entry);
    if (!clusterId || !byId.has(clusterId)) return;
    byId.get(clusterId).entries.push(entry);
  });

  const clusters = LOEGOS_ORIGIN_HISTORY_CLUSTER_DEFS.map((definition) => {
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
  return LOEGOS_ORIGIN_ROLE_ORDER.map((role) => ({
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
      `Open ${PRODUCT_MARK}'s own box and show, in order, how the product moved from naming to proof and then learned to read its own assembly.`,
    whatsHere:
      `The box currently holds ${sourceCount} curated sources, a seven-step image-derived chronology, ${historyCount} normalized Git commits clustered into corroborating software moves, and a later brief that turns vocabulary itself into evidence.`,
    gap:
      "This remains a curated public reconstruction. The origin chapter is strong, but the later continuation is still curated from witnesses and authored interpretation rather than auto-derived from a live historical connector.",
    sealed:
      milestoneCount > 0
        ? "The strongest seal in the public corpus is the prototype-share receipt loop: WhatsApp contact, GetReceipts ledger witness, and sealed receipt detail."
        : "No sealed milestone available yet.",
  };
}

function buildSelfAssemblyWordLayer(sources = [], seed = {}) {
  const currentSeedMoment =
    LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT ||
    LOEGOS_ORIGIN_MOVE_DEFS.find((move) => move.id === "operate-and-seed-first")?.occurredAt ||
    "";
  const seedArtifactTexts = [
    {
      id: "seed-aim",
      title: "Aim",
      text: seed.aim,
      occurredAt: currentSeedMoment,
    },
    {
      id: "seed-whats-here",
      title: "What's here",
      text: seed.whatsHere,
      occurredAt: currentSeedMoment,
    },
    {
      id: "seed-gap",
      title: "The gap",
      text: seed.gap,
      occurredAt: currentSeedMoment,
    },
    {
      id: "seed-sealed",
      title: "Sealed",
      text: seed.sealed,
      occurredAt: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
    },
  ];

  return buildWordLayerViewModel({
    boxTitle: `${PRODUCT_MARK} Self-Assembly Demo`,
    currentSeedDocumentKey: "seed-of-seeds",
    artifacts: [
      ...sources.flatMap((source) =>
        (Array.isArray(source?.blocks) ? source.blocks : [])
          .filter((block) => String(block?.plainText || block?.text || "").trim())
          .map((block, index) => ({
            artifactId: `demo-word-source-${source.id}-${block.id || index + 1}`,
            artifactKind: "source",
            documentKey: source.id,
            occurredAt: block?.createdAt || block?.updatedAt || source.occurredAt || "",
            orderKind:
              block?.createdAt || block?.updatedAt || source.occurredAt ? "explicit" : "inferred",
            authorship: "system_example",
            text: block?.plainText || block?.text || "",
            title: source.title,
            sectionTitle: block?.sectionTitle || "",
          })),
      ),
      ...seedArtifactTexts
        .filter((artifact) => String(artifact.text || "").trim())
        .map((artifact) => ({
          artifactId: `demo-word-${artifact.id}`,
          artifactKind: "seed",
          documentKey: "seed-of-seeds",
          occurredAt: artifact.occurredAt,
          orderKind: artifact.occurredAt ? "explicit" : "inferred",
          authorship: "system_example",
          text: artifact.text,
          title: "Seed of seeds",
          sectionTitle: artifact.title,
        })),
      {
        artifactId: `demo-word-receipt-${LOEGOS_ORIGIN_RECEIPT_SEED.id}`,
        artifactKind: "receipt",
        documentKey: "",
        receiptId: `demo-receipt-${LOEGOS_ORIGIN_RECEIPT_SEED.id}`,
        occurredAt: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
        orderKind: "explicit",
        authorship: "system_example",
        text: [
          LOEGOS_ORIGIN_RECEIPT_SEED.title,
          LOEGOS_ORIGIN_RECEIPT_SEED.note,
          LOEGOS_ORIGIN_RECEIPT_SEED.interpretation,
          LOEGOS_ORIGIN_RECEIPT_SEED.implications,
          LOEGOS_ORIGIN_RECEIPT_SEED.stance,
        ]
          .filter(Boolean)
          .join("\n\n"),
        title: LOEGOS_ORIGIN_RECEIPT_SEED.title,
        sealed: true,
      },
    ],
  });
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
        occurredAt: source.occurredAt || "",
        orderKind: source.occurredAt ? "explicit" : "inferred",
        stageStatus,
        proofStatus,
        evidenceBasis: source.evidenceBasis,
        evidenceBasisLabel: source.evidenceBasisLabel,
        certaintyKind: "inferred",
        trustSummary: `${source.sourceClassificationLabel} · ${source.trustProfile.summary}`,
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

  const moveEntries = LOEGOS_ORIGIN_MOVE_DEFS.map((move, index) =>
    finalizeLaneEntry({
      id: `demo-move-${move.id}`,
      kind: "move",
      kindLabel: LANE_KIND_LABELS.move,
      title: move.title,
      detail: move.detail,
      occurredAt: move.occurredAt || "",
      orderKind: move.occurredAt ? "explicit" : "inferred",
      stageStatus: move.stageStatus || "advanced",
      proofStatus: move.proofStatus || "open",
      evidenceBasis: "curated-move",
      evidenceBasisLabel: "Curated move",
      certaintyKind: "inferred",
      trustSummary: move.detail,
      linkedEntryIds: [],
      linkedSourceKeys: Array.isArray(move.linkedSourceIds) ? move.linkedSourceIds : [],
      linkedSeedDocumentKey: "seed-of-seeds",
      linkedReceiptId:
        move.linkedReceiptId === LOEGOS_ORIGIN_RECEIPT_SEED.id
          ? `demo-receipt-${LOEGOS_ORIGIN_RECEIPT_SEED.id}`
          : "",
      sourceRefs: (Array.isArray(move.linkedSourceIds) ? move.linkedSourceIds : [])
        .map((sourceId) => sources.find((source) => source.id === sourceId))
        .filter(Boolean)
        .map((source) => ({
          documentKey: source.id,
          title: source.title,
        })),
      documentKey: "",
      actionKind: "",
      nextAction: null,
      isLakinMoment: Boolean(move.isLakinMoment),
      pivotPair:
        move.pivotFrom && move.pivotTo
          ? `${String(move.pivotFrom).trim().toLowerCase()} -> ${String(move.pivotTo)
              .trim()
              .toLowerCase()}`
          : "",
      fromTerm: String(move.pivotFrom || "").trim().toLowerCase(),
      toTerm: String(move.pivotTo || "").trim().toLowerCase(),
      lakinSummary: String(move.lakinSummary || "").trim(),
      lakinSource: move.isLakinMoment ? "curated" : "",
      sortIndex: index,
    }),
  );

  const seedEntry = finalizeLaneEntry({
    id: "seed-of-seeds",
    kind: "seed",
    kindLabel: LANE_KIND_LABELS.seed,
    title: "Seed of seeds",
    detail: seed.whatsHere,
    occurredAt: LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT || "",
    orderKind: "explicit",
    stageStatus: "advanced",
    proofStatus: "supported",
    evidenceBasis: "live-assembly",
    evidenceBasisLabel: "Live assembly",
    certaintyKind: "inferred",
    trustSummary: seed.gap,
    linkedEntryIds: [],
    linkedSourceKeys: [...sourceIdsCarriedBySeed],
    linkedSeedDocumentKey: "seed-of-seeds",
    linkedReceiptId: `demo-receipt-${LOEGOS_ORIGIN_RECEIPT_SEED.id}`,
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
      id: `demo-receipt-${LOEGOS_ORIGIN_RECEIPT_SEED.id}`,
      kind: "receipt",
      kindLabel: LANE_KIND_LABELS.receipt,
      title: LOEGOS_ORIGIN_RECEIPT_SEED.title,
      detail: LOEGOS_ORIGIN_RECEIPT_SEED.implications,
      occurredAt: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
      orderKind: "explicit",
      stageStatus: "sealed",
      proofStatus: "sealed",
      evidenceBasis: "proof-closure",
      evidenceBasisLabel: "Proof closure",
      certaintyKind: "inferred",
      trustSummary: LOEGOS_ORIGIN_RECEIPT_SEED.historicalWitness.verifiedSummary,
      linkedEntryIds: [],
      linkedSourceKeys: ["loegos-origin-receipt-arc", historySource?.id].filter(Boolean),
      linkedSeedDocumentKey: "seed-of-seeds",
      linkedReceiptId: `demo-receipt-${LOEGOS_ORIGIN_RECEIPT_SEED.id}`,
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
      entries: [...originEntries, ...moveEntries.filter((entry) => entry.groupId === "origin")],
    },
    {
      id: "assembly",
      label: LANE_GROUP_LABELS.assembly,
      entries: [...moveEntries.filter((entry) => entry.groupId === "assembly"), seedEntry],
    },
    {
      id: "proof",
      label: LANE_GROUP_LABELS.proof,
      entries: [
        ...moveEntries.filter((entry) => entry.groupId === "proof"),
        ...proofEntries,
      ],
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

  const baseEntries = normalizedMoveGroups.flatMap((group) => group.entries);
  const baseWordLayer = buildSelfAssemblyWordLayer(sources, seed);
  const lakinAnnotation = annotateWordLayerWithLakinMoments({
    wordLayer: baseWordLayer,
    laneEntries: baseEntries,
  });
  const entries = Array.isArray(lakinAnnotation?.laneEntries)
    ? lakinAnnotation.laneEntries
    : baseEntries;
  const wordLayer = lakinAnnotation?.wordLayer || baseWordLayer;
  const normalizedSeedEntry = entries.find((entry) => entry.id === "seed-of-seeds") || seedEntry;
  const annotatedMoveGroups = ["origin", "assembly", "proof"]
    .map((groupId) => ({
      id: groupId,
      label: LANE_GROUP_LABELS[groupId],
      entries: entries.filter((entry) => entry.groupId === groupId),
    }))
    .filter((group) => group.entries.length > 0);

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
    wordLayerDefaultExpanded: true,
    wordLayer,
    receiptSummary: {
      sealedDraftCount: 1,
    },
    liveEdge: normalizedSeedEntry,
    resumeTarget: null,
    entries,
    moveGroups: annotatedMoveGroups,
    proofSummary: {
      line: "Proof closure available",
      detail: seed.sealed,
      sealedCount: 1,
    },
  };
}

export const getSelfAssemblyDemo = cache(() => {
  const sources = LOEGOS_ORIGIN_SOURCE_DEFS.map(normalizeSourceDocument);
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  const historySource = sourcesById.get("loegos-git-history") || null;
  const { clusters, clusterMap, unclusteredCount } = buildHistoryClusters(historySource);
  const milestones = LOEGOS_ORIGIN_MILESTONE_DEFS.map((definition) =>
    buildMilestone(definition, sourcesById, clusterMap),
  );
  const seed = buildSeedOfSeeds(sources, historySource, milestones);
  const assemblyLane = buildSelfAssemblyLane(sources, milestones, seed, historySource);

  return {
    templateId: LOEGOS_ORIGIN_TEMPLATE_ID,
    templateVersion: LOEGOS_ORIGIN_TEMPLATE_VERSION,
    title: `${PRODUCT_MARK} Self-Assembly Demo`,
    exampleBoxTitle: LOEGOS_ORIGIN_BOX_TITLE,
    exampleBoxSubtitle: LOEGOS_ORIGIN_BOX_SUBTITLE,
    corpusRoot: path.join(process.cwd(), ...CORPUS_ROOT_SEGMENTS),
    excludedPaths: [
      "git-history/full-commit-history-pre-cleanup.txt",
      "git-history/full-commit-history-2026-04-07.txt",
    ],
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
