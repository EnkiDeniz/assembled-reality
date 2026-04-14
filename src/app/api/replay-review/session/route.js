import {
  createOrResumeReplayReviewSession,
  updateReplayReviewSession,
} from "../../../../lib/replay-review.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value = "") {
  return String(value || "").trim();
}

function replayReviewStatusForMessage(message = "") {
  if (/not published on this deployment yet/i.test(message)) {
    return 409;
  }
  if (/required|must be|does not exist/i.test(message)) {
    return 400;
  }
  return 503;
}

export function createReplayReviewSessionPostHandler({
  getSession = async () => {
    const sessionModule = await import("../../../../lib/server-session.js");
    return sessionModule.getRequiredSession();
  },
  createOrResume = createOrResumeReplayReviewSession,
} = {}) {
  return async function POST() {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const current = await createOrResume(session.user.id);
      return Response.json({ ok: true, ...current });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Replay review is unavailable right now.";
      return Response.json(
        { error: message },
        { status: replayReviewStatusForMessage(message) },
      );
    }
  };
}

export function createReplayReviewSessionPatchHandler({
  getSession = async () => {
    const sessionModule = await import("../../../../lib/server-session.js");
    return sessionModule.getRequiredSession();
  },
  updateSession = updateReplayReviewSession,
} = {}) {
  return async function PATCH(request) {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const payload = {
        overallDecision: "overallDecision" in body ? normalizeText(body.overallDecision).toLowerCase() : undefined,
        overallSummary: "overallSummary" in body ? String(body.overallSummary || "") : undefined,
        status: "status" in body ? normalizeText(body.status).toLowerCase() : undefined,
      };

      const updated = await updateSession(session.user.id, payload);
      return Response.json({ ok: true, session: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Replay review could not be saved.";
      const status = replayReviewStatusForMessage(message);
      return Response.json({ error: message }, { status });
    }
  };
}

export const POST = createReplayReviewSessionPostHandler();
export const PATCH = createReplayReviewSessionPatchHandler();
