import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import {
  buildWorkspaceBlocksFromDocument,
  createWorkspaceLogEntry,
  normalizeWorkspaceLogEntries,
} from "@/lib/document-blocks";
import { parseDocument } from "@/lib/document";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import {
  getReaderProjectForUser,
  listReaderProjectsForUser,
  updateReaderProjectForUser,
} from "@/lib/reader-projects";
import { buildAssemblyIndexEvent } from "@/lib/assembly-architecture";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getRequiredSession } from "@/lib/server-session";
import {
  buildSeedFingerprint,
  buildSeedMarkdown,
  getSeedDocument,
  getSeedSectionsFromDocument,
  listRealSourceDocuments,
  normalizeSeedMeta,
  SEED_TEMPLATE_VERSION,
  shouldAutoRenameBox,
} from "@/lib/seed-model";
import {
  createAssemblyDocumentForUser,
  getWorkspaceDocumentForUser,
  saveWorkspaceDocumentForUser,
  updateWorkspaceDocumentMetadataForUser,
} from "@/lib/workspace-documents";

export const runtime = "nodejs";

const SEED_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    aim: { type: "string" },
    whats_here: { type: "string" },
    gap: { type: "string" },
    sealed: { type: "string" },
  },
  required: ["title", "summary", "aim", "whats_here", "gap", "sealed"],
};

const MAX_TOTAL_SOURCE_CHARS = 32000;
const MAX_SOURCE_CHARS = 12000;

function getRelatedSourceDocumentKeys(blocks = [], documentKey = "") {
  return [
    ...new Set(
      (Array.isArray(blocks) ? blocks : [])
        .map((block) => String(block?.sourceDocumentKey || "").trim())
        .filter((key) => key && key !== documentKey),
    ),
  ];
}

function extractMessageText(payload) {
  const output = Array.isArray(payload?.output) ? payload.output : [];
  const parts = [];

  output.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((entry) => {
      if (
        (entry?.type === "output_text" || entry?.type === "text") &&
        typeof entry?.text === "string"
      ) {
        parts.push(entry.text);
      }
    });
  });

  return parts.join("\n\n").trim();
}

