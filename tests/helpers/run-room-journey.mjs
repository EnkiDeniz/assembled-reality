import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildRoomPayloadCitations,
  makeRoomId,
  normalizeRoomTurnResult,
} from "../../src/lib/room.js";
import { buildWorkingEcho } from "../../src/lib/room-working-echo.js";
import {
  applyArtifactToRuntimeWindow,
  buildRoomCanonicalViewModel,
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
  runRoomProposalGate,
} from "../../src/lib/room-canonical.js";
import {
  applyRoomTurnGuardrails,
  buildRoomSemanticContext,
  buildSafeFallbackTurn,
  classifyRoomTurnMode,
  coerceConversationTurn,
  hasCanonicalProposalSegments,
} from "../../src/lib/room-turn-policy.mjs";
import {
  buildRoomPromptPacket,
  parseRoomResponsesPayload,
} from "../../src/lib/room-turn-service.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hashValue(value) {
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

function buildRoomDocument(state = {}, runtimeWindow = null) {
  const projectKey = normalizeText(state?.project?.projectKey) || "room_default";
  return {
    documentKey: normalizeText(state?.roomDocument?.documentKey) || `room_${projectKey}`,
    title: normalizeText(state?.roomDocument?.title) || `${normalizeText(state?.project?.title) || "Box"} Room`,
    updatedAt: "2026-04-11T00:00:00.000Z",
    seedMeta: {
      roomDocument: true,
      roomRuntimeWindow: clone(runtimeWindow),
    },
  };
}

function buildAuthorityContext({
  project = null,
  session = null,
  roomDocument = null,
  recentSources = [],
  canonicalView = null,
  focusedWitness = null,
  adjacent = null,
} = {}) {
  return {
    project: project
      ? {
          projectKey: project.projectKey,
          title: project.title || "Untitled Box",
          subtitle: project.subtitle || "",
        }
      : null,
    session: session
      ? {
          id: session.id,
          title: session.title,
          handoffSummary: session.handoffSummary || "",
          isArchived: Boolean(session.isArchived),
          isActive: Boolean(session.isActive),
        }
      : null,
    canonSource: roomDocument
      ? {
          documentKey: roomDocument.documentKey,
          title: roomDocument.title,
        }
      : null,
    sources: Array.isArray(recentSources) ? clone(recentSources) : [],
    assembly: roomDocument
      ? {
          documentKey: roomDocument.documentKey,
          title: roomDocument.title,
        }
      : null,
    focusedWitness: focusedWitness || null,
    adjacent: adjacent && typeof adjacent === "object" ? clone(adjacent) : { operate: null },
    artifact: canonicalView?.roomSourceSummary || {
      clauseCount: 0,
      compileState: "unknown",
      runtimeState: "open",
      mergedWindowState: "open",
    },
    runtime: {
      state: normalizeText(canonicalView?.fieldState?.key).toLowerCase() || "open",
      waiting: Boolean(canonicalView?.interaction?.paneContract?.waiting),
      nextBestAction: normalizeText(canonicalView?.interaction?.nextBestAction),
    },
    mirror: canonicalView?.mirror || null,
    diagnostics: Array.isArray(canonicalView?.diagnostics) ? clone(canonicalView.diagnostics) : [],
    resetAt: "2026-04-11T00:00:00.000Z",
  };
}

