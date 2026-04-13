import { CompilerReadError, runCompilerRead } from "../../../lib/compiler-read.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value = "") {
  return String(value || "").trim();
}

function normalizeNullableText(value = null) {
  const normalized = normalizeText(value || "");
  return normalized || null;
}

function validateRequestBody(body = null) {
  const payload = body && typeof body === "object" ? body : {};
  const documentId = normalizeText(payload.documentId);
  const title = normalizeText(payload.title);
  const text = String(payload.text || "");
  const focus = normalizeNullableText(payload.focus);
  const strictness = normalizeNullableText(payload.strictness) || "soft";
  const question = normalizeNullableText(payload.question);

  if (!documentId) {
    throw new CompilerReadError("Document id is required.", { status: 400 });
  }

  if (!normalizeText(text)) {
    throw new CompilerReadError("Text is required.", { status: 400 });
  }

  if (!["soft", "hard"].includes(strictness)) {
    throw new CompilerReadError("Strictness must be soft or hard.", { status: 400 });
  }

  return {
    documentId,
    title,
    text,
    focus,
    strictness,
    question,
  };
}

export function createCompilerReadHandler({
  getSession = async () => {
    const sessionModule = await import("../../../lib/server-session.js");
    return sessionModule.getRequiredSession();
  },
  runRead = runCompilerRead,
} = {}) {
  return async function POST(request) {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await request.json().catch(() => null);
      const payload = validateRequestBody(body);
      const compilerRead = await runRead(payload);

      return Response.json({
        ok: true,
        compilerRead,
      });
    } catch (error) {
      if (error instanceof CompilerReadError) {
        return Response.json(
          {
            error: error.message,
            unavailable: error.unavailable,
          },
          { status: error.status || 500 },
        );
      }

      return Response.json(
        {
          error:
            error instanceof Error ? error.message : "Compiler Read is unavailable right now.",
          unavailable: true,
        },
        { status: 503 },
      );
    }
  };
}

export const POST = createCompilerReadHandler();
