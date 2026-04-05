import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ASSEMBLY_PRIMARY_TAGS,
  buildAssemblyIndexEvent,
  mergeProjectArchitectureMeta,
  normalizeProjectArchitectureMeta,
} from "@/lib/assembly-architecture";
import { createReadingReceiptDraftForUser } from "@/lib/reader-db";
import { createReaderDocumentForUser } from "@/lib/reader-documents";
import { getReaderProjectForUser } from "@/lib/reader-projects";
import {
  LOEGOS_ORIGIN_BOX_SUBTITLE,
  LOEGOS_ORIGIN_BOX_TITLE,
  LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT,
  LOEGOS_ORIGIN_INTRO_LINE,
  LOEGOS_ORIGIN_MOVE_DEFS,
  LOEGOS_ORIGIN_PROJECT_KEY,
  LOEGOS_ORIGIN_RECEIPT_SEED,
  LOEGOS_ORIGIN_ROOT,
  LOEGOS_ORIGIN_TEMPLATE_ID,
  LOEGOS_ORIGIN_TEMPLATE_VERSION,
  normalizeProjectSystemMeta,
} from "@/lib/loegos-origin-template";
import { DEFAULT_PROJECT_KEY } from "@/lib/project-model";
import { buildSeedMarkdown } from "@/lib/seed-model";
import { getSelfAssemblyDemo } from "@/lib/self-assembly";
import { parseDocument } from "@/lib/document";
import { buildWorkspaceBlocksFromDocument } from "@/lib/document-blocks";
import {
  createAssemblyDocumentForUser,
  deleteWorkspaceDocumentForUser,
} from "@/lib/workspace-documents";

function isExampleProjectMeta(meta = null) {
  const normalized = normalizeProjectArchitectureMeta(meta);
  return normalized.system?.templateId === LOEGOS_ORIGIN_TEMPLATE_ID;
}

function isExampleDocument(document = null) {
  return Boolean(
    document?.sourceProvenance?.systemTemplateId === LOEGOS_ORIGIN_TEMPLATE_ID ||
      document?.seedMeta?.systemTemplateId === LOEGOS_ORIGIN_TEMPLATE_ID,
  );
}

function listRealHistoryDocuments(documents = []) {
  return (Array.isArray(documents) ? documents : []).filter(
    (document) =>
      document?.documentType !== "builtin" &&
      document?.sourceType !== "builtin" &&
      !isExampleDocument(document),
  );
}

function getTemplateState(meta = null) {
  const normalized = normalizeProjectArchitectureMeta(meta);
  const system = normalizeProjectSystemMeta(normalized.system);
  const templateState = system.templates?.[LOEGOS_ORIGIN_TEMPLATE_ID];
  const nextTemplateState =
    templateState && typeof templateState === "object" ? templateState : {};
  return {
    ...nextTemplateState,
    templateVersionApplied:
      Number(nextTemplateState.templateVersionApplied ?? nextTemplateState.templateVersion) || 0,
    dismissedTemplateVersion: Number(nextTemplateState.dismissedTemplateVersion) || 0,
  };
}

function buildTemplateSystemPatch(currentMeta = null, templatePatch = {}) {
  const normalized = normalizeProjectArchitectureMeta(currentMeta);
  const system = normalizeProjectSystemMeta(normalized.system);
  const currentTemplate = getTemplateState(currentMeta);
  return {
    ...system,
    templates: {
      ...system.templates,
      [LOEGOS_ORIGIN_TEMPLATE_ID]: {
        ...currentTemplate,
        templateId: LOEGOS_ORIGIN_TEMPLATE_ID,
        templateVersion: LOEGOS_ORIGIN_TEMPLATE_VERSION,
        templateVersionApplied:
          Number(templatePatch.templateVersionApplied ?? templatePatch.templateVersion) ||
          LOEGOS_ORIGIN_TEMPLATE_VERSION,
        ...templatePatch,
      },
    },
  };
}

async function updateDefaultTemplateStateForUser(userId, templatePatch = {}) {
  const defaultProject = await getReaderProjectForUser(userId, DEFAULT_PROJECT_KEY, {
    createIfMissing: true,
  });
  if (!defaultProject?.id) {
    return null;
  }

  const nextMeta = mergeProjectArchitectureMeta(defaultProject.metadataJson, {
    system: buildTemplateSystemPatch(defaultProject.metadataJson, templatePatch),
  });

  return prisma.readerProject.update({
    where: { id: defaultProject.id },
    data: { metadataJson: nextMeta },
  });
}