export function buildJourneyView(state = {}) {
  const roomDocument = buildRoomDocument(state, state.runtimeWindow);
  const artifact = compileRoomSource({
    source: state.roomSource,
    filename: `${roomDocument.documentKey}.loe`,
  });
  const runtimeWindow = createOrHydrateRoomRuntimeWindow(roomDocument, artifact);
  const canonicalView = buildRoomCanonicalViewModel({
    roomDocument,
    artifact,
    runtimeWindow,
    messages: state.messages,
    recentSources: state.recentSources,
    receiptDrafts: state.receiptDrafts,
    deepLinks: state.deepLinks || null,
    latestReceiptKit: state.latestReceiptKit || null,
  });
  const adjacent = state.adjacent && typeof state.adjacent === "object" ? state.adjacent : { operate: null };
  const focusedWitness = state.focusedWitness || null;
  const authorityContext = buildAuthorityContext({
    project: state.project,
    session: state.session,
    roomDocument,
    recentSources: state.recentSources,
    canonicalView,
    focusedWitness,
    adjacent,
  });
  const workingEcho = buildWorkingEcho({
    canonicalView,
    messages: state.messages,
    recentSources: state.recentSources,
    focusedWitness,
    activeSession: state.session,
  });

  return {
    roomDocument,
    artifact,
    runtimeWindow,
    view: {
      project: {
        projectKey: state.project.projectKey,
        title: state.project.title,
        subtitle: state.project.subtitle || "",
      },
      roomIdentity: {
        boxTitle: state.project.title,
        conversationTitle: state.session.title,
        canonScopeLabel: "Canon stays box-level across conversations.",
      },
      session: clone(state.session),
      sessions: clone(state.sessions || [state.session]),
      authorityContext,
      focusedWitness,
      adjacent,
      workingEcho,
      resetAt: "2026-04-11T00:00:00.000Z",
      ...canonicalView,
    },
  };
}

function buildPromptContextSummary({ fixture, view, turnNumber, turnMode }) {
  return {
    fixtureId: fixture.id,
    boxKey: normalizeText(view?.project?.projectKey),
    sessionId: normalizeText(view?.session?.id),
    turnNumber,
    turnMode,
    hasStructure: Boolean(view?.hasStructure),
    recentThreadCount: Array.isArray(view?.messages) ? view.messages.length : 0,
    recentSourceCount: Array.isArray(view?.recentSources) ? view.recentSources.length : 0,
    recentReturnCount: Array.isArray(view?.recentReturns) ? view.recentReturns.length : 0,
    handoffSummaryPresent: Boolean(normalizeText(view?.session?.handoffSummary)),
  };
}

function createThreadMessage(id, role, content, roomPayload = null) {
  return {
    id,
    role,
    content,
    citations: role === "assistant" ? buildRoomPayloadCitations(roomPayload) : [],
    roomPayload: role === "assistant" ? normalizeRoomTurnResult(roomPayload) : null,
  };
}

function summarizeGate(gate = null) {
  if (!gate) return null;
  return {
    accepted: Boolean(gate.accepted),
    reason: normalizeText(gate.reason),
    diagnostics: Array.isArray(gate.diagnostics)
      ? gate.diagnostics.map((diagnostic) => ({
          code: normalizeText(diagnostic?.code),
          severity: normalizeText(diagnostic?.severity),
          message: normalizeText(diagnostic?.message),
        }))
      : [],
    nextSourceHash: hashValue(gate.nextSource || ""),
    gatePreview: clone(gate.gatePreview),
  };
}

function countReturnClauses(artifact = null) {
  return Array.isArray(artifact?.ast)
    ? artifact.ast.filter((clause) => clause?.head === "RTN").length
    : 0;
}

function buildApplyEvent({ kind, proposalId = "", assistantMessageId = "", detail = "" } = {}) {
  return {
    kind,
    proposalId: normalizeText(proposalId),
    assistantMessageId: normalizeText(assistantMessageId),
    detail: normalizeText(detail),
  };
}

