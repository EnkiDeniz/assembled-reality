import {
  applyClosureState,
  appendEvent,
  appendReceipt,
  createWindowState,
} from "../../LoegosCLI/packages/runtime/src/index.mjs";
import { compileSource } from "../../LoegosCLI/packages/compiler/src/index.mjs";
import { applySevenProposalGate } from "../../LoegosCLI/UX/lib/proposal-gate.mjs";
import {
  buildBoxSectionsFromArtifact,
  buildEchoFieldModel,
  clauseSummary,
  deriveDistantEchoSignal,
  derivePaneInteractionContract,
  deriveStateChipModel,
  extractClausesByHead,
  getClauseKeyword,
} from "../../LoegosCLI/UX/lib/artifact-view-model.mjs";
import { getRoomFieldStateTone } from "@/lib/room";
import { auditRoomProposalSemantics, hasCanonicalProposalSegments } from "@/lib/room-turn-policy.mjs";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function tokenToText(token = null) {
  if (!token) return "";
  return String(token.value || token.raw || "").trim();
}

function humanizeRef(value = "") {
  return normalizeText(value)
    .replace(/^@/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isBoxClause(clause = null) {
  return clause?.head === "GND" && clause?.verb === "box";
}

function isPristineRoomArtifact(artifact = null) {
  const clauses = Array.isArray(artifact?.ast) ? artifact.ast : [];
  return clauses.length === 1 && isBoxClause(clauses[0]);
}

function summarizeDiagnostics(diagnostics = []) {
  return (Array.isArray(diagnostics) ? diagnostics : [])
    .filter(Boolean)
    .map((diagnostic) => ({
      code: normalizeText(diagnostic?.code) || "diag",
      severity: normalizeText(diagnostic?.severity).toLowerCase() || "info",
      message: normalizeText(diagnostic?.message),
      line: Number.isFinite(Number(diagnostic?.span?.line)) ? Number(diagnostic.span.line) : null,
    }))
    .filter((diagnostic) => diagnostic.message)
    .slice(0, 8);
}

function buildArtifactSummary(artifact = null, runtimeWindow = null) {
  const echoField = buildEchoFieldModel(artifact, runtimeWindow);
  return {
    compileState: normalizeText(artifact?.compileState).toLowerCase() || "unknown",
    runtimeState: normalizeText(artifact?.runtimeState).toLowerCase() || "open",
    mergedWindowState:
      normalizeText(artifact?.mergedWindowState || runtimeWindow?.state).toLowerCase() || "open",
    clauseCount: Math.max(0, Number(artifact?.stats?.clauseCount) || 0),
    fieldState: normalizeText(echoField.fieldState).toLowerCase() || "fog",
    waiting: Boolean(echoField.waiting),
    pingSent: Boolean(echoField.pingSent),
  };
}

export function compileRoomSource({ source = "", filename = "room.loe" } = {}) {
  return compileSource({ source, filename });
}

function hasStrictPingViolation(artifact = null) {
  const moves = extractClausesByHead(artifact, "MOV");
  const tests = extractClausesByHead(artifact, "TST");
  return moves.length > 0 && tests.length === 0;
}

export function createOrHydrateRoomRuntimeWindow(roomDocument = null, artifact = null) {
  const stored = roomDocument?.seedMeta?.roomRuntimeWindow;
  const normalizedStored = stored && typeof stored === "object" ? stored : null;
  const nextWindow = normalizedStored
    ? {
        ...normalizedStored,
        events: Array.isArray(normalizedStored.events) ? normalizedStored.events : [],
        receipts: Array.isArray(normalizedStored.receipts) ? normalizedStored.receipts : [],
      }
    : createWindowState({
        windowId: `room:${normalizeText(roomDocument?.documentKey) || "default"}`,
        filePath: normalizeText(roomDocument?.documentKey) || "room.loe",
        compileResult: artifact,
      });

  return syncRuntimeWindowWithArtifact(nextWindow, artifact);
}

export function syncRuntimeWindowWithArtifact(runtimeWindow = null, artifact = null) {
  const current = runtimeWindow && typeof runtimeWindow === "object" ? { ...runtimeWindow } : {};
  const events = Array.isArray(current.events) ? current.events : [];
  const receipts = Array.isArray(current.receipts) ? current.receipts : [];

  return {
    ...current,
    updatedAt: new Date().toISOString(),
    state: normalizeText(artifact?.mergedWindowState).toLowerCase() || normalizeText(current.state).toLowerCase() || "open",
    compile: {
      compilationId: normalizeText(artifact?.compilationId),
      diagnostics: Array.isArray(artifact?.diagnostics) ? artifact.diagnostics : [],
      summary:
        artifact?.summary && typeof artifact.summary === "object"
          ? artifact.summary
          : current.compile?.summary || { ok: true, hardErrorCount: 0, warningCount: 0 },
      closureVerb: normalizeText(artifact?.metadata?.activeClosureVerb) || null,
    },
    events,
    receipts,
  };
}

export function buildRoomGatePreview(gate = null, runtimeWindow = null) {
  const artifact = gate?.artifact || null;
  const previewWindow = artifact ? syncRuntimeWindowWithArtifact(runtimeWindow, artifact) : runtimeWindow;
  const pane = derivePaneInteractionContract(artifact, previewWindow);

  return {
    accepted: Boolean(gate?.accepted),
    reason: normalizeText(gate?.reason).toLowerCase(),
    diagnostics: summarizeDiagnostics(gate?.diagnostics),
    artifactSummary: buildArtifactSummary(artifact, previewWindow),
    nextBestAction: normalizeText(pane?.nextBestAction),
  };
}

export function runRoomProposalGate({
  currentSource = "",
  proposal = null,
  filename = "room.loe",
  runtimeWindow = null,
  semanticContext = null,
} = {}) {
  const currentArtifact = compileRoomSource({ source: currentSource, filename });
  const semanticAudit = hasCanonicalProposalSegments(proposal)
    ? auditRoomProposalSemantics({ proposal, context: semanticContext })
    : { accepted: true, reason: "", diagnostics: [] };

  if (!semanticAudit.accepted) {
    const rejectedGate = {
      accepted: false,
      reason: semanticAudit.reason || "semantic_reject",
      diagnostics: semanticAudit.diagnostics,
      artifact: currentArtifact,
      nextSource: currentSource,
    };

    return {
      ...rejectedGate,
      gatePreview: buildRoomGatePreview(rejectedGate, runtimeWindow),
    };
  }

  const gate = applySevenProposalGate({
    currentSource,
    proposal,
    filename,
  });
  const gateWithSemanticDiagnostics = semanticAudit.diagnostics.length
    ? {
        ...gate,
        diagnostics: [
          ...(Array.isArray(gate.diagnostics) ? gate.diagnostics : []),
          ...semanticAudit.diagnostics,
        ],
      }
    : gate;

  if (gateWithSemanticDiagnostics.accepted && hasStrictPingViolation(gateWithSemanticDiagnostics.artifact)) {
    const diagnostics = [
      ...(Array.isArray(gateWithSemanticDiagnostics.diagnostics)
        ? gateWithSemanticDiagnostics.diagnostics
        : []),
      {
        code: "RM001",
        severity: "error",
        message: "Ping requires both MOV and TST clauses.",
        span: { line: 1, startCol: 1, endCol: 1 },
      },
    ];
    return {
      ...gateWithSemanticDiagnostics,
      accepted: false,
      reason: "ping_requires_test",
      diagnostics,
      nextSource: currentSource,
      gatePreview: buildRoomGatePreview(
        {
          ...gateWithSemanticDiagnostics,
          accepted: false,
          reason: "ping_requires_test",
          diagnostics,
        },
        runtimeWindow,
      ),
    };
  }

  return {
    ...gateWithSemanticDiagnostics,
    gatePreview: buildRoomGatePreview(gateWithSemanticDiagnostics, runtimeWindow),
  };
}

function buildEvidenceItems(artifact = null) {
  return extractClausesByHead(artifact, "GND")
    .filter((clause) => !isBoxClause(clause))
    .map((clause, index) => {
      const refText = humanizeRef(tokenToText(clause.positional[0]));
      const from = normalizeText(getClauseKeyword(clause, "from"));
      const withIdentity = normalizeText(getClauseKeyword(clause, "with"));
      const asKind = normalizeText(getClauseKeyword(clause, "as"));
      const title =
        normalizeLongText(tokenToText(clause.positional[0])) && clause.positional[0]?.type === "string"
          ? tokenToText(clause.positional[0])
          : refText || titleCase(clause.verb);
      const detailParts = [];
      if (from) detailParts.push(from);
      if (withIdentity) detailParts.push(withIdentity);
      if (asKind) detailParts.push(asKind);
      return {
        id: `evidence-${index + 1}`,
        line: clause?.span?.line || index + 1,
        title,
        detail: detailParts.join(" • "),
        formal: clauseSummary(clause),
        provenance: from || "",
      };
    });
}

function buildStoryItems(artifact = null) {
  return extractClausesByHead(artifact, "INT")
    .filter((clause) => clause.verb === "story")
    .map((clause, index) => ({
      id: `story-${index + 1}`,
      line: clause?.span?.line || index + 1,
      text: tokenToText(clause.positional[0]) || titleCase(clause.verb),
      detail: "",
      formal: clauseSummary(clause),
    }));
}

function buildMoveItems(artifact = null, runtimeWindow = null) {
  const moves = extractClausesByHead(artifact, "MOV");
  const tests = extractClausesByHead(artifact, "TST");
  const field = buildEchoFieldModel(artifact, runtimeWindow);

  return moves.map((clause, index) => {
    const testClause = tests[index] || null;
    const text = tokenToText(clause.positional[0]) || titleCase(clause.verb);
    const expected = tokenToText(testClause?.positional?.[0]);
    return {
      id: `move-${index + 1}`,
      line: clause?.span?.line || index + 1,
      text,
      detail: expected ? `Test: ${expected}` : "",
      status:
        field.waiting && index === moves.length - 1
          ? "awaiting"
          : extractClausesByHead(artifact, "RTN").length > index
            ? "completed"
            : "suggested",
      expected,
      via: normalizeText(getClauseKeyword(clause, "via")).toLowerCase() || "manual",
      formal: clauseSummary(clause),
      testFormal: testClause ? clauseSummary(testClause) : "",
    };
  });
}

function deriveReturnResult(returnVerb = "") {
  const normalized = normalizeText(returnVerb).toLowerCase();
  if (normalized === "contradict") return "contradicted";
  if (normalized === "observe") return "surprised";
  return "matched";
}

function normalizeProvenanceLabel(value = "", fallback = "user_entered") {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return fallback;
  return normalized;
}

function buildReturnEntriesFromArtifact(artifact = null) {
  const returns = extractClausesByHead(artifact, "RTN");
  const tests = extractClausesByHead(artifact, "TST");

  return returns.map((clause, index) => {
    const latestTest = tests[Math.max(0, Math.min(index, tests.length - 1))] || tests.at(-1) || null;
    const via = normalizeText(getClauseKeyword(clause, "via")).toLowerCase();
    const actual = tokenToText(clause.positional[0]) || titleCase(clause.verb);
    return {
      id: `return-${index + 1}`,
      line: clause?.span?.line || index + 1,
      label: "Return",
      predicted: tokenToText(latestTest?.positional?.[0]) || "",
      actual,
      result: deriveReturnResult(clause.verb),
      via: via || "user",
      provenanceLabel:
        via === "lender_portal"
          ? "lender_portal"
          : via === "third_party"
            ? "linked_source"
            : "user_entered",
      formal: clauseSummary(clause),
    };
  });
}

function buildReturnEntries(runtimeWindow = null, artifact = null) {
  const runtimeReceipts = Array.isArray(runtimeWindow?.receipts) ? runtimeWindow.receipts : [];
  if (runtimeReceipts.length > 0) {
    return [...runtimeReceipts]
      .slice()
      .reverse()
      .map((receipt, index) => ({
        id: receipt.id || `return-runtime-${index + 1}`,
        line: Number.isFinite(Number(receipt?.line)) ? Number(receipt.line) : index + 1,
        label: normalizeText(receipt?.label) || "Return",
        predicted: normalizeText(receipt?.predicted),
        actual: normalizeLongText(receipt?.actual),
        result: normalizeText(receipt?.result).toLowerCase() || "matched",
        via: normalizeText(receipt?.via).toLowerCase() || "user",
        provenanceLabel: normalizeProvenanceLabel(receipt?.provenanceLabel, "user_entered"),
        receiptKitId: normalizeText(receipt?.receiptKitId),
        draftId: normalizeText(receipt?.draftId),
        createdAt: normalizeText(receipt?.createdAt),
      }));
  }

  return buildReturnEntriesFromArtifact(artifact).reverse();
}

function buildPendingMove(moves = [], artifact = null, runtimeWindow = null) {
  const field = buildEchoFieldModel(artifact, runtimeWindow);
  if (!field.waiting) return null;
  return moves.at(-1) || null;
}

function buildProposalWakeSectionItems(segments = [], mirrorRegion = "") {
  return segments
    .filter((segment) => normalizeText(segment?.mirrorRegion).toLowerCase() === mirrorRegion)
    .map((segment, index) => ({
      id: segment.id || `${mirrorRegion}-${index + 1}`,
      text: normalizeLongText(segment?.text),
      domain: normalizeText(segment?.domain).toLowerCase() || "other",
      formal: normalizeLongText(segment?.suggestedClause),
    }))
    .filter((item) => item.text || item.formal);
}

function isProposalAlreadyApplied(events = [], messageId = "", proposalId = "") {
  const normalizedMessageId = normalizeText(messageId);
  const normalizedProposalId = normalizeText(proposalId);
  return (Array.isArray(events) ? events : []).some((event) => {
    if (normalizeText(event?.kind).toLowerCase() !== "proposal_applied") return false;
    const eventMessageId = normalizeText(event?.assistantMessageId);
    const eventProposalId = normalizeText(event?.proposalId);
    return (
      (normalizedProposalId && eventProposalId === normalizedProposalId) ||
      (normalizedMessageId && eventMessageId === normalizedMessageId)
    );
  });
}

export function buildProposalWakeViewModel(messages = [], runtimeWindow = null) {
  const events = Array.isArray(runtimeWindow?.events) ? runtimeWindow.events : [];
  for (const message of [...(Array.isArray(messages) ? messages : [])].reverse()) {
    if (normalizeText(message?.role).toLowerCase() !== "assistant") continue;
    const roomPayload = message?.roomPayload || null;
    if (normalizeText(roomPayload?.turnMode).toLowerCase() === "conversation") continue;
    if (!roomPayload?.gatePreview?.accepted) continue;
    const segments = Array.isArray(roomPayload?.segments) ? roomPayload.segments : [];
    if (!segments.length) continue;
    if (isProposalAlreadyApplied(events, message?.id, roomPayload?.proposalId)) continue;

    const aim = buildProposalWakeSectionItems(segments, "aim")[0] || null;
    return {
      proposalId: normalizeText(roomPayload?.proposalId),
      assistantMessageId: normalizeText(message?.id),
      assistantText: normalizeLongText(message?.content),
      nextBestAction: normalizeText(roomPayload?.gatePreview?.nextBestAction),
      receiptKit: roomPayload?.receiptKit || null,
      segments: segments.map((segment) => ({
        id: segment.id,
        text: normalizeLongText(segment?.text),
        domain: normalizeText(segment?.domain).toLowerCase() || "other",
        mirrorRegion: normalizeText(segment?.mirrorRegion).toLowerCase(),
        suggestedClause: normalizeLongText(segment?.suggestedClause),
      })),
      sections: {
        aim,
        evidence: buildProposalWakeSectionItems(segments, "evidence"),
        story: buildProposalWakeSectionItems(segments, "story"),
        moves: buildProposalWakeSectionItems(segments, "moves"),
        returns: buildProposalWakeSectionItems(segments, "returns"),
      },
    };
  }

  return null;
}

function buildFieldStateLabel(artifact = null, runtimeWindow = null) {
  if (isPristineRoomArtifact(artifact)) {
    return {
      key: "open",
      tone: "open",
      label: "Open",
    };
  }

  const pane = derivePaneInteractionContract(artifact, runtimeWindow);
  const field = buildEchoFieldModel(artifact, runtimeWindow);
  const mergedState = normalizeText(artifact?.mergedWindowState || runtimeWindow?.state).toLowerCase();
  let key = "open";

  if (["flagged", "sealed", "rerouted", "stopped"].includes(mergedState)) {
    key = mergedState;
  } else if (field.waiting) {
    key = "awaiting";
  } else if (
    normalizeText(artifact?.runtimeState).toLowerCase() === "returned" &&
    field.fieldState !== "fractured"
  ) {
    key =
      field.fieldState === "mapped" && /choose closure|decide lawful close/i.test(pane?.nextBestAction || "")
        ? "actionable"
        : "grounded";
  }

  const label =
    key === "awaiting"
      ? "Awaiting"
      : key === "grounded"
        ? "Grounded"
        : key === "sealed"
          ? "Sealed"
          : key === "flagged"
            ? "Flagged"
            : key === "rerouted"
              ? "Rerouted"
              : key === "stopped"
                ? "Stopped"
                : key === "actionable"
                  ? "Actionable"
                  : "Open";

  return {
    key,
    tone: getRoomFieldStateTone(key),
    label,
  };
}

export function buildRoomCanonicalViewModel({
  roomDocument = null,
  artifact = null,
  runtimeWindow = null,
  messages = [],
  recentSources = [],
  receiptDrafts = [],
  deepLinks = null,
  latestReceiptKit = null,
} = {}) {
  const sections = buildBoxSectionsFromArtifact(artifact);
  const evidence = buildEvidenceItems(artifact);
  const story = buildStoryItems(artifact);
  const moves = buildMoveItems(artifact, runtimeWindow);
  const returns = buildReturnEntries(runtimeWindow, artifact);
  const fieldState = buildFieldStateLabel(artifact, runtimeWindow);
  const pane = derivePaneInteractionContract(artifact, runtimeWindow);
  const stateChip = deriveStateChipModel(artifact, runtimeWindow);
  const hasStructure = !isPristineRoomArtifact(artifact) && (artifact?.ast?.length || 0) > 1;
  const proposalWake = buildProposalWakeViewModel(messages, runtimeWindow);

  return {
    roomDocument: roomDocument
      ? {
          documentKey: roomDocument.documentKey,
          title: roomDocument.title,
          updatedAt: roomDocument.updatedAt,
        }
      : null,
    roomSourceSummary: {
      clauseCount: Number(artifact?.stats?.clauseCount) || 0,
      compileState: normalizeText(artifact?.compileState).toLowerCase() || "unknown",
      runtimeState: normalizeText(artifact?.runtimeState).toLowerCase() || "open",
      mergedWindowState: normalizeText(artifact?.mergedWindowState).toLowerCase() || "open",
    },
    hasStructure,
    fieldState,
    interaction: {
      stateChip,
      paneContract: pane?.paneContract || null,
      nextBestAction: normalizeText(pane?.nextBestAction),
    },
    mirror: {
      aim: {
        text: normalizeText(sections?.aim),
        gloss: "",
      },
      evidence,
      story,
      moves,
      returns,
    },
    pendingMove: buildPendingMove(moves, artifact, runtimeWindow),
    proposalWake,
    recentReturns: returns.slice(0, 5),
    recentSources: Array.isArray(recentSources) ? recentSources : [],
    receiptSummary: {
      draftCount: Array.isArray(receiptDrafts) ? receiptDrafts.length : 0,
      recentDrafts: Array.isArray(receiptDrafts) ? receiptDrafts : [],
    },
    latestReceiptKit,
    deepLinks,
    starter: {
      show: !hasStructure && !(Array.isArray(messages) && messages.length > 0),
      firstLine: "What's on your mind?",
      secondLine: "A decision. A question. Something you're carrying. Just start talking.",
    },
    diagnostics: summarizeDiagnostics(artifact?.diagnostics),
  };
}

export function applyArtifactToRuntimeWindow(
  currentWindow = null,
  nextArtifact = null,
  {
    event = null,
    receipt = null,
    previousArtifact = null,
  } = {},
) {
  let nextWindow = syncRuntimeWindowWithArtifact(currentWindow, nextArtifact);

  if (event) {
    nextWindow = appendEvent(nextWindow, event);
  }

  const distantEcho = deriveDistantEchoSignal(previousArtifact, nextArtifact);
  if (distantEcho) {
    nextWindow = appendEvent(nextWindow, {
      kind: "distant_echo_detected",
      ...distantEcho,
    });
  }

  if (receipt) {
    nextWindow = appendReceipt(nextWindow, receipt);
  }

  const closureVerb = normalizeText(nextArtifact?.metadata?.activeClosureVerb);
  if (closureVerb) {
    nextWindow = applyClosureState(nextWindow, closureVerb);
  }

  return nextWindow;
}