async function findExampleProjectRecord(userId) {
  const projects = await prisma.readerProject.findMany({
    where: { userId },
    select: {
      id: true,
      projectKey: true,
      title: true,
      metadataJson: true,
    },
  });

  return (
    projects.find((project) => {
      if (!isExampleProjectMeta(project.metadataJson)) return false;
      const systemMeta = normalizeProjectSystemMeta(
        normalizeProjectArchitectureMeta(project.metadataJson).system,
      );
      return systemMeta.primaryExample !== false;
    }) ||
    projects.find((project) => project.projectKey === LOEGOS_ORIGIN_PROJECT_KEY) ||
    projects.find((project) => isExampleProjectMeta(project.metadataJson)) ||
    null
  );
}

async function ensureUniqueExampleProjectKey(userId) {
  const reservedKey = LOEGOS_ORIGIN_PROJECT_KEY;
  const existingKeys = new Set(
    (
      await prisma.readerProject.findMany({
        where: { userId },
        select: { projectKey: true },
      })
    ).map((project) => project.projectKey),
  );

  if (!existingKeys.has(reservedKey)) {
    return reservedKey;
  }

  let index = 2;
  while (existingKeys.has(`${reservedKey}-${index}`)) {
    index += 1;
  }

  return `${reservedKey}-${index}`;
}

function buildExampleProjectSystemMeta({
  projectKey = LOEGOS_ORIGIN_PROJECT_KEY,
  primaryExample = true,
  exampleLabel = "Example",
  introLine = LOEGOS_ORIGIN_INTRO_LINE,
  sourceDocumentKeys = [],
  sourceDocumentKeysById = {},
  currentAssemblyDocumentKey = "",
  receiptDraftIds = [],
  lastAutoRefreshedAt = null,
} = {}) {
  return {
    templateId: LOEGOS_ORIGIN_TEMPLATE_ID,
    templateVersion: LOEGOS_ORIGIN_TEMPLATE_VERSION,
    templateVersionApplied: LOEGOS_ORIGIN_TEMPLATE_VERSION,
    systemSeeded: true,
    primaryExample,
    sortPriority: primaryExample ? 100 : 0,
    exampleLabel,
    introLine,
    seededProjectKey: projectKey,
    seededAt: new Date().toISOString(),
    sourceDocumentKeys,
    sourceDocumentKeysById,
    currentAssemblyDocumentKey,
    receiptDraftIds,
    userModifiedExample: false,
    userModifiedAt: null,
    lastAutoRefreshedAt: String(lastAutoRefreshedAt || "").trim() || null,
    dismissedTemplateVersion: 0,
  };
}

function getSourceDomain(source) {
  if (source.sourceRole === "platform-history") return "technical";
  if (source.sourceClassification === "proof_witness") return "relational";
  if (source.sourceRole === "product-spec") return "technical";
  return "vision";
}

function getSourcePrimaryTag(source) {
  if (source.sourceClassification === "proof_witness") {
    return ASSEMBLY_PRIMARY_TAGS.evidence;
  }
  if (source.sourceRole === "origin-fragment") {
    return ASSEMBLY_PRIMARY_TAGS.aim;
  }
  return ASSEMBLY_PRIMARY_TAGS.story;
}

function buildSelectedBlocksBySource(demo) {
  const selectedBySource = new Map();

  (Array.isArray(demo?.milestones) ? demo.milestones : []).forEach((milestone) => {
    (Array.isArray(milestone?.selected) ? milestone.selected : []).forEach((blockRef) => {
      const sourceId = String(blockRef?.sourceDocumentKey || "").trim();
      const blockId = String(blockRef?.blockId || "").trim();
      if (!sourceId || !blockId) return;
      const nextSet = selectedBySource.get(sourceId) || new Set();
      nextSet.add(blockId);
      selectedBySource.set(sourceId, nextSet);
    });

    const advancedSourceId = String(milestone?.advanced?.sourceDocumentKey || "").trim();
    const advancedBlockId = String(milestone?.advanced?.blockId || "").trim();
    if (advancedSourceId && advancedBlockId) {
      const nextSet = selectedBySource.get(advancedSourceId) || new Set();
      nextSet.add(advancedBlockId);
      selectedBySource.set(advancedSourceId, nextSet);
    }
  });

  return selectedBySource;
}

