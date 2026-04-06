import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { buildAssemblyIndexEvent } from "@/lib/assembly-architecture";
import { getReaderDocumentDataForUser, listReaderDocumentsForUser } from "@/lib/reader-documents";
import {
  buildLocalSourceEvidenceForBlocks,
  buildOperateOverlayCoverage,
  buildOperateOverrideSummary,
  buildOperateOverlayPrompt,
  buildOperateSourceFingerprint,
  buildOverlayCandidateBlocks,
  coerceOperateOverlayPayload,
  mergeOperateOverlayWithOverrides,
  OPERATE_OVERLAY_ENGINE_KIND,
  OPERATE_OVERLAY_ENGINE_VERSION,
  OPERATE_OVERLAY_PROMPT_VERSION,
  OPERATE_OVERLAY_SCHEMA_VERSION,
} from "@/lib/operate-overlay";
import { PRODUCT_NAME } from "@/lib/product-language";
import {
  coerceOperateResult,
  getOperateAssemblyDocument,
  listOperateIncludedDocuments,
} from "@/lib/operate";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import {
  createReaderOperateRunForUser,
  getLatestReaderOperateRunForUser,
  listReaderAttestedOverridesForUser,
} from "@/lib/reader-operate";
import { listReaderProjectsForUser, updateReaderProjectForUser } from "@/lib/reader-projects";
import { getRequiredSession } from "@/lib/server-session";
import { buildBoxSource, buildOperateSourceSummary } from "@/lib/source-model";

export const runtime = "nodejs";

const OPERATE_UNAVAILABLE_MESSAGE = "Operate is unavailable right now.";
const MAX_TOTAL_DOCUMENT_CHARS = 60000;
const MAX_DOCUMENT_CHARS = 18000;
const OPERATE_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    aim: { type: "string" },
    ground: { type: "string" },
    bridge: { type: "string" },
    gradient: { type: "integer", minimum: 1, maximum: 7 },
    convergence: {
      type: "string",
      enum: ["convergent", "divergent", "hallucinating"],
    },
    trust_floor: {
      type: "string",
      enum: ["L1", "L2", "L3"],
    },
    trust_ceiling: {
      type: "string",
      enum: ["L1", "L2", "L3"],
    },
    levels: {
      type: "object",
      additionalProperties: false,
      properties: {
        aim: { type: "string", enum: ["L1", "L2", "L3"] },
        ground: { type: "string", enum: ["L1", "L2", "L3"] },
        bridge: { type: "string", enum: ["L1", "L2", "L3"] },
      },
      required: ["aim", "ground", "bridge"],
    },
    level_rationales: {
      type: "object",
      additionalProperties: false,
      properties: {
        aim: { type: "string" },
        ground: { type: "string" },
        bridge: { type: "string" },
      },
      required: ["aim", "ground", "bridge"],
    },
    next_move: { type: "string" },
  },
  required: [
    "aim",
    "ground",
    "bridge",
    "gradient",
    "convergence",
    "trust_floor",
    "trust_ceiling",
    "levels",
    "level_rationales",
    "next_move",
  ],
};
const OPERATE_OVERLAY_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    blocks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          blockId: { type: "string" },
          signal: {
            type: "string",
            enum: ["green", "amber", "red"],
          },
          trustLevel: {
            type: "string",
            enum: ["L1", "L2", "L3"],
          },
          rationale: { type: "string" },
          uncertainty: { type: "string" },
          evidenceIds: {
            type: "array",
            items: { type: "string" },
          },
          spans: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                text: { type: "string" },
                start: { type: "integer", minimum: 0 },
                end: { type: "integer", minimum: 1 },
                signal: {
                  type: "string",
                  enum: ["green", "amber", "red"],
                },
                reason: { type: "string" },
              },
              required: ["text", "start", "end", "signal", "reason"],
            },
          },
        },
        required: [
          "blockId",
          "signal",
          "trustLevel",
          "rationale",
          "uncertainty",
          "evidenceIds",
          "spans",
        ],
      },
    },
  },
  required: ["blocks"],
};

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

