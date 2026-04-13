import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  extractBridgePayloadFromCitations,
  extractRoomPayloadFromCitations,
} from "../../src/lib/room.js";
import { handleRoomApplyPost } from "../../src/lib/room-apply-route-handler.js";
import { handleRoomTurnPost } from "../../src/lib/room-turn-route-handler.js";
import { buildJourneyView } from "./run-room-journey.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hashValue(value) {
  if (value === undefined) {
    return createHash("sha256").update("undefined").digest("hex");
  }
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

function sanitizeFetchOptions(options = {}) {
  const next = clone(options || {});
  const headers = next?.headers && typeof next.headers === "object" ? next.headers : null;

  if (headers) {
    for (const key of Object.keys(headers)) {
      const normalizedKey = String(key).toLowerCase();
      if (normalizedKey === "authorization" || normalizedKey === "x-api-key") {
        headers[key] = "<redacted>";
      }
    }
  }

  return next;
}

function makeRequest(body) {
  return new Request("http://room.test/api/workspace/room", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function buildProjectRecord(state = {}) {
  const recentSourceKeys = Array.isArray(state?.recentSources)
    ? state.recentSources.map((source) => source?.documentKey).filter(Boolean)
    : [];

  return {
    id: state?.project?.id || `project_${state?.project?.projectKey || "room"}`,
    projectKey: state?.project?.projectKey || "",
    title: state?.project?.title || "",
    boxTitle: state?.project?.title || "",
    subtitle: state?.project?.subtitle || "",
    boxSubtitle: state?.project?.subtitle || "",
    currentAssemblyDocumentKey:
      state?.roomDocument?.documentKey || `room_${state?.project?.projectKey || "room"}`,
    documentKeys: recentSourceKeys,
  };
}

function syncActiveSession(state, sessionId = "") {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId || !Array.isArray(state?.sessions)) return;
  const match = state.sessions.find((session) => session?.id === normalizedSessionId);
  if (!match) return;
  state.session = {
    ...state.session,
    ...match,
    isActive: true,
  };
  state.sessions = state.sessions.map((session) => ({
    ...session,
    isActive: session?.id === normalizedSessionId,
  }));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(path, value = "") {
  await writeFile(path, String(value || ""), "utf8");
}

async function buildSourceDiffPatch(dossierDir, beforeSource = "", afterSource = "") {
  const beforePath = join(dossierDir, ".source-before.tmp");
  const afterPath = join(dossierDir, ".source-after.tmp");
  await writeText(beforePath, beforeSource);
  await writeText(afterPath, afterSource);

  let patch = "# no source diff\n";
  if (beforeSource !== afterSource) {
    try {
      patch = execFileSync(
        "git",
        ["diff", "--no-index", "--no-ext-diff", "--", beforePath, afterPath],
        { encoding: "utf8" },
      );
    } catch (error) {
      patch = error?.stdout || error?.stderr || "# source diff unavailable\n";
    }
  }

  await writeText(join(dossierDir, "16-source-diff.patch"), patch);
  await rm(beforePath, { force: true });
  await rm(afterPath, { force: true });
}

function buildStateDiffMarkdown(title, beforeValue, afterValue, summaryLines = []) {
  return [
    `# ${title}`,
    "",
    ...summaryLines.map((line) => `- ${line}`),
    "",
    "## Before",
    "",
    "```json",
    JSON.stringify(beforeValue, null, 2),
    "```",
    "",
    "## After",
    "",
    "```json",
    JSON.stringify(afterValue, null, 2),
    "```",
    "",
  ].join("\n");
}

function buildRouteJourneyReport(result) {
  const turnResult = result.turnResult;
  const applyResult = result.applyResult || result.receiptResult;
  const provider = normalizeText(turnResult?.body?.provider || "n/a");

  return [
    `# ${result.fixture.id}`,
    "",
    result.fixture.description || "",
    "",
    "## Route summary",
    "",
    `- turn executed: ${turnResult ? "yes" : "no"}`,
    `- provider: ${provider || "n/a"}`,
    `- preview present after turn: ${turnResult?.body?.view?.activePreview ? "yes" : "no"}`,
    `- apply or receipt action executed: ${applyResult ? "yes" : "no"}`,
    `- source mutated: ${hashValue(result.initialSnapshot.source) !== hashValue(result.finalSource) ? "yes" : "no"}`,
    `- runtime mutated: ${
      hashValue(result.initialSnapshot.runtimeWindow) !== hashValue(result.finalSnapshot.runtimeWindow)
        ? "yes"
        : "no"
    }`,
    "",
    "## Final verdict",
    "",
    applyResult
      ? `- final route action: ${result.receiptResult ? "complete_receipt_kit" : "apply_proposal_preview"}`
      : "- final route action: turn only",
    `- final active preview: ${result.finalSnapshot.view?.activePreview ? "present" : "none"}`,
    `- final field state: ${normalizeText(result.finalSnapshot.view?.fieldState?.key) || "unknown"}`,
    "",
  ].join("\n");
}

async function emitRouteJourneyDossier(result, { rootDir = "test-results/room-route-journeys" } = {}) {
  const dossierDir = join(rootDir, result.fixture.id);
  await rm(dossierDir, { recursive: true, force: true });
  await mkdir(dossierDir, { recursive: true });

  await writeJson(join(dossierDir, "00-fixture.json"), result.fixture);
  await writeText(join(dossierDir, "01-initial-room-source.loe"), result.initialSnapshot.source);
  await writeJson(join(dossierDir, "02-initial-artifact.json"), result.initialSnapshot.artifact);
  await writeJson(join(dossierDir, "03-initial-runtime.json"), result.initialSnapshot.runtimeWindow);
  await writeJson(join(dossierDir, "04-turn-request.json"), result.turnRequestBody);
  await writeJson(join(dossierDir, "05-turn-fetch-body.json"), result.turnFetchBody);
  await writeJson(join(dossierDir, "06-raw-model-payload.json"), result.turnRawModelPayload);
  await writeJson(join(dossierDir, "07-turn-response.json"), result.turnResult);
  await writeJson(join(dossierDir, "08-view-after-turn.json"), result.turnResult?.body?.view || null);

  const actionResult = result.applyResult || result.receiptResult;
  const actionRequest = result.applyRequestBody || result.receiptRequestBody;
  if (actionResult) {
    await writeJson(join(dossierDir, "09-apply-request.json"), actionRequest);
    await writeJson(join(dossierDir, "10-apply-response.json"), actionResult);
    await writeText(join(dossierDir, "11-room-source-after-apply.loe"), result.finalSource);
    await writeJson(join(dossierDir, "12-runtime-after-apply.json"), result.finalSnapshot.runtimeWindow);
    await writeJson(join(dossierDir, "13-view-after-apply.json"), result.finalSnapshot.view);
  }

  await buildSourceDiffPatch(dossierDir, result.initialSnapshot.source, result.finalSource);
  await writeText(
    join(dossierDir, "17-artifact-diff.md"),
    buildStateDiffMarkdown(
      "Artifact diff",
      result.initialSnapshot.artifact,
      result.finalSnapshot.artifact,
      [
        `turn provider: ${normalizeText(result.turnResult?.body?.provider || "n/a")}`,
        `final field state: ${normalizeText(result.finalSnapshot.view?.fieldState?.key) || "unknown"}`,
      ],
    ),
  );
  await writeText(
    join(dossierDir, "18-runtime-diff.md"),
    buildStateDiffMarkdown(
      "Runtime diff",
      result.initialSnapshot.runtimeWindow,
      result.finalSnapshot.runtimeWindow,
      [
        `events before: ${Array.isArray(result.initialSnapshot.runtimeWindow?.events) ? result.initialSnapshot.runtimeWindow.events.length : 0}`,
        `events after: ${Array.isArray(result.finalSnapshot.runtimeWindow?.events) ? result.finalSnapshot.runtimeWindow.events.length : 0}`,
        `receipts before: ${Array.isArray(result.initialSnapshot.runtimeWindow?.receipts) ? result.initialSnapshot.runtimeWindow.receipts.length : 0}`,
        `receipts after: ${Array.isArray(result.finalSnapshot.runtimeWindow?.receipts) ? result.finalSnapshot.runtimeWindow.receipts.length : 0}`,
      ],
    ),
  );
  await writeText(join(dossierDir, "19-report.md"), buildRouteJourneyReport(result));

  return dossierDir;
}

export function createRoomRouteHarness(fixture, options = {}) {
  const state = clone(fixture.initialState);
  const fetchCalls = [];
  const draftStore = new Map();
  const sessionMessagesById = new Map();
  const sessionIdByThreadDocumentKey = new Map();
  const sessionUser = { user: { id: "user_room_route_test" } };

  const knownSessions = Array.isArray(state?.sessions) ? state.sessions : [state.session].filter(Boolean);
  knownSessions.forEach((session) => {
    if (!session?.id) return;
    const initialMessages =
      state?.sessionMessagesById && typeof state.sessionMessagesById === "object"
        ? clone(state.sessionMessagesById[session.id] || [])
        : session.id === state?.session?.id
          ? clone(state.messages || [])
          : [];
    sessionMessagesById.set(session.id, initialMessages);
    if (normalizeText(session?.threadDocumentKey)) {
      sessionIdByThreadDocumentKey.set(session.threadDocumentKey, session.id);
    }
  });
  if (state?.session?.id && !sessionMessagesById.has(state.session.id)) {
    sessionMessagesById.set(state.session.id, clone(state.messages || []));
  }
  state.messages = clone(sessionMessagesById.get(state?.session?.id) || []);

  function currentSnapshot() {
    return buildJourneyView(state);
  }

  function currentFocusedDocumentKey(explicitDocumentKey = "") {
    return (
      normalizeText(explicitDocumentKey) ||
      normalizeText(state?.focusedWitness?.documentKey) ||
      ""
    );
  }

  const sharedDeps = {
    getRequiredSession: async () => sessionUser,
    ensureCompilerFirstWorkspaceResetForUser: async () => ({
      resetAt: "2026-04-11T00:00:00.000Z",
    }),
    buildRoomWorkspaceViewForUser: async (_userId, { sessionId = "" } = {}) => {
      syncActiveSession(state, sessionId);
      state.messages = clone(sessionMessagesById.get(state.session?.id) || []);
      return currentSnapshot().view;
    },
    ensureRoomAssemblyDocumentForProject: async () => currentSnapshot().roomDocument,
    getRoomAssemblySource: () => state.roomSource,
    ...(options?.sharedDependencyOverrides || {}),
  };

  function buildTurnDeps(rawModelPayload) {
    const providedFetchImpl = options?.turnDependencyOverrides?.fetchImpl;
    return {
      ...sharedDeps,
      appEnvValue: {
        openai: {
          enabled: true,
          apiKey: "test-key",
          textModel: "gpt-test",
        },
      },
      ...(options?.turnDependencyOverrides || {}),
      fetchImpl: async (_url, options = {}) => {
        fetchCalls.push({
          url: _url,
          options: sanitizeFetchOptions(options),
        });
        if (providedFetchImpl) {
          return providedFetchImpl(_url, options);
        }
        return {
          ok: true,
          status: 200,
          json: async () => clone(rawModelPayload),
        };
      },
      appendConversationExchangeForUser: async (
        _userId,
        { documentKey, userLine, answer, citations, userCitations, assistantCitations },
      ) => {
        const targetSessionId =
          sessionIdByThreadDocumentKey.get(normalizeText(documentKey)) || state.session?.id || "";
        const currentMessages = clone(sessionMessagesById.get(targetSessionId) || []);
        const nextIndex = currentMessages.length + 1;
        const resolvedAssistantCitations = Array.isArray(assistantCitations) ? assistantCitations : citations;
        const assistantPayload = extractRoomPayloadFromCitations(resolvedAssistantCitations);
        const bridgePayload = extractBridgePayloadFromCitations(userCitations);
        const userMessage = {
          id: `${fixture.id}-route-user-${nextIndex}`,
          role: "user",
          content: userLine,
          citations: clone(Array.isArray(userCitations) ? userCitations : []),
          bridgePayload,
          roomPayload: null,
        };
        const assistantMessage = {
          id: `${fixture.id}-route-assistant-${nextIndex}`,
          role: "assistant",
          content: answer,
          citations: clone(Array.isArray(resolvedAssistantCitations) ? resolvedAssistantCitations : []),
          roomPayload: assistantPayload,
        };
        const nextMessages = [...currentMessages, userMessage, assistantMessage];
        sessionMessagesById.set(targetSessionId, nextMessages);
        if (targetSessionId === state.session?.id) {
          state.messages = clone(nextMessages);
        }
        state.sessions = (Array.isArray(state.sessions) ? state.sessions : []).map((session) =>
          session?.id === targetSessionId
            ? {
                ...session,
                messageCount: nextMessages.length,
              }
            : session,
        );
        return {
          threadId: documentKey,
          userMessage,
          assistantMessage,
        };
      },
    };
  }

  function buildApplyDeps() {
    return {
      ...sharedDeps,
      getReaderProjectForUser: async () => buildProjectRecord(state),
      loadConversationThreadForUser: async (_userId, threadDocumentKey) => ({
        messages: clone(
          sessionMessagesById.get(
            sessionIdByThreadDocumentKey.get(normalizeText(threadDocumentKey)) || state.session?.id || "",
          ) || [],
        ),
      }),
      saveRoomAssemblySourceForUser: async (_userId, _documentKey, { source, runtimeWindow }) => {
        state.roomSource = source;
        state.runtimeWindow = clone(runtimeWindow);
        return { ok: true };
      },
      createReadingReceiptDraftForUser: async (_userId, payload) => {
        const nextId = `draft_${draftStore.size + 1}`;
        const draft = {
          id: nextId,
          ...clone(payload),
        };
        draftStore.set(nextId, draft);
        return draft;
      },
      getReadingReceiptDraftByIdForUser: async (_userId, draftId) => clone(draftStore.get(draftId) || null),
      ...(options?.applyDependencyOverrides || {}),
    };
  }

  async function turn({
    message = fixture.turn?.userMessage,
    rawModelPayload = fixture.turn?.rawModelPayload,
    sessionId = state.session.id,
    documentKey = currentFocusedDocumentKey(),
  } = {}) {
    const requestBody = {
      projectKey: state.project.projectKey,
      sessionId,
      documentKey,
      message,
    };
    const response = await handleRoomTurnPost(makeRequest(requestBody), buildTurnDeps(rawModelPayload));
    return {
      requestBody,
      response,
      snapshotAfter: currentSnapshot(),
      fetchCall: fetchCalls.at(-1) || null,
    };
  }

  async function applyPreview({
    assistantMessageId = "",
    sessionId = state.session.id,
    documentKey = currentFocusedDocumentKey(),
  } = {}) {
    const resolvedAssistantMessageId =
      normalizeText(assistantMessageId) ||
      normalizeText(
        [...(Array.isArray(state.messages) ? state.messages : [])]
          .reverse()
          .find((message) => normalizeText(message?.role).toLowerCase() === "assistant")?.id,
      );
    const requestBody = {
      projectKey: state.project.projectKey,
      sessionId,
      documentKey,
      action: "apply_proposal_preview",
      assistantMessageId: resolvedAssistantMessageId,
    };
    const response = await handleRoomApplyPost(makeRequest(requestBody), buildApplyDeps());
    return {
      requestBody,
      response,
      snapshotAfter: currentSnapshot(),
    };
  }

  async function completeReceiptKit({
    receiptKit = fixture.receiptAction?.receiptKit,
    completion = fixture.receiptAction?.completion,
    sessionId = state.session.id,
    documentKey = currentFocusedDocumentKey(),
  } = {}) {
    const requestBody = {
      projectKey: state.project.projectKey,
      sessionId,
      documentKey,
      action: "complete_receipt_kit",
      receiptKit,
      completion,
    };
    const response = await handleRoomApplyPost(makeRequest(requestBody), buildApplyDeps());
    return {
      requestBody,
      response,
      snapshotAfter: currentSnapshot(),
    };
  }

  return {
    fixture,
    fetchCalls,
    snapshot: currentSnapshot,
    getState: () => state,
    turn,
    applyPreview,
    completeReceiptKit,
  };
}

export async function runRoomRouteJourney(
  fixture,
  { writeDossierArtifacts = true, artifactRoot = "test-results/room-route-journeys" } = {},
) {
  const harness = createRoomRouteHarness(fixture);
  const initialSnapshot = harness.snapshot();

  let turnRequestBody = null;
  let turnResult = null;
  let turnFetchBody = null;
  let turnRawModelPayload = null;
  if (fixture.turn) {
    const turn = await harness.turn();
    turnRequestBody = turn.requestBody;
    turnResult = turn.response;
    turnFetchBody = turn.fetchCall?.options?.body ? JSON.parse(turn.fetchCall.options.body) : null;
    turnRawModelPayload = clone(fixture.turn.rawModelPayload);
  }

  let applyRequestBody = null;
  let applyResult = null;
  if (fixture.applyPreview) {
    const apply = await harness.applyPreview({
      assistantMessageId: turnResult?.body?.messageId || "",
    });
    applyRequestBody = apply.requestBody;
    applyResult = apply.response;
  }

  let receiptRequestBody = null;
  let receiptResult = null;
  if (fixture.receiptAction) {
    const receipt = await harness.completeReceiptKit();
    receiptRequestBody = receipt.requestBody;
    receiptResult = receipt.response;
  }

  const finalSnapshot = harness.snapshot();
  const result = {
    fixture,
    initialSnapshot,
    initialTurnSnapshot: initialSnapshot,
    turnRequestBody,
    turnFetchBody,
    turnRawModelPayload,
    turnResult,
    applyRequestBody,
    applyResult,
    receiptRequestBody,
    receiptResult,
    fetchCalls: harness.fetchCalls,
    finalSource: harness.getState().roomSource,
    finalSnapshot,
  };

  if (writeDossierArtifacts) {
    result.dossierDir = await emitRouteJourneyDossier(result, { rootDir: artifactRoot });
  }

  return result;
}