function buildSeededSourceBlocks(source, selectedBlockIds = new Set()) {
  const sourceDomain = getSourceDomain(source);
  const sourcePrimaryTag = getSourcePrimaryTag(source);

  return source.blocks.map((block) => {
    const selected = selectedBlockIds.has(block.id);

    return {
      ...block,
      id: "",
      documentKey: "",
      sourceDocumentKey: "",
      sourceTitle: source.title,
      createdAt: source.occurredAt || block.createdAt,
      updatedAt: source.occurredAt || block.updatedAt,
      confirmationStatus: selected ? "confirmed" : "unconfirmed",
      primaryTag: selected ? sourcePrimaryTag : "",
      domain: selected ? sourceDomain : "",
      suggestedPrimaryTag: selected ? sourcePrimaryTag : sourcePrimaryTag,
      suggestedDomain: selected ? sourceDomain : sourceDomain,
    };
  });
}

function buildExampleSeedBlocks(demo, sourceDocumentKeysById) {
  const markdown = buildSeedMarkdown({
    aim: demo.seed.aim,
    whatsHere: demo.seed.whatsHere,
    gap: demo.seed.gap,
    sealed: demo.seed.sealed,
  });
  const parsed = parseDocument(markdown, { documentKey: "seed-of-seeds" });
  const blocks = buildWorkspaceBlocksFromDocument(
    {
      ...parsed,
      documentKey: "seed-of-seeds",
    },
    {
      documentKey: "seed-of-seeds",
      defaultSourceDocumentKey: "seed-of-seeds",
      defaultIsAssemblyBlock: true,
      defaultSourceType: "assembly",
      defaultOperation: "assembled",
    },
  );
  const sourceBySection = {
    Aim: "assembled-reality",
    "What's here": "whats-in-the-box",
    "The gap": "loegos-self-assembly-spec",
    Sealed: "loegos-origin-receipt-arc",
  };

  return blocks.map((block) => {
    const manifestSourceId = sourceBySection[block.sectionTitle] || "assembled-reality";
    const sourceDocumentKey =
      sourceDocumentKeysById.get(manifestSourceId) ||
      sourceDocumentKeysById.get("assembled-reality") ||
      "assembly";
    const sourceTitle =
      demo.sources.find((source) => source.id === manifestSourceId)?.title ||
      "Lœgos origin source";
    const primaryTag =
      block.sectionTitle === "Aim"
        ? ASSEMBLY_PRIMARY_TAGS.aim
        : block.sectionTitle === "Sealed"
          ? ASSEMBLY_PRIMARY_TAGS.evidence
          : ASSEMBLY_PRIMARY_TAGS.story;
    const domain =
      block.sectionTitle === "Sealed"
        ? "completion"
        : block.sectionTitle === "What's here"
          ? "technical"
          : "vision";

    return {
      ...block,
      sourceDocumentKey,
      sourceTitle,
      primaryTag,
      domain,
      confirmationStatus: "confirmed",
      createdAt:
        block.sectionTitle === "Sealed"
          ? LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt
          : LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT || block.createdAt,
      updatedAt:
        block.sectionTitle === "Sealed"
          ? LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt
          : LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT || block.updatedAt,
    };
  });
}

function buildExampleMoveEvents(sourceDocumentKeysById, seedDocumentKey, receiptId) {
  return LOEGOS_ORIGIN_MOVE_DEFS.map((move) => {
    const relatedSourceDocumentKeys = (Array.isArray(move.linkedSourceIds) ? move.linkedSourceIds : [])
      .map((sourceId) => sourceDocumentKeysById.get(sourceId))
      .filter(Boolean);
    const primaryDocumentKey =
      relatedSourceDocumentKeys[0] ||
      seedDocumentKey ||
      "";

    return buildAssemblyIndexEvent("assembly_move", {
      at: move.occurredAt,
      move: move.detail,
      return: move.detail,
      echo: move.id,
      context: {
        title: move.title,
        groupId: move.groupId,
        stageStatus: move.stageStatus,
        proofStatus: move.proofStatus,
        isLakinMoment: Boolean(move.isLakinMoment),
        pivotFrom: String(move.pivotFrom || "").trim().toLowerCase(),
        pivotTo: String(move.pivotTo || "").trim().toLowerCase(),
        lakinSummary: String(move.lakinSummary || "").trim(),
        primaryDocumentKey,
        documentKey: primaryDocumentKey,
        linkedSeedDocumentKey: seedDocumentKey,
        relatedSourceDocumentKeys,
        receiptId:
          move.linkedReceiptId === LOEGOS_ORIGIN_RECEIPT_SEED.id ? receiptId : "",
      },
    });
  });
}