function buildReturnEvent(actual = "", provenanceLabel = "") {
  return {
    kind: "return_received",
    actual: normalizeText(actual),
    provenanceLabel: normalizeText(provenanceLabel).toLowerCase(),
  };
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

function buildJourneyReport(result) {
  const turnStage = result.turnStage;
  const applyStage = result.applyStage;
  const classifiedTurnMode = turnStage?.stagePacket?.classifiedTurnMode || "unknown";

  return [
    `# ${result.fixture.id}`,
    "",
    result.fixture.description || "",
    "",
    "## User turn",
    "",
    result.fixture.turn.userMessage,
    "",
    "## Turn summary",
    "",
    `- classified mode: ${classifiedTurnMode}`,
    `- preview present after turn: ${turnStage.flags.previewPresent ? "yes" : "no"}`,
    `- gate accepted: ${
      turnStage.gateResult ? (turnStage.gateResult.accepted ? "yes" : "no") : "n/a"
    }`,
    `- source mutated on turn: ${turnStage.flags.sourceMutated ? "yes" : "no"}`,
    `- runtime mutated on turn: ${turnStage.flags.runtimeMutated ? "yes" : "no"}`,
    "",
    "## Final verdict",
    "",
    `- preview only after turn: ${turnStage.flags.previewPresent && !turnStage.flags.sourceMutated ? "yes" : "no"}`,
    `- canonical mutation after apply: ${applyStage ? (applyStage.flags.sourceMutated ? "yes" : "no") : "no"}`,
    `- runtime mutation after apply: ${applyStage ? (applyStage.flags.runtimeMutated ? "yes" : "no") : "no"}`,
    "",
    "## Notes",
    "",
    applyStage
      ? `Apply stage used assistant message ${applyStage.assistantMessageId}.`
      : "No apply stage was executed for this journey.",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function emitJourneyDossier(result, { rootDir = "test-results/room-turn-journeys" } = {}) {
  const dossierDir = join(rootDir, result.fixture.id);
  await rm(dossierDir, { recursive: true, force: true });
  await mkdir(dossierDir, { recursive: true });

  await writeJson(join(dossierDir, "00-fixture.json"), result.fixture);
  await writeText(join(dossierDir, "01-initial-room-source.loe"), result.initialSnapshot.source);
  await writeJson(join(dossierDir, "02-initial-artifact.json"), result.initialSnapshot.artifact);
  await writeJson(join(dossierDir, "03-initial-runtime.json"), result.initialSnapshot.runtimeWindow);
  await writeText(join(dossierDir, "04-user-turn.txt"), result.fixture.turn.userMessage);
  await writeJson(join(dossierDir, "05-turn-stage-packet.json"), result.turnStage.stagePacket);
  await writeJson(join(dossierDir, "06-raw-model-payload.json"), result.turnStage.rawModelPayload);
  await writeJson(join(dossierDir, "07-guarded-turn.json"), result.turnStage.guardedTurn);
  await writeJson(join(dossierDir, "08-gate-result.json"), result.turnStage.gateResult);
  await writeJson(join(dossierDir, "09-thread-after-turn.json"), result.turnStage.threadAfterTurn);
  await writeJson(join(dossierDir, "10-view-after-turn.json"), result.turnStage.viewAfterTurn);

  let artifactIndex = 11;
  if (result.reloadedView) {
    await writeJson(join(dossierDir, "11-view-after-reload.json"), result.reloadedView);
    artifactIndex += 1;
  }

  if (result.applyStage) {
    const base = artifactIndex;
    await writeJson(join(dossierDir, `${String(base).padStart(2, "0")}-apply-stage-packet.json`), result.applyStage.stagePacket);
    await writeText(join(dossierDir, `${String(base + 1).padStart(2, "0")}-room-source-after-apply.loe`), result.applyStage.sourceAfterApply);
    await writeJson(join(dossierDir, `${String(base + 2).padStart(2, "0")}-artifact-after-apply.json`), result.applyStage.artifactAfterApply);
    await writeJson(join(dossierDir, `${String(base + 3).padStart(2, "0")}-runtime-after-apply.json`), result.applyStage.runtimeAfterApply);
    await writeJson(join(dossierDir, `${String(base + 4).padStart(2, "0")}-view-after-apply.json`), result.applyStage.viewAfterApply);
    await buildSourceDiffPatch(dossierDir, result.initialSnapshot.source, result.applyStage.sourceAfterApply);
    await writeText(
      join(dossierDir, "17-artifact-diff.md"),
      buildStateDiffMarkdown("Artifact diff", result.initialSnapshot.artifact, result.applyStage.artifactAfterApply, [
        `clauseCount: ${Number(result.initialSnapshot.artifact?.stats?.clauseCount) || 0} -> ${
          Number(result.applyStage.artifactAfterApply?.stats?.clauseCount) || 0
        }`,
        `compileState: ${normalizeText(result.initialSnapshot.artifact?.compileState) || "unknown"} -> ${
          normalizeText(result.applyStage.artifactAfterApply?.compileState) || "unknown"
        }`,
      ]),
    );
    await writeText(
      join(dossierDir, "18-runtime-diff.md"),
      buildStateDiffMarkdown(
        "Runtime diff",
        result.initialSnapshot.runtimeWindow,
        result.applyStage.runtimeAfterApply,
        [
          `state: ${normalizeText(result.initialSnapshot.runtimeWindow?.state) || "open"} -> ${
            normalizeText(result.applyStage.runtimeAfterApply?.state) || "open"
          }`,
          `eventCount: ${Array.isArray(result.initialSnapshot.runtimeWindow?.events) ? result.initialSnapshot.runtimeWindow.events.length : 0} -> ${
            Array.isArray(result.applyStage.runtimeAfterApply?.events) ? result.applyStage.runtimeAfterApply.events.length : 0
          }`,
          `receiptCount: ${Array.isArray(result.initialSnapshot.runtimeWindow?.receipts) ? result.initialSnapshot.runtimeWindow.receipts.length : 0} -> ${
            Array.isArray(result.applyStage.runtimeAfterApply?.receipts) ? result.applyStage.runtimeAfterApply.receipts.length : 0
          }`,
        ],
      ),
    );
    await writeText(join(dossierDir, "19-report.md"), buildJourneyReport(result));
  } else {
    await writeText(join(dossierDir, "11-report.md"), buildJourneyReport(result));
  }

  if (process.env.ROOM_JOURNEY_DEBUG_PROMPTS === "1") {
    await writeText(join(dossierDir, "debug-system-prompt.txt"), result.turnStage.promptPacket.systemPrompt);
    await writeText(join(dossierDir, "debug-user-prompt.txt"), result.turnStage.promptPacket.userPrompt);
  }

  return dossierDir;
}

function summarizeJourneyResult(result) {
  const classifiedTurnMode = result.turnStage?.stagePacket?.classifiedTurnMode || "unknown";
  const turnGateAccepted = result.turnStage.gateResult
    ? result.turnStage.gateResult.accepted
      ? "yes"
      : "no"
    : "n/a";
  const diagnostics = Array.isArray(result.turnStage.gateResult?.diagnostics)
    ? result.turnStage.gateResult.diagnostics.length
    : 0;

  return [
    "room-turn-journeys",
    result.fixture.id,
    `mode=${classifiedTurnMode}`,
    `preview=${result.turnStage.flags.previewPresent ? "yes" : "no"}`,
    `gate=${turnGateAccepted}`,
    `sourceMutated(turn)=${result.turnStage.flags.sourceMutated ? "yes" : "no"}`,
    `sourceMutated(apply)=${result.applyStage ? (result.applyStage.flags.sourceMutated ? "yes" : "no") : "n/a"}`,
    `runtimeMutated(apply)=${result.applyStage ? (result.applyStage.flags.runtimeMutated ? "yes" : "no") : "n/a"}`,
    `diagnostics=${diagnostics}`,
  ].join(" ");
}

export async function runRoomJourney(
  fixture,
  { writeDossierArtifacts = true, artifactRoot = "test-results/room-turn-journeys" } = {},
) {
  const initialState = clone(fixture.initialState);
  const initialSnapshot = buildJourneyView(initialState);
  const turnNumber = (Array.isArray(initialState.messages) ? initialState.messages.length : 0) + 1;
  const classifiedTurnMode = classifyRoomTurnMode({
    message: fixture.turn.userMessage,
    view: initialSnapshot.view,
  });
  const promptPacket = buildRoomPromptPacket({
    message: fixture.turn.userMessage,
    view: initialSnapshot.view,
    roomSource: initialState.roomSource,
    turnNumber,
    turnMode: classifiedTurnMode,
  });
  const promptHash = hashValue({
    systemPrompt: promptPacket.systemPrompt,
    userPrompt: promptPacket.userPrompt,
  });
  const promptContextSummary = buildPromptContextSummary({
    fixture,
    view: initialSnapshot.view,
    turnNumber,
    turnMode: classifiedTurnMode,
  });
  const rawModelPayload = clone(fixture.turn.rawModelPayload);
  const parsedModelTurn = parseRoomResponsesPayload(rawModelPayload);
  const modelTurnInput = parsedModelTurn
    ? {
        ...parsedModelTurn,
        proposalId: fixture.turn.proposalId || makeRoomId("proposal"),
        turnMode: classifiedTurnMode,
      }
    : buildSafeFallbackTurn();
  const guardedTurn = applyRoomTurnGuardrails(modelTurnInput, {
    requestedTurnMode: classifiedTurnMode,
  });
  const normalizedTurn = normalizeRoomTurnResult({
    ...guardedTurn,
    proposalId: normalizeText(guardedTurn?.proposalId || modelTurnInput?.proposalId) || makeRoomId("proposal"),
    turnMode: guardedTurn?.turnMode || classifiedTurnMode,
  });

  let gate = null;
  let persistedTurn;
  if (normalizedTurn.turnMode === "conversation" || !hasCanonicalProposalSegments(normalizedTurn)) {
    persistedTurn = normalizeRoomTurnResult(coerceConversationTurn(normalizedTurn));
  } else {
    gate = runRoomProposalGate({
      currentSource: initialState.roomSource,
      proposal: normalizedTurn,
      filename: `${initialSnapshot.roomDocument.documentKey}.loe`,
      runtimeWindow: initialSnapshot.runtimeWindow,
      semanticContext: buildRoomSemanticContext({
        currentSource: initialState.roomSource,
        recentSources: initialSnapshot.view.recentSources,
        latestUserMessage: fixture.turn.userMessage,
      }),
    });
    persistedTurn = normalizeRoomTurnResult({
      ...normalizedTurn,
      turnMode: "proposal",
      gatePreview: gate.gatePreview,
    });
  }

  const assistantMessageId = fixture.turn.assistantMessageId || `${fixture.id}-assistant-1`;
  const userMessageId = fixture.turn.userMessageId || `${fixture.id}-user-1`;
  const stateAfterTurn = clone(initialState);
  stateAfterTurn.messages = [
    ...(Array.isArray(stateAfterTurn.messages) ? stateAfterTurn.messages : []),
    createThreadMessage(userMessageId, "user", fixture.turn.userMessage, null),
    createThreadMessage(assistantMessageId, "assistant", persistedTurn.assistantText, persistedTurn),
  ];
  const afterTurnSnapshot = buildJourneyView(stateAfterTurn);
  const turnStage = {
    rawModelPayload,
    promptPacket,
    guardedTurn: clone(guardedTurn),
    gateResult: summarizeGate(gate),
    threadAfterTurn: clone(stateAfterTurn.messages),
    viewAfterTurn: clone(afterTurnSnapshot.view),
    stagePacket: {
      fixtureId: fixture.id,
      boxKey: normalizeText(initialState.project?.projectKey),
      sessionId: normalizeText(initialState.session?.id),
      requestedTurn: fixture.turn.userMessage,
      classifiedTurnMode,
      promptHash,
      promptContextSummary,
      rawModelPayloadHash: hashValue(rawModelPayload),
      parsedModelTurn: clone(parsedModelTurn),
      guardedTurn: clone(guardedTurn),
      gateResult: summarizeGate(gate),
      persistedThreadResult: {
        userMessageId,
        assistantMessageId,
        threadMessageCount: stateAfterTurn.messages.length,
      },
      rebuiltView: clone(afterTurnSnapshot.view),
      flags: {
        previewPresent: Boolean(afterTurnSnapshot.view.activePreview),
        sourceMutated: false,
        runtimeMutated: false,
      },
    },
    flags: {
      previewPresent: Boolean(afterTurnSnapshot.view.activePreview),
      sourceMutated: false,
      runtimeMutated: false,
    },
  };

  let reloadedView = null;
  if (fixture.reloadAfterTurn) {
    reloadedView = clone(buildJourneyView(stateAfterTurn).view);
  }

  let applyStage = null;
  if (fixture.applyPreview) {
    assert.ok(
      hasCanonicalProposalSegments(persistedTurn),
      `Fixture ${fixture.id} requested applyPreview without canonical proposal segments.`,
    );
    const beforeApplySnapshot = buildJourneyView(stateAfterTurn);
    const applyGate = runRoomProposalGate({
      currentSource: stateAfterTurn.roomSource,
      proposal: persistedTurn,
      filename: `${beforeApplySnapshot.roomDocument.documentKey}.loe`,
      runtimeWindow: beforeApplySnapshot.runtimeWindow,
      semanticContext: buildRoomSemanticContext({
        currentSource: stateAfterTurn.roomSource,
        recentSources: beforeApplySnapshot.view.recentSources,
        latestUserMessage:
          [...stateAfterTurn.messages]
            .reverse()
            .find((message) => normalizeText(message?.role).toLowerCase() === "user")?.content || "",
      }),
    });

    assert.equal(
      applyGate.accepted,
      true,
      `Fixture ${fixture.id} expected apply to be lawful but gate rejected it.`,
    );

    let nextRuntimeWindow = applyArtifactToRuntimeWindow(beforeApplySnapshot.runtimeWindow, applyGate.artifact, {
      previousArtifact: beforeApplySnapshot.artifact,
      event: buildApplyEvent({
        kind: "proposal_applied",
        proposalId: persistedTurn.proposalId,
        assistantMessageId,
        detail: "Applied accepted Room proposal.",
      }),
    });

    if (countReturnClauses(applyGate.artifact) > countReturnClauses(beforeApplySnapshot.artifact)) {
      const latestReturn = applyGate.artifact.ast.filter((clause) => clause.head === "RTN").at(-1);
      nextRuntimeWindow = {
        ...nextRuntimeWindow,
        events: [
          ...(Array.isArray(nextRuntimeWindow.events) ? nextRuntimeWindow.events : []),
          {
            ...buildReturnEvent(
              latestReturn?.positional?.[0]?.value || latestReturn?.positional?.[0]?.raw,
              latestReturn?.keywords?.via?.value || "user",
            ),
            id: `evt_${(Array.isArray(nextRuntimeWindow.events) ? nextRuntimeWindow.events.length : 0) + 1}`,
            createdAt: "2026-04-11T00:00:00.000Z",
          },
        ],
      };
    }

    const stateAfterApply = clone(stateAfterTurn);
    stateAfterApply.roomSource = applyGate.nextSource;
    stateAfterApply.runtimeWindow = nextRuntimeWindow;
    const afterApplySnapshot = buildJourneyView(stateAfterApply);
    const sourceMutated = hashValue(beforeApplySnapshot.roomDocument ? stateAfterTurn.roomSource : "") !== hashValue(applyGate.nextSource);
    const runtimeMutated = hashValue(beforeApplySnapshot.runtimeWindow) !== hashValue(afterApplySnapshot.runtimeWindow);

    applyStage = {
      assistantMessageId,
      sourceAfterApply: stateAfterApply.roomSource,
      artifactAfterApply: clone(afterApplySnapshot.artifact),
      runtimeAfterApply: clone(afterApplySnapshot.runtimeWindow),
      viewAfterApply: clone(afterApplySnapshot.view),
      stagePacket: {
        actionType: "apply_proposal_preview",
        proposalReloadSource: {
          assistantMessageId,
          proposalId: persistedTurn.proposalId,
        },
        gateResult: summarizeGate(applyGate),
        compileResult: {
          clauseCount: Number(afterApplySnapshot.artifact?.stats?.clauseCount) || 0,
          compileState: normalizeText(afterApplySnapshot.artifact?.compileState) || "unknown",
          runtimeState: normalizeText(afterApplySnapshot.artifact?.runtimeState) || "open",
        },
        sourceBeforeHash: hashValue(stateAfterTurn.roomSource),
        sourceAfterHash: hashValue(stateAfterApply.roomSource),
        runtimeBeforeHash: hashValue(beforeApplySnapshot.runtimeWindow),
        runtimeAfterHash: hashValue(afterApplySnapshot.runtimeWindow),
        appliedClauses: Array.isArray(persistedTurn.segments)
          ? persistedTurn.segments.map((segment) => segment?.suggestedClause).filter(Boolean)
          : [],
        rebuiltView: clone(afterApplySnapshot.view),
        flags: {
          sourceMutated,
          runtimeMutated,
        },
      },
      flags: {
        sourceMutated,
        runtimeMutated,
      },
    };
  }

  const result = {
    fixture: clone(fixture),
    initialSnapshot: {
      source: initialState.roomSource,
      artifact: clone(initialSnapshot.artifact),
      runtimeWindow: clone(initialSnapshot.runtimeWindow),
      view: clone(initialSnapshot.view),
    },
    turnStage,
    reloadedView,
    applyStage,
  };

  if (writeDossierArtifacts) {
    result.dossierDir = await emitJourneyDossier(result, { rootDir: artifactRoot });
  }

  console.log(summarizeJourneyResult(result));
  return result;
}