function normalizeDocumentSource(document = null) {
  const raw = String(document?.rawMarkdown || "").trim();
  if (raw) return raw;

  const blocks = Array.isArray(document?.blocks) ? document.blocks : [];
  return blocks
    .map((block) => String(block?.text || block?.plainText || "").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function truncateDocumentSource(source = "", maxChars = MAX_SOURCE_CHARS) {
  if (source.length <= maxChars) {
    return { text: source, truncated: false };
  }

  return {
    text: `${source.slice(0, Math.max(0, maxChars - 28)).trim()}\n\n[truncated for Seed v1]`,
    truncated: true,
  };
}

function buildPromptDocuments(documents = []) {
  let remainingChars = MAX_TOTAL_SOURCE_CHARS;

  return documents.map((document) => {
    const source = normalizeDocumentSource(document);
    const budget = Math.max(1000, Math.min(MAX_SOURCE_CHARS, remainingChars));
    const { text, truncated } = truncateDocumentSource(source, budget);
    remainingChars = Math.max(0, remainingChars - text.length);

    return {
      documentKey: document.documentKey,
      title: document.title || "Untitled source",
      content: text,
      truncated,
    };
  });
}

function buildSeedPrompt({
  mode = "ensure",
  boxTitle = "Untitled Box",
  promptDocuments = [],
  currentSeedSections = null,
  receiptCount = 0,
}) {
  const systemPrompt = [
    "You write the live Seed for a Loegos box.",
    "The Seed is the current working object, not a final truth claim.",
    "Write with clarity, compression, and earned confidence.",
    "Do not sound mystical.",
    "Do not pretend the box has proof it does not have.",
    "Aim should state what the box is trying to make real.",
    "What's here should describe the strongest signals that are actually in the box.",
    "The gap should name the main unresolved mismatch, uncertainty, or missing proof.",
    "Sealed should describe proof state honestly. If there are no receipts, say so plainly.",
    "Title should be concrete and short enough to name both the box and the seed.",
    "Return only JSON matching the schema exactly.",
  ].join(" ");

  const currentSeedContext = currentSeedSections
    ? [
        "Current Seed",
        `Aim:\n${currentSeedSections.aim || "None"}`,
        `What's here:\n${currentSeedSections.whatsHere || "None"}`,
        `The gap:\n${currentSeedSections.gap || "None"}`,
        `Sealed:\n${currentSeedSections.sealed || "None"}`,
      ].join("\n\n")
    : "";

  const corpus = promptDocuments
    .map((document, index) =>
      [
        `SOURCE ${index + 1}`,
        `Key: ${document.documentKey}`,
        `Title: ${document.title}`,
        document.truncated ? "Coverage: truncated" : "Coverage: full",
        `Content:\n${document.content}`,
      ].join("\n"),
    )
    .join("\n\n---\n\n");

  const userPrompt = [
    `Mode: ${mode === "suggest" ? "update the current seed" : "create the first seed"}`,
    `Box: ${boxTitle}`,
    `Receipt count: ${receiptCount}`,
    currentSeedContext,
    "Write the smallest honest Seed for this box.",
    corpus,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { systemPrompt, userPrompt };
}

function fallbackSeedResult({
  boxTitle = "Untitled Box",
  realSources = [],
  receiptCount = 0,
} = {}) {
  const latestSource = realSources[0] || null;
  const sourceTitles = realSources.map((document) => document.title).filter(Boolean);
  const fallbackTitle =
    latestSource?.title ||
    (boxTitle && boxTitle !== "Untitled Box" ? boxTitle : "Working Seed");

  return {
    title: fallbackTitle,
    summary: "Seed refreshed from the current box material.",
    aim:
      latestSource?.title
        ? `Make the direction around ${latestSource.title} legible enough to act on.`
        : "Make the current direction legible enough to act on.",
    whats_here: sourceTitles.length
      ? `The box currently contains: ${sourceTitles.join(", ")}.`
      : "The box has early signal but very little named material yet.",
    gap:
      receiptCount > 0
        ? "The box has proof activity, but the seed still needs a sharper statement of what the proof changes."
        : "The box has signal, but not enough proof yet to collapse the gap.",
    sealed:
      receiptCount > 0
        ? `${receiptCount} receipt${receiptCount === 1 ? "" : "s"} preserved so far.`
        : "No receipts sealed yet.",
  };
}

function coerceSeedResult(result = null, fallback = {}) {
  const candidate = result && typeof result === "object" ? result : fallback;
  return {
    title: String(candidate.title || fallback.title || "Working Seed").trim() || "Working Seed",
    summary: String(candidate.summary || fallback.summary || "").trim(),
    aim: String(candidate.aim || fallback.aim || "").trim(),
    whatsHere: String(candidate.whats_here || candidate.whatsHere || fallback.whatsHere || "").trim(),
    gap: String(candidate.gap || fallback.gap || "").trim(),
    sealed: String(candidate.sealed || fallback.sealed || "").trim(),
  };
}

function buildSeedBlocks(documentKey, seedResult, options = {}) {
  const resolvedDocumentKey = String(documentKey || "seed").trim() || "seed";
  const sourceDocumentKey = String(options.sourceDocumentKey || resolvedDocumentKey).trim() || resolvedDocumentKey;
  const sourceTitle = String(options.sourceTitle || "").trim();
  const markdown = buildSeedMarkdown({
    aim: seedResult.aim,
    whatsHere: seedResult.whatsHere,
    gap: seedResult.gap,
    sealed: seedResult.sealed,
  });

  return buildWorkspaceBlocksFromDocument(parseDocument(markdown, { documentKey: resolvedDocumentKey }), {
    documentKey: resolvedDocumentKey,
    defaultSourceDocumentKey: sourceDocumentKey,
    defaultIsEditable: true,
    defaultIsAssemblyBlock: true,
  }).map((block) => ({
    ...block,
    sourceTitle: sourceTitle || block.sourceTitle,
    provenance: sourceDocumentKey
      ? {
          ...(block?.provenance && typeof block.provenance === "object" ? block.provenance : {}),
          importedFromDocumentKey: sourceDocumentKey,
        }
      : block.provenance,
  }));
}

function buildSeedCompileMeta({
  currentSeedMeta = null,
  sourceFingerprint = "",
  sourceDocument = null,
  isAutoTitled = false,
  suggestionPending = false,
} = {}) {
  const normalizedSourceDocument = sourceDocument && typeof sourceDocument === "object"
    ? sourceDocument
    : null;

  return normalizeSeedMeta({
    ...(currentSeedMeta && typeof currentSeedMeta === "object" ? currentSeedMeta : {}),
    isSeed: true,
    templateVersion: SEED_TEMPLATE_VERSION,
    status: "live",
    updatedAt: new Date().toISOString(),
    suggestionPending: Boolean(suggestionPending),
    autoTitled: Boolean(isAutoTitled),
    sourceFingerprint,
    compiledFromDocumentKey: String(normalizedSourceDocument?.documentKey || "").trim(),
    compiledFromUpdatedAt: String(
      normalizedSourceDocument?.updatedAt || normalizedSourceDocument?.createdAt || "",
    ).trim(),
    compiledFromTitle: String(normalizedSourceDocument?.title || "").trim(),
    witnessAnchorReferences: (Array.isArray(normalizedSourceDocument?.blocks)
      ? normalizedSourceDocument.blocks
      : []
    )
      .slice(0, 64)
      .map((block) => ({
        blockId: String(block?.id || "").trim(),
        sourcePosition: Number.isFinite(Number(block?.sourcePosition))
          ? Number(block.sourcePosition)
          : -1,
      })),
  });
}

async function generateSeedResult(input) {
  const fallback = fallbackSeedResult(input);

  if (!appEnv.openai.enabled) {
    return fallback;
  }

  const { systemPrompt, userPrompt } = buildSeedPrompt({
    mode: input.mode,
    boxTitle: input.boxTitle,
    promptDocuments: buildPromptDocuments(input.realSources),
    currentSeedSections: input.currentSeedSections,
    receiptCount: input.receiptCount,
  });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appEnv.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: appEnv.openai.textModel,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "seed_result",
            strict: true,
            schema: SEED_RESPONSE_SCHEMA,
          },
        },
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return fallback;
    }

    const outputText = extractMessageText(payload);
    if (!outputText) {
      return fallback;
    }

    return coerceSeedResult(JSON.parse(outputText), fallback);
  } catch {
    return fallback;
  }
}