async function createExampleProjectRecord(
  userId,
  {
    projectKey: providedProjectKey = "",
    title = LOEGOS_ORIGIN_BOX_TITLE,
    subtitle = LOEGOS_ORIGIN_BOX_SUBTITLE,
    primaryExample = true,
    exampleLabel = "Example",
    introLine = LOEGOS_ORIGIN_INTRO_LINE,
    lastAutoRefreshedAt = null,
  } = {},
) {
  const projectKey =
    String(providedProjectKey || "").trim() || (await ensureUniqueExampleProjectKey(userId));
  const metadataJson = mergeProjectArchitectureMeta(null, {
    root: {
      text: LOEGOS_ORIGIN_ROOT.text,
      gloss: LOEGOS_ORIGIN_ROOT.gloss,
      createdAt: LOEGOS_ORIGIN_ROOT.occurredAt,
      locked: true,
    },
    assemblyState: {
      manualState: "released",
      updatedAt: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
    },
    stateHistory: [
      {
        state: "rooted",
        at: LOEGOS_ORIGIN_ROOT.occurredAt,
        reason: "Curated root declared for the Lœgos origin example.",
        receiptId: "",
      },
    ],
    system: buildExampleProjectSystemMeta({
      projectKey,
      primaryExample,
      exampleLabel,
      introLine,
      lastAutoRefreshedAt,
    }),
    events: [
      buildAssemblyIndexEvent("root_declared", {
        at: LOEGOS_ORIGIN_ROOT.occurredAt,
        declaration: LOEGOS_ORIGIN_ROOT.text,
        move: "Curated root declared for the Lœgos origin example.",
        return: "The example box now has a fixed line to return to.",
        echo: "curated-origin",
        context: {
          rootText: LOEGOS_ORIGIN_ROOT.text,
          systemTemplateId: LOEGOS_ORIGIN_TEMPLATE_ID,
        },
      }),
    ],
  });

  return prisma.readerProject.create({
    data: {
      userId,
      projectKey,
      title,
      subtitle,
      isPinned: primaryExample,
      metadataJson,
    },
  });
}