function normalizeDocumentSource(document) {
  const raw = String(document?.rawMarkdown || "").trim();
  if (raw) return raw;

  const blocks = Array.isArray(document?.blocks) ? document.blocks : [];
  return blocks
    .map((block) => String(block?.text || block?.plainText || "").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function truncateDocumentSource(source, maxChars) {
  if (source.length <= maxChars) {
    return { text: source, truncated: false };
  }

  return {
    text: `${source.slice(0, Math.max(0, maxChars - 28)).trim()}\n\n[truncated for Operate v1]`,
    truncated: true,
  };
}

function buildOperatePromptDocuments(documents = []) {
  let remainingChars = MAX_TOTAL_DOCUMENT_CHARS;

  return documents.map((document) => {
    const source = normalizeDocumentSource(document);
    const boxSource = buildBoxSource(document);
    const nextBudget = Math.max(1200, Math.min(MAX_DOCUMENT_CHARS, remainingChars));
    const { text, truncated } = truncateDocumentSource(source, nextBudget);
    remainingChars = Math.max(0, remainingChars - text.length);

    return {
      documentKey: document.documentKey,
      title: document.title || "Untitled document",
      role: document.operateRole || "source",
      blockCount: Array.isArray(document.blocks) ? document.blocks.length : 0,
      sourceSummary: buildOperateSourceSummary(boxSource),
      truncated,
      content: text,
    };
  });
}

function buildOperatePrompt({
  boxTitle,
  promptDocuments,
  includesAssembly,
  includedSourceCount,
}) {
  const systemPrompt = [
    `You are Operate, the box-read engine inside ${PRODUCT_NAME}.`,
    "Operate is not chat, not summary, and not rewrite.",
    "Read the box and project the smallest honest structure that preserves what is in it.",
    "Return only JSON that matches the schema exactly.",
    "Use only trust levels L1, L2, and L3.",
    "Never emit L4, L5, L6, or L7.",
    "Aim states what is being attempted or declared.",
    "Ground states what evidence, condition, or constraint actually exists in the box.",
    "Bridge states where aim meets ground and what signal, fit, or gap appears there.",
    "Gradient is the convergence stage from 1 to 7.",
    "Convergence must be one of convergent, divergent, or hallucinating.",
    "Convergent means aim and ground largely align.",
    "Divergent means the gap is real and named, but not fantasy.",
    "Hallucinating means the aim claims support the box does not actually provide.",
    "A sparse box must stay modest. One source can still produce a real but early read.",
    "Trust levels must stay honest.",
    "L1 means mostly asserted or self-reported.",
    "L2 means evidence or exhibits are present inside the box.",
    "L3 means the box itself contains enough auditable evidence or metadata for a cautious audited read.",
    "The next_move must be one concrete, smallest useful step.",
  ].join(" ");

  const corpus = promptDocuments
    .map((document, index) =>
      [
        `DOCUMENT ${index + 1}`,
        `Key: ${document.documentKey}`,
        `Title: ${document.title}`,
        `Role: ${document.role}`,
        `Blocks: ${document.blockCount}`,
        document.sourceSummary ? `Source summary: ${document.sourceSummary}` : "",
        document.truncated ? "Coverage: truncated for Operate v1" : "Coverage: full",
        `Content:\n${document.content}`,
      ].join("\n"),
    )
    .join("\n\n---\n\n");

  const userPrompt = [
    `Box: ${boxTitle || "Untitled Box"}`,
    `Included sources: ${includedSourceCount}`,
    `Includes assembly: ${includesAssembly ? "yes" : "no"}`,
    "",
    "Produce one box read across the included material.",
    "The result should be actionable, compressed, and honest.",
    "",
    corpus,
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function createOverlayResponse({
  run = null,
  mergedPayload = null,
  stale = false,
  overrideSummary = null,
  coverage = null,
  documentKey = "",
} = {}) {
  const payload = mergedPayload && typeof mergedPayload === "object" ? mergedPayload : {};
  const summary = payload.summary && typeof payload.summary === "object"
    ? payload.summary
    : buildOperateOverrideSummary([], null);
  const resolvedCoverage =
    coverage && typeof coverage === "object"
      ? coverage
      : payload.coverage && typeof payload.coverage === "object"
        ? payload.coverage
        : {
            totalBlockCount: 0,
            evaluatedBlockCount: 0,
            omittedBlockCount: 0,
            truncated: false,
            maxBlockCount: 24,
          };

  return {
    ok: true,
    mode: "overlay",
    runId: run?.id || "",
    documentKey,
    sourceFingerprint: run?.sourceFingerprint || "",
    stale: Boolean(stale),
    blocks: Array.isArray(payload.blocks) ? payload.blocks : [],
    findings: Array.isArray(payload.findings) ? payload.findings : [],
    coverage: resolvedCoverage,
    summary,
    overrideSummary:
      overrideSummary && typeof overrideSummary === "object" ? overrideSummary : summary,
  };
}

async function loadOperateContextForUser(
  userId,
  {
    projectKey = "",
    documentKey = "",
    includeAssembly = true,
    includeGuide = false,
  } = {},
) {
  const documents = await listReaderDocumentsForUser(userId);
  const projects = await listReaderProjectsForUser(userId, documents);
  const activeProject = getProjectByKey(projects, projectKey);

  if (!activeProject) {
    return {
      error: "Box not found.",
      status: 404,
    };
  }

  const boxDocuments = getProjectDocuments(documents, activeProject);
  const operateState = listOperateIncludedDocuments(activeProject, boxDocuments, {
    preferredDocumentKey: documentKey,
    includeAssembly,
    includeGuide,
  });

  if (!operateState.canOperate) {
    return {
      error: "Add a real source or assembly before running Operate.",
      status: 400,
    };
  }

  const fullDocuments = await Promise.all(
    operateState.includedDocuments.map(async (document) => {
      const fullDocument = await getReaderDocumentDataForUser(userId, document.documentKey);
      if (!fullDocument) return null;

      return {
        ...fullDocument,
        operateRole: document.operateRole,
      };
    }),
  );
  const resolvedDocuments = fullDocuments.filter(Boolean);

  if (resolvedDocuments.length === 0) {
    return {
      error: "Operate could not load the box material.",
      status: 502,
    };
  }

  const currentAssemblyDocument = getOperateAssemblyDocument(
    activeProject,
    resolvedDocuments,
    documentKey,
  );
  const sourceDocuments = resolvedDocuments.filter(
    (document) => document.operateRole === "source",
  );

  return {
    activeProject,
    documents,
    projects,
    resolvedDocuments,
    currentAssemblyDocument,
    sourceDocuments,
    includedSourceCount: operateState.includedSourceCount,
    includesAssembly: operateState.includesAssembly,
  };
}

async function buildOverlayRuntimeContext(userId, context = {}) {
  const currentAssemblyDocument = context?.currentAssemblyDocument || null;
  const sourceDocuments = Array.isArray(context?.sourceDocuments) ? context.sourceDocuments : [];

  if (!currentAssemblyDocument?.documentKey) {
    return {
      error: "Open the current seed before running inline Operate.",
      status: 400,
    };
  }

  if (!sourceDocuments.length) {
    return {
      error: "Add a real source before running inline Operate.",
      status: 400,
    };
  }

  const overrides = await listReaderAttestedOverridesForUser(userId, {
    projectId: context?.activeProject?.id || null,
    documentKey: currentAssemblyDocument.documentKey,
  });
  const candidateBlocks = buildOverlayCandidateBlocks(currentAssemblyDocument);
  if (!candidateBlocks.length) {
    return {
      error: "Add text to the current seed before running inline Operate.",
      status: 400,
    };
  }
  const evidenceMap = buildLocalSourceEvidenceForBlocks(candidateBlocks, sourceDocuments);
  const coverage = buildOperateOverlayCoverage(currentAssemblyDocument, candidateBlocks);
  const sourceFingerprint = buildOperateSourceFingerprint({
    workingDocument: currentAssemblyDocument,
    sourceDocuments,
    overrides,
  });

  return {
    overrides,
    candidateBlocks,
    evidenceMap,
    coverage,
    sourceFingerprint,
  };
}

async function getCurrentOverlayStateForUser(userId, context = {}) {
  const latestAssemblyDocument = context?.currentAssemblyDocument?.documentKey
    ? await getReaderDocumentDataForUser(userId, context.currentAssemblyDocument.documentKey)
    : null;
  const latestSourceDocuments = (
    await Promise.all(
      (Array.isArray(context?.sourceDocuments) ? context.sourceDocuments : []).map((document) =>
        getReaderDocumentDataForUser(userId, document.documentKey),
      ),
    )
  ).filter(Boolean);
  const overrides = latestAssemblyDocument?.documentKey
    ? await listReaderAttestedOverridesForUser(userId, {
        projectId: context?.activeProject?.id || null,
        documentKey: latestAssemblyDocument.documentKey,
      })
    : [];

  return {
    currentAssemblyDocument: latestAssemblyDocument || context?.currentAssemblyDocument || null,
    sourceDocuments: latestSourceDocuments.length
      ? latestSourceDocuments
      : Array.isArray(context?.sourceDocuments)
        ? context.sourceDocuments
        : [],
    overrides,
  };
}

async function runOverlayOperate({
  session,
  projectKey = "",
  documentKey = "",
} = {}) {
  const baseContext = await loadOperateContextForUser(session.user.id, {
    projectKey,
    documentKey,
    includeAssembly: true,
    includeGuide: false,
  });
  if (baseContext?.error) {
    return NextResponse.json(
      { ok: false, mode: "overlay", error: baseContext.error },
      { status: baseContext.status || 400 },
    );
  }

  const runtimeContext = await buildOverlayRuntimeContext(session.user.id, baseContext);
  if (runtimeContext?.error) {
    return NextResponse.json(
      { ok: false, mode: "overlay", error: runtimeContext.error },
      { status: runtimeContext.status || 400 },
    );
  }

  const { systemPrompt, userPrompt } = buildOperateOverlayPrompt({
    boxTitle: baseContext.activeProject?.boxTitle || baseContext.activeProject?.title || "Untitled Box",
    workingDocument: baseContext.currentAssemblyDocument,
    candidateBlocks: runtimeContext.candidateBlocks,
    evidenceMap: runtimeContext.evidenceMap,
  });

  let response;
  let payload;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
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
            name: "operate_overlay_result",
            strict: true,
            schema: OPERATE_OVERLAY_RESPONSE_SCHEMA,
          },
        },
      }),
      cache: "no-store",
    });

    payload = await response.json().catch(() => null);
  } catch (error) {
    console.error("Operate overlay request crashed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, mode: "overlay", error: OPERATE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    );
  }

  if (!response?.ok) {
    const message =
      payload?.error?.message || payload?.error?.code || OPERATE_UNAVAILABLE_MESSAGE;
    console.error("Operate overlay request failed.", {
      status: response?.status,
      detail: message,
    });
    return NextResponse.json(
      { ok: false, mode: "overlay", error: OPERATE_UNAVAILABLE_MESSAGE },
      { status: response?.status || 503 },
    );
  }

  const outputText = extractMessageText(payload);
  if (!outputText) {
    return NextResponse.json(
      { ok: false, mode: "overlay", error: "Operate returned an empty finding payload." },
      { status: 502 },
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    return NextResponse.json(
      { ok: false, mode: "overlay", error: "Operate returned an invalid finding payload." },
      { status: 502 },
    );
  }

  const coercedPayload = coerceOperateOverlayPayload(parsed, {
    candidateBlocks: runtimeContext.candidateBlocks,
    evidenceMap: runtimeContext.evidenceMap,
    workingDocument: baseContext.currentAssemblyDocument,
  });
  const latestOverlayState = await getCurrentOverlayStateForUser(session.user.id, baseContext);
  const latestFingerprint = buildOperateSourceFingerprint({
    workingDocument: latestOverlayState.currentAssemblyDocument,
    sourceDocuments: latestOverlayState.sourceDocuments,
    overrides: latestOverlayState.overrides,
  });
  const stale = latestFingerprint !== runtimeContext.sourceFingerprint;
  const persistedRun = await createReaderOperateRunForUser(session.user.id, {
    projectId: baseContext.activeProject?.id || null,
    documentKey: baseContext.currentAssemblyDocument.documentKey,
    mode: "overlay",
    schemaVersion: OPERATE_OVERLAY_SCHEMA_VERSION,
    engineKind: OPERATE_OVERLAY_ENGINE_KIND,
    engineVersion: OPERATE_OVERLAY_ENGINE_VERSION,
    modelName: appEnv.openai.textModel,
    promptVersion: OPERATE_OVERLAY_PROMPT_VERSION,
    sourceFingerprint: runtimeContext.sourceFingerprint,
    stale,
    payloadJson: coercedPayload,
  });
  const mergedPayload = mergeOperateOverlayWithOverrides(
    persistedRun?.payloadJson || coercedPayload,
    latestOverlayState.overrides,
    latestOverlayState.currentAssemblyDocument,
  );
  const overrideSummary = buildOperateOverrideSummary(
    latestOverlayState.overrides,
    latestOverlayState.currentAssemblyDocument,
  );

  try {
    await updateReaderProjectForUser(session.user.id, baseContext.activeProject.projectKey, {
      appendEvents: [
        buildAssemblyIndexEvent("operate_ran", {
          at: new Date().toISOString(),
          move: `Operate ran inline across ${baseContext.currentAssemblyDocument.title || "the seed"}.`,
          return:
            stale
              ? "The inline read persisted, but the surface moved before it landed."
              : "Inline findings are attached to the current seed.",
          echo: `overlay · ${mergedPayload.summary?.greenCount || 0}/${mergedPayload.summary?.amberCount || 0}/${mergedPayload.summary?.redCount || 0}`,
          context: {
            mode: "overlay",
            documentKey: baseContext.currentAssemblyDocument.documentKey,
            primaryDocumentKey: baseContext.currentAssemblyDocument.documentKey,
            runId: persistedRun?.id || "",
            stale,
            sourceFingerprint: runtimeContext.sourceFingerprint,
            relatedSourceDocumentKeys: latestOverlayState.sourceDocuments.map((document) => document.documentKey),
          },
        }),
      ],
    });
  } catch (error) {
    console.error("Operate overlay event recording failed.", {
      boxKey: baseContext.activeProject.projectKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return NextResponse.json(
    createOverlayResponse({
      run: persistedRun,
      mergedPayload,
      stale,
      overrideSummary,
      coverage: runtimeContext.coverage,
      documentKey: baseContext.currentAssemblyDocument.documentKey,
    }),
  );
}

async function runSummaryOperate({
  session,
  projectKey = "",
  documentKey = "",
  includeAssembly = true,
  includeGuide = false,
} = {}) {
  const operateContext = await loadOperateContextForUser(session.user.id, {
    projectKey,
    documentKey,
    includeAssembly,
    includeGuide,
  });
  if (operateContext?.error) {
    return NextResponse.json(
      { ok: false, error: operateContext.error },
      { status: operateContext.status || 400 },
    );
  }

  const promptDocuments = buildOperatePromptDocuments(operateContext.resolvedDocuments);
  const { systemPrompt, userPrompt } = buildOperatePrompt({
    boxTitle: operateContext.activeProject.boxTitle || operateContext.activeProject.title || "Untitled Box",
    promptDocuments,
    includesAssembly: operateContext.includesAssembly,
    includedSourceCount: operateContext.includedSourceCount,
  });

  const ranAt = new Date().toISOString();

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
            name: "operate_result",
            strict: true,
            schema: OPERATE_RESPONSE_SCHEMA,
          },
        },
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.error?.message || payload?.error?.code || OPERATE_UNAVAILABLE_MESSAGE;
      console.error("Operate request failed.", {
        status: response.status,
        detail: message,
      });
      return NextResponse.json(
        { ok: false, error: OPERATE_UNAVAILABLE_MESSAGE },
        { status: response.status },
      );
    }

    const outputText = extractMessageText(payload);
    if (!outputText) {
      return NextResponse.json(
        { ok: false, error: "Operate returned an empty result." },
        { status: 502 },
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Operate returned an invalid result." },
        { status: 502 },
      );
    }

    let result;
    try {
      result = coerceOperateResult(parsed, {
        boxKey: operateContext.activeProject.projectKey,
        boxTitle: operateContext.activeProject.boxTitle || operateContext.activeProject.title || "Untitled Box",
        ranAt,
        includedDocuments: promptDocuments.map((document) => ({
          documentKey: document.documentKey,
          title: document.title,
          role: document.role,
          blockCount: document.blockCount,
          truncated: document.truncated,
        })),
        includedSourceCount: operateContext.includedSourceCount,
        includesAssembly: operateContext.includesAssembly,
      });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Operate returned an invalid result.",
        },
        { status: 502 },
      );
    }

    try {
      await updateReaderProjectForUser(session.user.id, operateContext.activeProject.projectKey, {
        appendEvents: [
          buildAssemblyIndexEvent("operate_ran", {
            at: ranAt,
            move: `Operate ran across ${result.includedSourceCount} source${result.includedSourceCount === 1 ? "" : "s"}.`,
            return: result.nextMove,
            echo: `${result.convergence} · gradient ${result.gradient}`,
            context: {
              documentKey:
                operateContext.currentAssemblyDocument?.documentKey ||
                documentKey ||
                operateContext.resolvedDocuments[0]?.documentKey ||
                "",
              primaryDocumentKey:
                operateContext.currentAssemblyDocument?.documentKey ||
                documentKey ||
                operateContext.resolvedDocuments[0]?.documentKey ||
                "",
              gradient: result.gradient,
              convergence: result.convergence,
              trustFloor: result.trustFloor,
              trustCeiling: result.trustCeiling,
              nextMove: result.nextMove,
              relatedSourceDocumentKeys: operateContext.resolvedDocuments
                .filter((document) => document.documentKey !== operateContext.currentAssemblyDocument?.documentKey)
                .map((document) => document.documentKey),
            },
          }),
        ],
      });
    } catch (error) {
      console.error("Operate event recording failed.", {
        boxKey: operateContext.activeProject.projectKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "summary",
      result,
      auditDocumentKey:
        operateContext.currentAssemblyDocument?.documentKey ||
        documentKey ||
        operateContext.resolvedDocuments[0]?.documentKey ||
        "",
    });
  } catch (error) {
    console.error("Operate request crashed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, error: OPERATE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    );
  }
}

