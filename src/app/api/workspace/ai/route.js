import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import {
  normalizeWorkspaceBlocks,
  stripMarkdownSyntax,
} from "@/lib/document-blocks";
import { PRODUCT_NAME } from "@/lib/product-language";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function inferOperation(prompt) {
  const normalized = String(prompt || "").trim().toLowerCase();
  if (normalized.includes("summar")) return "summarized";
  if (normalized.includes("synth")) return "synthesized";
  if (normalized.includes("evidence") || normalized.includes("find") || normalized.includes("extract")) {
    return "extracted";
  }
  return "summarized";
}

function extractOutputText(payload) {
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

function extractJson(text) {
  const normalized = String(text || "").trim();
  if (!normalized) return null;

  try {
    return JSON.parse(normalized);
  } catch {
    // Fall through to fenced and brace-based parsing.
  }

  const fenced = normalized.match(/```json\s*([\s\S]+?)```/i) || normalized.match(/```([\s\S]+?)```/);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // Fall through to brace-based parsing.
    }
  }

  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(normalized.slice(firstBrace, lastBrace + 1));
    } catch {
      // Fall through to null.
    }
  }

  return null;
}

async function runOpenAiWorkspaceOperation({
  prompt,
  documentKey,
  title,
  blocks,
  selectedBlocks,
  clipboardBlocks,
}) {
  const contextBlocks = (selectedBlocks.length ? selectedBlocks : blocks).slice(0, 12);
  const clipboardContext = clipboardBlocks.slice(0, 8);
  const context = [
    `Document: ${title || documentKey || "Untitled document"}`,
    contextBlocks.length
      ? `Visible blocks:\n${contextBlocks
          .map((block, index) => `[${index + 1}] ${stripMarkdownSyntax(block.text || block.plainText || "")}`)
          .join("\n")}`
      : "",
    clipboardContext.length
      ? `Clipboard blocks:\n${clipboardContext
          .map(
            (block, index) =>
              `[${index + 1}] (${block.sourceDocumentKey || block.documentKey}) ${stripMarkdownSyntax(block.text || block.plainText || "")}`,
          )
          .join("\n")}`
      : "",
    `User request: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");

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
          content: [
            {
              type: "input_text",
              text: [
                `You are the source and assembly operations engine inside ${PRODUCT_NAME}.`,
                "Return strict JSON only with this shape:",
                '{"operation":"extracted|summarized|synthesized","title":"short label","blocks":[{"kind":"heading|paragraph|list|quote","text":"markdown text","operation":"extracted|summarized|synthesized"}]}',
                "Blocks should be concise, useful, and ready to add to a clipboard.",
                "Never return commentary outside the JSON object.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: context }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI workspace operation failed (${response.status}).`);
  }

  const payload = await response.json().catch(() => null);
  const parsed = extractJson(extractOutputText(payload));
  if (!parsed || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    throw new Error("OpenAI returned an invalid workspace payload.");
  }

  return normalizeWorkspaceBlocks(
    parsed.blocks.map((block, index) => ({
      id: `ai-${Date.now()}-${index + 1}`,
      documentKey,
      sourceDocumentKey: documentKey,
      sourcePosition: index,
      kind: block.kind,
      text: block.text,
      plainText: stripMarkdownSyntax(block.text || ""),
      author: "ai",
      operation: parsed.operation || block.operation || inferOperation(prompt),
      isEditable: true,
      isPlayable: true,
    })),
    {
      documentKey,
      defaultSourceDocumentKey: documentKey,
      defaultIsEditable: true,
    },
  );
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const prompt = String(body?.prompt || "").trim();
  const documentKey = String(body?.documentKey || "").trim() || "workspace";
  const title = String(body?.title || "").trim();
  const blocks = normalizeWorkspaceBlocks(body?.blocks, {
    documentKey,
    defaultSourceDocumentKey: documentKey,
    defaultIsEditable: true,
  });
  const selectedBlocks = normalizeWorkspaceBlocks(body?.selectedBlocks, {
    documentKey,
    defaultSourceDocumentKey: documentKey,
    defaultIsEditable: true,
  });
  const clipboardBlocks = normalizeWorkspaceBlocks(body?.clipboardBlocks, {
    documentKey,
    defaultSourceDocumentKey: documentKey,
    defaultIsEditable: true,
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  if (!appEnv.openai.enabled) {
    return NextResponse.json(
      {
        error: "Workspace AI is unavailable right now.",
        unavailable: true,
      },
      { status: 503 },
    );
  }

  try {
    const results = await runOpenAiWorkspaceOperation({
      prompt,
      documentKey,
      title,
      blocks,
      selectedBlocks,
      clipboardBlocks,
    });

    return NextResponse.json({
      ok: true,
      operation: results[0]?.operation || inferOperation(prompt),
      blocks: results,
    });
  } catch (error) {
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message
          : "Workspace AI is unavailable right now.",
      unavailable: true,
    }, { status: 503 });
  }
}