async function seedLoegosOriginExampleForUser(
  userId,
  {
    projectKey: providedProjectKey = "",
    title = LOEGOS_ORIGIN_BOX_TITLE,
    subtitle = LOEGOS_ORIGIN_BOX_SUBTITLE,
    primaryExample = true,
    exampleLabel = "Example",
    introLine = LOEGOS_ORIGIN_INTRO_LINE,
    lastAutoRefreshedAt = null,
    updateDefaultTemplateState = true,
  } = {},
) {
  const demo = getSelfAssemblyDemo();
  const selectedBlocksBySource = buildSelectedBlocksBySource(demo);
  const project = await createExampleProjectRecord(userId, {
    projectKey: providedProjectKey,
    title,
    subtitle,
    primaryExample,
    exampleLabel,
    introLine,
    lastAutoRefreshedAt,
  });
  const sourceDocumentKeysById = new Map();
  const seededSourceDocumentKeys = [];

  for (const source of demo.sources) {
    const seededDocument = await createReaderDocumentForUser(userId, {
      title: source.title,
      subtitle: `${source.sourceClassificationLabel} · ${source.sourceRoleLabel}`,
      projectKey: project.projectKey,
      contentMarkdown: source.rawMarkdown,
      blocks: buildSeededSourceBlocks(source, selectedBlocksBySource.get(source.id) || new Set()),
      sourceFiles: [source.relativePath],
      sourceProvenance: {
        ...source.provenance,
        capturedAt: source.occurredAt || source.provenance.capturedAt,
        capturedBy: "system",
        systemTemplateId: LOEGOS_ORIGIN_TEMPLATE_ID,
        exampleSourceClassification: source.sourceClassification,
        exampleSourceClassificationLabel: source.sourceClassificationLabel,
      },
      sourceTrustProfile: {
        ...source.trustProfile,
        summary: `${source.sourceClassificationLabel} · ${source.trustProfile.summary}`,
        exampleSourceClassification: source.sourceClassification,
        exampleSourceClassificationLabel: source.sourceClassificationLabel,
      },
      intakeKind: source.historyKind ? "upload-history" : "upload",
      derivationKind:
        source.evidenceBasis === "image-derived-markdown"
          ? "image-notes"
          : source.historyKind
            ? "history-export"
            : "",
      createdAt: source.occurredAt,
      updatedAt: source.occurredAt,
      eventAt: source.occurredAt,
      touchSystemExample: false,
    });

    sourceDocumentKeysById.set(source.id, seededDocument.documentKey);
    seededSourceDocumentKeys.push(seededDocument.documentKey);
  }

  const seedDocument = await createAssemblyDocumentForUser(userId, {
    title: "Seed of seeds",
    subtitle: "Current live assembly shape",
    projectKey: project.projectKey,
    blocks: buildExampleSeedBlocks(demo, sourceDocumentKeysById),
    seedMeta: {
      isSeed: true,
      status: "released",
      updatedAt: LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT || LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
      systemTemplateId: LOEGOS_ORIGIN_TEMPLATE_ID,
    },
    createdAt: LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT || LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
    updatedAt: LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT || LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
    eventAt: LOEGOS_ORIGIN_CURRENT_SEED_OCCURRED_AT || LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
    touchSystemExample: false,
  });

  const receiptDraft = await createReadingReceiptDraftForUser(userId, {
    projectKey: project.projectKey,
    documentKey: seedDocument.documentKey,
    status: LOEGOS_ORIGIN_RECEIPT_SEED.status,
    title: LOEGOS_ORIGIN_RECEIPT_SEED.title,
    interpretation: LOEGOS_ORIGIN_RECEIPT_SEED.interpretation,
    implications: LOEGOS_ORIGIN_RECEIPT_SEED.implications,
    stance: LOEGOS_ORIGIN_RECEIPT_SEED.stance,
    sourceSections: [
      sourceDocumentKeysById.get("loegos-origin-receipt-arc"),
      sourceDocumentKeysById.get("loegos-git-history"),
    ].filter(Boolean),
    payload: {
      mode: "system-example",
      note: LOEGOS_ORIGIN_RECEIPT_SEED.note,
      level: LOEGOS_ORIGIN_RECEIPT_SEED.level,
      context: LOEGOS_ORIGIN_RECEIPT_SEED.context,
      systemTemplateId: LOEGOS_ORIGIN_TEMPLATE_ID,
      historicalWitness: LOEGOS_ORIGIN_RECEIPT_SEED.historicalWitness,
    },
    createdAt: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
    updatedAt: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
  });

  const currentProject = await prisma.readerProject.findUnique({
    where: { id: project.id },
    select: {
      metadataJson: true,
    },
  });
  const nextMeta = mergeProjectArchitectureMeta(currentProject?.metadataJson, {
    assemblyState: {
      manualState: "released",
      updatedAt: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
    },
    stateHistory: [
      {
        state: "rooted",
        at: LOEGOS_ORIGIN_ROOT.occurredAt,
        reason: "Curated root declared for the Lœgos origin example.",
        receiptId: "",
      },
      {
        state: "released",
        at: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
        reason: "Historical proof sealed in the origin corpus.",
        receiptId: receiptDraft?.id || "",
      },
    ],
    system: buildExampleProjectSystemMeta({
      projectKey: project.projectKey,
      primaryExample,
      exampleLabel,
      introLine,
      sourceDocumentKeys: seededSourceDocumentKeys,
      sourceDocumentKeysById: Object.fromEntries(sourceDocumentKeysById),
      currentAssemblyDocumentKey: seedDocument.documentKey,
      receiptDraftIds: receiptDraft?.id ? [receiptDraft.id] : [],
      lastAutoRefreshedAt,
    }),
    events: [
      ...buildExampleMoveEvents(sourceDocumentKeysById, seedDocument.documentKey, receiptDraft?.id || ""),
      buildAssemblyIndexEvent("receipt_drafted", {
        at: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
        move: `Drafted receipt ${LOEGOS_ORIGIN_RECEIPT_SEED.title}.`,
        return: "The proof moved from story toward a portable record.",
        echo: "proof drafted",
        context: {
          primaryDocumentKey: seedDocument.documentKey,
          documentKey: seedDocument.documentKey,
          draftId: receiptDraft?.id || "",
          receiptId: receiptDraft?.id || "",
          relatedSourceDocumentKeys: [
            sourceDocumentKeysById.get("loegos-origin-receipt-arc"),
            sourceDocumentKeysById.get("loegos-git-history"),
          ].filter(Boolean),
        },
      }),
      buildAssemblyIndexEvent("receipt_sealed", {
        at: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
        move: `Sealed receipt ${LOEGOS_ORIGIN_RECEIPT_SEED.title}.`,
        return: "The origin share now travels with attached proof.",
        echo: "proof sealed",
        context: {
          primaryDocumentKey: seedDocument.documentKey,
          documentKey: seedDocument.documentKey,
          draftId: receiptDraft?.id || "",
          receiptId: receiptDraft?.id || "",
          relatedSourceDocumentKeys: [
            sourceDocumentKeysById.get("loegos-origin-receipt-arc"),
            sourceDocumentKeysById.get("loegos-git-history"),
          ].filter(Boolean),
        },
      }),
      buildAssemblyIndexEvent("state_advanced", {
        at: LOEGOS_ORIGIN_RECEIPT_SEED.occurredAt,
        move: "The example box reached a released state.",
        return: "The Lœgos origin example is ready to read as a completed assembly lane.",
        echo: "released",
        context: {
          to: "released",
          primaryDocumentKey: seedDocument.documentKey,
          documentKey: seedDocument.documentKey,
          receiptId: receiptDraft?.id || "",
        },
      }),
    ],
  });

  await prisma.readerProject.update({
    where: { id: project.id },
    data: {
      metadataJson: nextMeta,
      currentAssemblyDocumentKey: seedDocument.documentKey,
      isPinned: true,
    },
  });

  if (updateDefaultTemplateState) {
    await updateDefaultTemplateStateForUser(userId, {
      projectKey: project.projectKey,
      seededAt: new Date().toISOString(),
      templateVersion: LOEGOS_ORIGIN_TEMPLATE_VERSION,
      templateVersionApplied: LOEGOS_ORIGIN_TEMPLATE_VERSION,
      dismissedAt: null,
    });
  }

  return {
    projectKey: project.projectKey,
    seededSourceDocumentKeys,
    seedDocumentKey: seedDocument.documentKey,
    receiptDraftId: receiptDraft?.id || "",
  };
}