export async function GET(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectKey = String(searchParams.get("projectKey") || searchParams.get("project") || "").trim();
  const documentKey = String(searchParams.get("documentKey") || searchParams.get("document") || "").trim();
  const mode = String(searchParams.get("mode") || "overlay").trim().toLowerCase();

  if (mode !== "overlay") {
    return NextResponse.json(
      { ok: false, error: "Only overlay retrieval is supported here." },
      { status: 400 },
    );
  }

  const operateContext = await loadOperateContextForUser(session.user.id, {
    projectKey,
    documentKey,
    includeAssembly: true,
    includeGuide: false,
  });
  if (operateContext?.error) {
    return NextResponse.json(
      { ok: false, mode: "overlay", error: operateContext.error },
      { status: operateContext.status || 400 },
    );
  }

  const latestRun = await getLatestReaderOperateRunForUser(session.user.id, {
    projectId: operateContext.activeProject?.id || null,
    documentKey: operateContext.currentAssemblyDocument?.documentKey || "",
    mode: "overlay",
  });
  const overrides = await listReaderAttestedOverridesForUser(session.user.id, {
    projectId: operateContext.activeProject?.id || null,
    documentKey: operateContext.currentAssemblyDocument?.documentKey || "",
  });
  const currentCandidateBlocks = buildOverlayCandidateBlocks(operateContext.currentAssemblyDocument);
  const currentCoverage = buildOperateOverlayCoverage(
    operateContext.currentAssemblyDocument,
    currentCandidateBlocks,
  );
  const currentFingerprint = buildOperateSourceFingerprint({
    workingDocument: operateContext.currentAssemblyDocument,
    sourceDocuments: operateContext.sourceDocuments,
    overrides,
  });
  const overrideSummary = buildOperateOverrideSummary(
    overrides,
    operateContext.currentAssemblyDocument,
  );

  if (!latestRun?.id) {
    return NextResponse.json(
      createOverlayResponse({
        run: null,
        mergedPayload: {
          blocks: [],
          findings: [],
          coverage: currentCoverage,
          summary: overrideSummary,
        },
        stale: true,
        overrideSummary,
        coverage: currentCoverage,
        documentKey: operateContext.currentAssemblyDocument?.documentKey || "",
      }),
    );
  }

  const stale = Boolean(latestRun.stale) || latestRun.sourceFingerprint !== currentFingerprint;
  const mergedPayload = mergeOperateOverlayWithOverrides(
    latestRun.payloadJson,
    overrides,
    operateContext.currentAssemblyDocument,
  );

  return NextResponse.json(
    createOverlayResponse({
      run: latestRun,
      mergedPayload,
      stale,
      overrideSummary,
      coverage: currentCoverage,
      documentKey: operateContext.currentAssemblyDocument?.documentKey || "",
    }),
  );
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!appEnv.openai.enabled) {
    return NextResponse.json(
      { ok: false, error: OPERATE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const documentKey = String(body?.documentKey || "").trim();
  const mode = String(body?.mode || "summary").trim().toLowerCase() === "overlay" ? "overlay" : "summary";
  const includeAssembly = body?.includeAssembly !== false;
  const includeGuide = body?.includeGuide === true;
  if (mode === "overlay") {
    return runOverlayOperate({
      session,
      projectKey,
      documentKey,
    });
  }

  return runSummaryOperate({
    session,
    projectKey,
    documentKey,
    includeAssembly,
    includeGuide,
  });
}
