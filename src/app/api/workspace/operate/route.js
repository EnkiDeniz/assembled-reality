import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { buildAssemblyIndexEvent } from "@/lib/assembly-architecture";
import { getReaderDocumentDataForUser, listReaderDocumentsForUser } from "@/lib/reader-documents";
import { PRODUCT_NAME } from "@/lib/product-language";
import {
  coerceOperateResult,
  getOperateAssemblyDocument,
  listOperateIncludedDocuments,
} from "@/lib/operate";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
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
  const includeAssembly = body?.includeAssembly !== false;
  const includeGuide = body?.includeGuide === true;

  const documents = await listReaderDocumentsForUser(session.user.id);
  const projects = await listReaderProjectsForUser(session.user.id, documents);
  const activeProject = getProjectByKey(projects, projectKey);

  if (!activeProject) {
    return NextResponse.json(
      { ok: false, error: "Box not found." },
      { status: 404 },
    );
  }

  const boxDocuments = getProjectDocuments(documents, activeProject);
  const {
    includedDocuments: includedDocumentSummaries,
    includedSourceCount,
    includesAssembly,
    canOperate,
  } = listOperateIncludedDocuments(activeProject, boxDocuments, {
    preferredDocumentKey: documentKey,
    includeAssembly,
    includeGuide,
  });

  if (!canOperate) {
    return NextResponse.json(
      {
        ok: false,
        error: "Add a real source or assembly before running Operate.",
      },
      { status: 400 },
    );
  }

  const fullDocuments = await Promise.all(
    includedDocumentSummaries.map(async (document) => {
      const fullDocument = await getReaderDocumentDataForUser(
        session.user.id,
        document.documentKey,
      );

      if (!fullDocument) {
        return null;
      }

      return {
        ...fullDocument,
        operateRole: document.operateRole,
      };
    }),
  );
  const resolvedDocuments = fullDocuments.filter(Boolean);

  if (resolvedDocuments.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Operate could not load the box material.",
      },
      { status: 502 },
    );
  }

  const currentAssemblyDocument = getOperateAssemblyDocument(
    activeProject,
    resolvedDocuments,
    documentKey,
  );
  const promptDocuments = buildOperatePromptDocuments(resolvedDocuments);
  const { systemPrompt, userPrompt } = buildOperatePrompt({
    boxTitle: activeProject.boxTitle || activeProject.title || "Untitled Box",
    promptDocuments,
    includesAssembly,
    includedSourceCount,
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
        boxKey: activeProject.projectKey,
        boxTitle: activeProject.boxTitle || activeProject.title || "Untitled Box",
        ranAt,
        includedDocuments: promptDocuments.map((document) => ({
          documentKey: document.documentKey,
          title: document.title,
          role: document.role,
          blockCount: document.blockCount,
          truncated: document.truncated,
        })),
        includedSourceCount,
        includesAssembly,
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
      await updateReaderProjectForUser(session.user.id, activeProject.projectKey, {
        appendEvents: [
          buildAssemblyIndexEvent("operate_ran", {
            at: ranAt,
            move: `Operate ran across ${result.includedSourceCount} source${result.includedSourceCount === 1 ? "" : "s"}.`,
            return: result.nextMove,
            echo: `${result.convergence} · gradient ${result.gradient}`,
            context: {
              documentKey:
                currentAssemblyDocument?.documentKey ||
                documentKey ||
                resolvedDocuments[0]?.documentKey ||
                "",
              primaryDocumentKey:
                currentAssemblyDocument?.documentKey ||
                documentKey ||
                resolvedDocuments[0]?.documentKey ||
                "",
              gradient: result.gradient,
              convergence: result.convergence,
              trustFloor: result.trustFloor,
              trustCeiling: result.trustCeiling,
              nextMove: result.nextMove,
              relatedSourceDocumentKeys: resolvedDocuments
                .filter((document) => document.documentKey !== currentAssemblyDocument?.documentKey)
                .map((document) => document.documentKey),
            },
          }),
        ],
      });
    } catch (error) {
      console.error("Operate event recording failed.", {
        boxKey: activeProject.projectKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({
      ok: true,
      result,
      auditDocumentKey:
        currentAssemblyDocument?.documentKey || documentKey || resolvedDocuments[0]?.documentKey || "",
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