async function purgeExampleProjectRecordForUser(userId, projectKey) {
  const normalizedProjectKey = String(projectKey || "").trim();
  if (!normalizedProjectKey) {
    throw new Error("Box key is required.");
  }

  const project = await prisma.readerProject.findFirst({
    where: {
      userId,
      projectKey: normalizedProjectKey,
    },
    include: {
      documents: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!project) {
    throw new Error("Box not found.");
  }

  if (!isExampleProjectMeta(project.metadataJson)) {
    throw new Error("Only example boxes can be refreshed this way.");
  }

  const documentKeys = project.documents.map((membership) => membership.documentKey);
  for (const documentKey of documentKeys) {
    await deleteWorkspaceDocumentForUser(userId, documentKey);
  }

  await prisma.readingReceiptDraft.deleteMany({
    where: {
      userId,
      projectId: project.id,
    },
  });

  await prisma.readerProject.delete({
    where: {
      id: project.id,
    },
  });

  return project;
}

function getExampleProjectSystemMeta(project = null) {
  const normalizedMeta = normalizeProjectArchitectureMeta(project?.metadataJson);
  return normalizeProjectSystemMeta(normalizedMeta.system);
}

function getExampleTemplateVersionApplied(project = null) {
  const systemMeta = getExampleProjectSystemMeta(project);
  return Number(systemMeta.templateVersionApplied ?? systemMeta.templateVersion) || 0;
}

function shouldAutoRefreshExampleProject(project = null) {
  const systemMeta = getExampleProjectSystemMeta(project);
  return (
    Boolean(systemMeta?.templateId) &&
    systemMeta.primaryExample !== false &&
    !systemMeta.userModifiedExample &&
    getExampleTemplateVersionApplied(project) < LOEGOS_ORIGIN_TEMPLATE_VERSION
  );
}

async function refreshExampleProjectInPlaceForUser(userId, project, options = {}) {
  if (!project?.projectKey) {
    throw new Error("Box not found.");
  }

  const systemMeta = getExampleProjectSystemMeta(project);
  await purgeExampleProjectRecordForUser(userId, project.projectKey);

  return seedLoegosOriginExampleForUser(userId, {
    projectKey: project.projectKey,
    title: project.title || LOEGOS_ORIGIN_BOX_TITLE,
    subtitle: project.subtitle || LOEGOS_ORIGIN_BOX_SUBTITLE,
    primaryExample: systemMeta.primaryExample !== false,
    exampleLabel: String(systemMeta.exampleLabel || "Example").trim() || "Example",
    introLine: String(systemMeta.introLine || LOEGOS_ORIGIN_INTRO_LINE).trim() || LOEGOS_ORIGIN_INTRO_LINE,
    lastAutoRefreshedAt: new Date().toISOString(),
    updateDefaultTemplateState: systemMeta.primaryExample !== false,
    ...options,
  });
}

export async function refreshLoegosOriginExampleForUser(
  userId,
  projectKey,
  { createUpdatedCopy = false } = {},
) {
  const project = await prisma.readerProject.findFirst({
    where: {
      userId,
      projectKey: String(projectKey || "").trim(),
    },
    select: {
      id: true,
      projectKey: true,
      title: true,
      subtitle: true,
      metadataJson: true,
    },
  });

  if (!project) {
    throw new Error("Box not found.");
  }

  if (!isExampleProjectMeta(project.metadataJson)) {
    throw new Error("Only the Lœgos example can be refreshed.");
  }

  if (createUpdatedCopy) {
    const copy = await seedLoegosOriginExampleForUser(userId, {
      title: `${LOEGOS_ORIGIN_BOX_TITLE} (Updated copy)`,
      subtitle: "Fresh example copy from the latest Lœgos origin corpus.",
      primaryExample: false,
      exampleLabel: "Example copy",
      introLine: `${LOEGOS_ORIGIN_INTRO_LINE} Fresh copy from the latest template.`,
      lastAutoRefreshedAt: new Date().toISOString(),
      updateDefaultTemplateState: false,
    });

    return {
      action: "created-copy",
      projectKey: copy.projectKey,
    };
  }

  await refreshExampleProjectInPlaceForUser(userId, project, {
    updateDefaultTemplateState: getExampleProjectSystemMeta(project).primaryExample !== false,
  });

  return {
    action: "refreshed",
    projectKey: project.projectKey,
  };
}

export async function dismissLoegosOriginExampleUpdateForUser(userId, projectKey) {
  const project = await prisma.readerProject.findFirst({
    where: {
      userId,
      projectKey: String(projectKey || "").trim(),
    },
    select: {
      id: true,
      projectKey: true,
      metadataJson: true,
    },
  });

  if (!project?.projectKey) {
    throw new Error("Box not found.");
  }

  if (!isExampleProjectMeta(project.metadataJson)) {
    throw new Error("Only the Lœgos example can dismiss example updates.");
  }

  const systemMeta = getExampleProjectSystemMeta(project);
  const nextMeta = mergeProjectArchitectureMeta(project.metadataJson, {
    system: {
      ...systemMeta,
      dismissedTemplateVersion: LOEGOS_ORIGIN_TEMPLATE_VERSION,
    },
  });

  await prisma.readerProject.update({
    where: {
      id: project.id,
    },
    data: {
      metadataJson: nextMeta,
    },
  });

  return {
    action: "dismissed",
    projectKey: project.projectKey,
  };
}

export async function ensureLoegosOriginExampleForUser(userId, { documents = [] } = {}) {
  const realHistoryDocuments = listRealHistoryDocuments(documents);
  const exampleDocumentKeys = (Array.isArray(documents) ? documents : [])
    .filter((document) => isExampleDocument(document))
    .map((document) => document.documentKey)
    .filter(Boolean);
  const receiptCount = await prisma.readingReceiptDraft.count({
    where: {
      userId,
      ...(exampleDocumentKeys.length
        ? {
            documentKey: {
              notIn: exampleDocumentKeys,
            },
          }
        : {}),
    },
  });
  const hadRealHistory = realHistoryDocuments.length > 0 || receiptCount > 0;
  const defaultProject = await getReaderProjectForUser(userId, DEFAULT_PROJECT_KEY, {
    createIfMissing: true,
  });
  const templateState = getTemplateState(defaultProject?.metadataJson);
  const dismissed = Boolean(templateState.dismissedAt);
  let exampleProject = await findExampleProjectRecord(userId);
  let refreshed = false;

  if (!exampleProject && !dismissed) {
    const seeded = await seedLoegosOriginExampleForUser(userId);
    exampleProject = await prisma.readerProject.findFirst({
      where: {
        userId,
        projectKey: seeded.projectKey,
      },
      select: {
        id: true,
        projectKey: true,
        title: true,
        metadataJson: true,
      },
    });
  }

  if (exampleProject && shouldAutoRefreshExampleProject(exampleProject)) {
    const refreshedProject = await refreshExampleProjectInPlaceForUser(userId, exampleProject, {
      updateDefaultTemplateState: true,
    });
    refreshed = true;
    exampleProject = await prisma.readerProject.findFirst({
      where: {
        userId,
        projectKey: refreshedProject.projectKey,
      },
      select: {
        id: true,
        projectKey: true,
        title: true,
        metadataJson: true,
      },
    });
  }

  if (exampleProject && templateState.projectKey !== exampleProject.projectKey) {
    await updateDefaultTemplateStateForUser(userId, {
      projectKey: exampleProject.projectKey,
    });
  }

  const shouldAutoOpen =
    Boolean(exampleProject?.projectKey) &&
    !hadRealHistory &&
    !dismissed &&
    !templateState.seenAt;

  if (shouldAutoOpen) {
    await updateDefaultTemplateStateForUser(userId, {
      projectKey: exampleProject.projectKey,
      seenAt: new Date().toISOString(),
    });
  }

  return {
    hadRealHistory,
    hasExampleProject: Boolean(exampleProject?.projectKey),
    exampleProjectKey: exampleProject?.projectKey || templateState.projectKey || "",
    autoOpenProjectKey: shouldAutoOpen ? exampleProject?.projectKey || "" : "",
    dismissed,
    refreshed,
    updateAvailable:
      Boolean(exampleProject?.projectKey) &&
      getExampleTemplateVersionApplied(exampleProject) < LOEGOS_ORIGIN_TEMPLATE_VERSION &&
      Boolean(getExampleProjectSystemMeta(exampleProject).userModifiedExample) &&
      Number(getExampleProjectSystemMeta(exampleProject).dismissedTemplateVersion) <
        LOEGOS_ORIGIN_TEMPLATE_VERSION,
  };
}

export async function deleteLoegosOriginExampleForUser(userId, projectKey) {
  const normalizedProjectKey = String(projectKey || "").trim();
  if (!normalizedProjectKey) {
    throw new Error("Box key is required.");
  }

  const project = await prisma.readerProject.findFirst({
    where: {
      userId,
      projectKey: normalizedProjectKey,
    },
    include: {
      documents: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!project) {
    throw new Error("Box not found.");
  }

  if (!isExampleProjectMeta(project.metadataJson)) {
    return null;
  }
  const systemMeta = normalizeProjectSystemMeta(
    normalizeProjectArchitectureMeta(project.metadataJson).system,
  );

  const documentKeys = project.documents.map((membership) => membership.documentKey);
  for (const documentKey of documentKeys) {
    await deleteWorkspaceDocumentForUser(userId, documentKey);
  }

  await prisma.readingReceiptDraft.deleteMany({
    where: {
      userId,
      projectId: project.id,
    },
  });

  await prisma.readerProject.delete({
    where: {
      id: project.id,
    },
  });

  if (systemMeta.primaryExample !== false) {
    await updateDefaultTemplateStateForUser(userId, {
      projectKey: normalizedProjectKey,
      dismissedAt: new Date().toISOString(),
    });
  }

  return {
    deleteMode: "purged-example",
    deletedProjectKey: normalizedProjectKey,
    deletedProjectTitle: project.title,
    fallbackProjectKey: DEFAULT_PROJECT_KEY,
    fallbackProjectTitle: "Untitled Box",
    movedDocumentCount: 0,
    movedDraftCount: 0,
  };
}