async function renameProjectIfNeeded(userId, project, nextTitle) {
  if (!project || !shouldAutoRenameBox(project)) {
    return null;
  }

  if (!nextTitle || nextTitle === project.title) {
    return null;
  }

  return updateReaderProjectForUser(userId, project.projectKey, {
    title: nextTitle,
    subtitle: project.subtitle || null,
  });
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const mode = String(body?.mode || "ensure").trim().toLowerCase();
  const projectKey = String(body?.projectKey || "").trim();
  const sourceDocumentKey = String(body?.sourceDocumentKey || "").trim();
  const suggestion = body?.suggestion && typeof body.suggestion === "object" ? body.suggestion : null;

  if (!projectKey) {
    return NextResponse.json({ ok: false, error: "Box key is required." }, { status: 400 });
  }

  const documents = await listReaderDocumentsForUser(session.user.id);
  const projects = await listReaderProjectsForUser(session.user.id, documents);
  const activeProject = getProjectByKey(projects, projectKey);

  if (!activeProject) {
    return NextResponse.json({ ok: false, error: "Box not found." }, { status: 404 });
  }

  const projectDocuments = getProjectDocuments(documents, activeProject);
  const realSources = listRealSourceDocuments(projectDocuments);
  const compileSourceDocument =
    (sourceDocumentKey
      ? realSources.find((document) => document.documentKey === sourceDocumentKey) || null
      : null) ||
    realSources[0] ||
    null;
  const currentSeedDocument = getSeedDocument(activeProject, projectDocuments);
  const receiptCount = Number(body?.receiptCount) || 0;
  const currentSeedSections = currentSeedDocument
    ? getSeedSectionsFromDocument(currentSeedDocument)
    : null;
  const sourceFingerprint = buildSeedFingerprint({
    realSourceDocuments: realSources,
    receiptCount,
    latestOperateAt: body?.latestOperateAt || "",
  });

  if (!realSources.length && !currentSeedDocument) {
    return NextResponse.json(
      { ok: false, error: "Add a real source before creating the first seed." },
      { status: 400 },
    );
  }

  if (mode === "suggest") {
    const nextSuggestion = await generateSeedResult({
      mode,
      boxTitle: activeProject.boxTitle || activeProject.title || "Untitled Box",
      realSources,
      currentSeedSections,
      receiptCount,
    });

    return NextResponse.json({
      ok: true,
      suggestion: {
        ...nextSuggestion,
        sourceFingerprint,
      },
    });
  }

  if (mode === "compile") {
    const nextSeed = await generateSeedResult({
      mode,
      boxTitle: activeProject.boxTitle || activeProject.title || "Untitled Box",
      realSources,
      currentSeedSections,
      receiptCount,
    });

    if (currentSeedDocument?.documentKey) {
      const nextBlocks = buildSeedBlocks(currentSeedDocument.documentKey, nextSeed, {
        sourceDocumentKey: compileSourceDocument?.documentKey || "",
        sourceTitle: compileSourceDocument?.title || "",
      });
      const nextLogEntries = normalizeWorkspaceLogEntries(
        [
          ...(Array.isArray(currentSeedDocument.logEntries) ? currentSeedDocument.logEntries : []),
          createWorkspaceLogEntry({
            action: "EDITED",
            detail: `Seed compiled from ${compileSourceDocument?.title || "the current witness"}.`,
            documentKey: currentSeedDocument.documentKey,
            blockIds: nextBlocks.map((block) => block.id),
          }),
        ],
        currentSeedDocument.documentKey,
      );

      const savedSeed = await saveWorkspaceDocumentForUser(session.user.id, {
        documentKey: currentSeedDocument.documentKey,
        title: nextSeed.title,
        subtitle: "Seed",
        baseUpdatedAt: currentSeedDocument.updatedAt,
        blocks: nextBlocks,
        logEntries: nextLogEntries,
      });

      await updateWorkspaceDocumentMetadataForUser(session.user.id, currentSeedDocument.documentKey, {
        seedMeta: buildSeedCompileMeta({
          currentSeedMeta: savedSeed.seedMeta,
          sourceFingerprint,
          sourceDocument: compileSourceDocument,
          isAutoTitled: savedSeed.seedMeta?.autoTitled,
        }),
      });

      const renamedProject = await renameProjectIfNeeded(
        session.user.id,
        activeProject,
        nextSeed.title,
      );
      const projectRecord =
        renamedProject || (await getReaderProjectForUser(session.user.id, projectKey));

      return NextResponse.json({
        ok: true,
        created: false,
        seed: await getWorkspaceDocumentForUser(session.user.id, currentSeedDocument.documentKey),
        project: projectRecord
          ? {
              projectKey: projectRecord.projectKey,
              title: projectRecord.title,
              subtitle: projectRecord.subtitle || "",
              currentAssemblyDocumentKey: projectRecord.currentAssemblyDocumentKey || null,
            }
          : null,
      });
    }

    const seedDocument = await createAssemblyDocumentForUser(session.user.id, {
      title: nextSeed.title,
      subtitle: "Seed",
      projectKey,
      blocks: buildSeedBlocks("", nextSeed, {
        sourceDocumentKey: compileSourceDocument?.documentKey || "",
        sourceTitle: compileSourceDocument?.title || "",
      }),
      seedMeta: buildSeedCompileMeta({
        sourceFingerprint,
        sourceDocument: compileSourceDocument,
        isAutoTitled: shouldAutoRenameBox(activeProject),
      }),
    });

    const renamedProject = await renameProjectIfNeeded(session.user.id, activeProject, nextSeed.title);
    const projectRecord =
      renamedProject || (await getReaderProjectForUser(session.user.id, projectKey));

    return NextResponse.json({
      ok: true,
      created: true,
      seed: seedDocument,
      project: projectRecord
        ? {
            projectKey: projectRecord.projectKey,
            title: projectRecord.title,
            subtitle: projectRecord.subtitle || "",
            currentAssemblyDocumentKey: projectRecord.currentAssemblyDocumentKey || null,
          }
        : null,
    });
  }

  if (mode === "apply") {
    const seedDocument =
      currentSeedDocument ||
      (await getWorkspaceDocumentForUser(
        session.user.id,
        activeProject.currentAssemblyDocumentKey,
      ));

    if (!seedDocument?.documentKey) {
      return NextResponse.json({ ok: false, error: "Seed not found." }, { status: 404 });
    }

    const nextSeed = coerceSeedResult(suggestion, fallbackSeedResult({
      boxTitle: activeProject.boxTitle || activeProject.title || "Untitled Box",
      realSources,
      receiptCount,
    }));
    const nextBlocks = buildSeedBlocks(seedDocument.documentKey, nextSeed);
    const nextLogEntries = normalizeWorkspaceLogEntries(
      [
        ...(Array.isArray(seedDocument.logEntries) ? seedDocument.logEntries : []),
        createWorkspaceLogEntry({
          action: "EDITED",
          detail: `Seed refreshed for ${activeProject.boxTitle || activeProject.title || "this box"}.`,
          documentKey: seedDocument.documentKey,
          blockIds: nextBlocks.map((block) => block.id),
        }),
      ],
      seedDocument.documentKey,
    );

    const savedSeed = await saveWorkspaceDocumentForUser(session.user.id, {
      documentKey: seedDocument.documentKey,
      title: nextSeed.title,
      subtitle: "Seed",
      baseUpdatedAt: seedDocument.updatedAt,
      blocks: nextBlocks,
      logEntries: nextLogEntries,
    });

    await updateWorkspaceDocumentMetadataForUser(session.user.id, seedDocument.documentKey, {
      seedMeta: normalizeSeedMeta({
        ...buildSeedCompileMeta({
          currentSeedMeta: savedSeed.seedMeta,
          sourceFingerprint,
          sourceDocument: compileSourceDocument,
          isAutoTitled: savedSeed.seedMeta?.autoTitled,
        }),
        lastSuggestedFingerprint: sourceFingerprint,
      }),
    });

    if (projectKey) {
      const relatedSourceDocumentKeys = getRelatedSourceDocumentKeys(
        nextBlocks,
        seedDocument.documentKey,
      );
      await updateReaderProjectForUser(session.user.id, projectKey, {
        appendEvents: [
          buildAssemblyIndexEvent("seed_updated", {
            move: `Updated seed ${nextSeed.title}.`,
            return: `${relatedSourceDocumentKeys.length} source${
              relatedSourceDocumentKeys.length === 1 ? "" : "s"
            } are currently carried by the live edge.`,
            echo: "live",
            context: {
              documentKey: seedDocument.documentKey,
              primaryDocumentKey: seedDocument.documentKey,
              relatedSourceDocumentKeys,
              blockCount: nextBlocks.length,
            },
          }),
        ],
      });
    }

    const renamedProject = await renameProjectIfNeeded(session.user.id, activeProject, nextSeed.title);
    const projectRecord =
      renamedProject || (await getReaderProjectForUser(session.user.id, projectKey));

    return NextResponse.json({
      ok: true,
      seed: await getWorkspaceDocumentForUser(session.user.id, seedDocument.documentKey),
      project: projectRecord
        ? {
            projectKey: projectRecord.projectKey,
            title: projectRecord.title,
            subtitle: projectRecord.subtitle || "",
            currentAssemblyDocumentKey: projectRecord.currentAssemblyDocumentKey || null,
          }
        : null,
    });
  }

  if (currentSeedDocument?.documentKey) {
    await updateWorkspaceDocumentMetadataForUser(session.user.id, currentSeedDocument.documentKey, {
      seedMeta: normalizeSeedMeta({
        ...currentSeedDocument.seedMeta,
        isSeed: true,
        templateVersion: SEED_TEMPLATE_VERSION,
        status: "live",
        updatedAt: currentSeedDocument.updatedAt || new Date().toISOString(),
        suggestionPending: false,
        sourceFingerprint,
        compiledFromDocumentKey:
          currentSeedDocument.seedMeta?.compiledFromDocumentKey || sourceDocumentKey,
        compiledFromUpdatedAt:
          currentSeedDocument.seedMeta?.compiledFromUpdatedAt ||
          compileSourceDocument?.updatedAt ||
          compileSourceDocument?.createdAt ||
          "",
        compiledFromTitle:
          currentSeedDocument.seedMeta?.compiledFromTitle || compileSourceDocument?.title || "",
      }),
    });

    return NextResponse.json({
      ok: true,
      seed: await getWorkspaceDocumentForUser(session.user.id, currentSeedDocument.documentKey),
      created: false,
    });
  }

  const nextSeed = await generateSeedResult({
    mode: "ensure",
    boxTitle: activeProject.boxTitle || activeProject.title || "Untitled Box",
    realSources,
    currentSeedSections: null,
    receiptCount,
  });
  const seedDocument = await createAssemblyDocumentForUser(session.user.id, {
    title: nextSeed.title,
    subtitle: "Seed",
    projectKey,
    blocks: buildSeedBlocks("", nextSeed, {
      sourceDocumentKey: compileSourceDocument?.documentKey || "",
      sourceTitle: compileSourceDocument?.title || "",
    }),
    seedMeta: buildSeedCompileMeta({
      sourceFingerprint,
      sourceDocument: compileSourceDocument,
      isAutoTitled: shouldAutoRenameBox(activeProject),
    }),
  });

  const renamedProject = await renameProjectIfNeeded(session.user.id, activeProject, nextSeed.title);
  const projectRecord =
    renamedProject || (await getReaderProjectForUser(session.user.id, projectKey));

  return NextResponse.json({
    ok: true,
    created: true,
    seed: seedDocument,
    suggestion: {
      ...nextSeed,
      sourceFingerprint,
    },
    project: projectRecord
      ? {
          projectKey: projectRecord.projectKey,
          title: projectRecord.title,
          subtitle: projectRecord.subtitle || "",
          currentAssemblyDocumentKey: projectRecord.currentAssemblyDocumentKey || null,
        }
      : null,
  });
}
