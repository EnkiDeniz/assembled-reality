import { upsertReplayReviewEntry } from "../../../../lib/replay-review.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value = "") {
  return String(value || "").trim();
}

function replayReviewStatusForMessage(message = "") {
  if (/not published on this deployment yet/i.test(message)) {
    return 409;
  }
  if (/required|must be|unknown/i.test(message)) {
    return 400;
  }
  return 503;
}

export function createReplayReviewEntryHandler({
  getSession = async () => {
    const sessionModule = await import("../../../../lib/server-session.js");
    return sessionModule.getRequiredSession();
  },
  upsertEntry = upsertReplayReviewEntry,
} = {}) {
  return async function PATCH(request) {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const updated = await upsertEntry(session.user.id, {
        entryId: normalizeText(body.entryId),
        packetKind: normalizeText(body.packetKind).toLowerCase(),
        honestyScore: body.honestyScore,
        understandabilityScore: body.understandabilityScore,
        specificityScore: body.specificityScore,
        actionabilityScore: body.actionabilityScore,
        convergenceValueScore: body.convergenceValueScore,
        wouldUseAgainScore: body.wouldUseAgainScore,
        laterHistoryJudgment: "laterHistoryJudgment" in body
          ? normalizeText(body.laterHistoryJudgment).toLowerCase()
          : undefined,
        moveWouldTakeNow: "moveWouldTakeNow" in body ? String(body.moveWouldTakeNow || "") : undefined,
        driftAssessment: "driftAssessment" in body ? String(body.driftAssessment || "") : undefined,
        notes: "notes" in body ? String(body.notes || "") : undefined,
      });

      return Response.json({ ok: true, entry: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Replay review entry could not be saved.";
      const status = replayReviewStatusForMessage(message);
      return Response.json({ error: message }, { status });
    }
  };
}

export const PATCH = createReplayReviewEntryHandler();
