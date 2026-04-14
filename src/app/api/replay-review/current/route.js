import { loadReplayReviewCurrent } from "../../../../lib/replay-review.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function createReplayReviewCurrentHandler({
  getSession = async () => {
    const sessionModule = await import("../../../../lib/server-session.js");
    return sessionModule.getRequiredSession();
  },
  loadCurrent = loadReplayReviewCurrent,
} = {}) {
  return async function GET() {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const current = await loadCurrent(session.user.id);
      return Response.json({ ok: true, ...current });
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : "Replay review is unavailable right now.",
        },
        { status: 503 },
      );
    }
  };
}

export const GET = createReplayReviewCurrentHandler();
