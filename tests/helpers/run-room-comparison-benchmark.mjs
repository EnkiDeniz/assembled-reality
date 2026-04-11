import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { parseRoomResponsesPayload } from "../../src/lib/room-turn-service.js";
import { createRoomRouteHarness } from "./run-room-route-journey.mjs";

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

function getLastMessage(messages = [], role = "") {
  return [...(Array.isArray(messages) ? messages : [])]
    .reverse()
    .find((message) => normalizeText(message?.role).toLowerCase() === normalizeText(role).toLowerCase());
}

function extractDraftFromParsedTurn(parsedTurn = null) {
  const segments = Array.isArray(parsedTurn?.segments) ? parsedTurn.segments : [];
  const aim = segments.find((segment) => normalizeText(segment?.domain).toLowerCase() === "aim");
  const move = segments.find((segment) => normalizeText(segment?.domain).toLowerCase() === "move");
  const test = segments.find((segment) => normalizeText(segment?.domain).toLowerCase() === "test");
  const returns = segments.filter((segment) => normalizeText(segment?.domain).toLowerCase() === "return");
  const closure = segments.find((segment) => normalizeText(segment?.suggestedClause).startsWith("CLS "));

  if (closure) {
    return {
      kind: "closure",
      assistantText: normalizeText(parsedTurn?.assistantText),
      closureText: normalizeText(closure?.text),
      closureClause: normalizeText(closure?.suggestedClause),
    };
  }

  if (returns.length > 0) {
    return {
      kind: "return",
      assistantText: normalizeText(parsedTurn?.assistantText),
      returns: returns.map((segment) => ({
        text: normalizeText(segment?.text),
        clause: normalizeText(segment?.suggestedClause),
        contradicts: /\bRTN\s+contradict\b/i.test(normalizeText(segment?.suggestedClause)),
      })),
    };
  }

  return {
    kind: "plan",
    assistantText: normalizeText(parsedTurn?.assistantText),
    aim: normalizeText(aim?.text),
    move: normalizeText(move?.text),
    test: normalizeText(test?.text),
    segments: segments.map((segment) => ({
      domain: normalizeText(segment?.domain),
      text: normalizeText(segment?.text),
      clause: normalizeText(segment?.suggestedClause),
    })),
  };
}

function buildPlainChatState(initialState = {}) {
  return {
    project: clone(initialState?.project),
    sessions: Object.fromEntries(
      (Array.isArray(initialState?.sessions) ? initialState.sessions : [initialState?.session].filter(Boolean)).map(
        (session) => [session.id, { title: session.title, messages: [] }],
      ),
    ),
    activeSessionId: initialState?.session?.id || "session_alpha_1",
    truth: {
      aim: "",
      plan: null,
      returns: [],
      contradictions: [],
      status: "open",
      summary: "",
      sealed: false,
    },
  };
}

function summarizePlainChatState(state) {
  return {
    sessionId: state.activeSessionId,
    aim: normalizeText(state.truth.aim),
    plan: clone(state.truth.plan),
    returns: clone(state.truth.returns),
    contradictions: clone(state.truth.contradictions),
    status: normalizeText(state.truth.status),
    sealed: Boolean(state.truth.sealed),
    summary: normalizeText(state.truth.summary),
  };
}

function applyTurnToPlainChat(state, step, parsedTurn) {
  state.activeSessionId = step.sessionId || state.activeSessionId;
  const thread = state.sessions[state.activeSessionId] || { title: state.activeSessionId, messages: [] };
  state.sessions[state.activeSessionId] = thread;
  thread.messages.push(
    { role: "user", content: step.userMessage },
    { role: "assistant", content: normalizeText(parsedTurn?.assistantText) },
  );

  const beforeHash = hashValue(state.truth);
  state.truth.summary = normalizeText(parsedTurn?.assistantText);

  if (normalizeText(parsedTurn?.turnMode).toLowerCase() !== "proposal") {
    return {
      canonicalChanged: false,
      summary: summarizePlainChatState(state),
      draftPresent: false,
      lastAssistantText: normalizeText(parsedTurn?.assistantText),
    };
  }

  const draft = extractDraftFromParsedTurn(parsedTurn);
  if (draft.kind === "plan") {
    state.truth.aim = normalizeText(draft.aim) || state.truth.aim;
    state.truth.plan = {
      move: normalizeText(draft.move),
      test: normalizeText(draft.test),
    };
    state.truth.status = "awaiting";
  } else if (draft.kind === "return") {
    const contradictions = draft.returns.filter((item) => item.contradicts);
    const observations = draft.returns.filter((item) => !item.contradicts);
    state.truth.returns.push(...observations.map((item) => item.text));
    state.truth.contradictions.push(...contradictions.map((item) => item.text));
    state.truth.status = contradictions.length > 0 ? "contested" : "mapped";
  } else if (draft.kind === "closure") {
    state.truth.status = "sealed";
    state.truth.sealed = true;
  }

  return {
    canonicalChanged: hashValue(state.truth) !== beforeHash,
    summary: summarizePlainChatState(state),
    draftPresent: false,
    lastAssistantText: normalizeText(parsedTurn?.assistantText),
  };
}

function applyStepToPlainChat(state) {
  return {
    canonicalChanged: false,
    summary: summarizePlainChatState(state),
    draftPresent: false,
    lastAssistantText: normalizeText(state.truth.summary),
  };
}

function buildSchemaOnlyState(initialState = {}) {
  return {
    project: clone(initialState?.project),
    sessions: Object.fromEntries(
      (Array.isArray(initialState?.sessions) ? initialState.sessions : [initialState?.session].filter(Boolean)).map(
        (session) => [session.id, { title: session.title, messages: [] }],
      ),
    ),
    activeSessionId: initialState?.session?.id || "session_alpha_1",
    canon: {
      aim: "",
      plan: null,
      returns: [],
      contradictions: [],
      status: "open",
      sealed: false,
    },
    draft: null,
    summary: "",
  };
}

function summarizeSchemaOnlyState(state) {
  return {
    sessionId: state.activeSessionId,
    aim: normalizeText(state.canon.aim),
    plan: clone(state.canon.plan),
    returns: clone(state.canon.returns),
    contradictions: clone(state.canon.contradictions),
    status: normalizeText(state.canon.status),
    sealed: Boolean(state.canon.sealed),
    draftPresent: Boolean(state.draft),
    draftKind: normalizeText(state.draft?.kind),
    summary: normalizeText(state.summary),
  };
}

function applyTurnToSchemaOnly(state, step, parsedTurn) {
  state.activeSessionId = step.sessionId || state.activeSessionId;
  const thread = state.sessions[state.activeSessionId] || { title: state.activeSessionId, messages: [] };
  state.sessions[state.activeSessionId] = thread;
  thread.messages.push(
    { role: "user", content: step.userMessage },
    { role: "assistant", content: normalizeText(parsedTurn?.assistantText) },
  );
  state.summary = normalizeText(parsedTurn?.assistantText);

  if (normalizeText(parsedTurn?.turnMode).toLowerCase() !== "proposal") {
    state.draft = null;
    return {
      canonicalChanged: false,
      summary: summarizeSchemaOnlyState(state),
      draftPresent: false,
      lastAssistantText: normalizeText(parsedTurn?.assistantText),
    };
  }

  state.draft = extractDraftFromParsedTurn(parsedTurn);
  return {
    canonicalChanged: false,
    summary: summarizeSchemaOnlyState(state),
    draftPresent: true,
    lastAssistantText: normalizeText(parsedTurn?.assistantText),
  };
}

function applyStepToSchemaOnly(state) {
  const beforeHash = hashValue(state.canon);
  const draft = clone(state.draft);

  if (!draft) {
    return {
      canonicalChanged: false,
      summary: summarizeSchemaOnlyState(state),
      draftPresent: false,
      lastAssistantText: normalizeText(state.summary),
    };
  }

  if (draft.kind === "plan") {
    state.canon.aim = normalizeText(draft.aim) || state.canon.aim;
    state.canon.plan = {
      move: normalizeText(draft.move),
      test: normalizeText(draft.test),
    };
    state.canon.status = "awaiting";
  } else if (draft.kind === "return") {
    const contradictions = draft.returns.filter((item) => item.contradicts);
    const observations = draft.returns.filter((item) => !item.contradicts);
    state.canon.returns.push(...observations.map((item) => item.text));
    state.canon.contradictions.push(...contradictions.map((item) => item.text));
    state.canon.status = contradictions.length > 0 ? "contested" : "mapped";
  } else if (draft.kind === "closure") {
    state.canon.status = "sealed";
    state.canon.sealed = true;
  }

  state.draft = null;
  return {
    canonicalChanged: hashValue(state.canon) !== beforeHash,
    summary: summarizeSchemaOnlyState(state),
    draftPresent: false,
    lastAssistantText: normalizeText(state.summary),
  };
}

function summarizeLoegosStep(step, response, snapshot, previousSourceHash) {
  const view = snapshot?.view || null;
  const currentSourceHash = hashValue(snapshot?.roomSource || "");
  return {
    responseStatus: response?.status || 0,
    canonicalChanged: currentSourceHash !== previousSourceHash,
    activePreview: Boolean(view?.activePreview),
    previewStatus: view?.messages?.at(-1)?.previewStatus || "none",
    fieldState: normalizeText(view?.fieldState?.key),
    mirrorAim: normalizeText(view?.mirror?.aim?.text),
    sealed: /\bCLS seal\b/.test(snapshot?.roomSource || ""),
    contradictionsPresent: /\bRTN contradict\b/.test(snapshot?.roomSource || ""),
    sourceHash: currentSourceHash,
    turnGateAccepted:
      response?.body?.turn?.gatePreview && typeof response.body.turn.gatePreview.accepted === "boolean"
        ? response.body.turn.gatePreview.accepted
        : null,
    diagnostics:
      response?.body?.turn?.gatePreview?.diagnostics?.map((item) => normalizeText(item?.message)).filter(Boolean) ||
      [],
    nextBestAction: normalizeText(view?.interaction?.nextBestAction),
  };
}

async function runLoegosScenario(scenario) {
  const harness = createRoomRouteHarness({
    id: scenario.id,
    initialState: clone(scenario.initialState),
  });
  const steps = [];

  for (const step of scenario.steps) {
    const beforeSnapshot = harness.snapshot();
    const previousSourceHash = hashValue(harness.getState().roomSource || "");

    if (step.type === "turn") {
      const turn = await harness.turn({
        message: step.userMessage,
        rawModelPayload: step.rawModelPayload,
        sessionId: step.sessionId,
      });
      steps.push({
        id: step.id,
        type: step.type,
        userMessage: step.userMessage,
        assistantText: normalizeText(turn.response?.body?.answer || turn.response?.body?.turn?.assistantText),
        summary: summarizeLoegosStep(step, turn.response, {
          ...turn.snapshotAfter,
          roomSource: harness.getState().roomSource,
        }, previousSourceHash),
      });
      continue;
    }

    if (step.type === "apply") {
      const apply = await harness.applyPreview({
        sessionId: step.sessionId,
      });
      steps.push({
        id: step.id,
        type: step.type,
        userMessage: "",
        assistantText: "",
        summary: summarizeLoegosStep(step, apply.response, {
          ...apply.snapshotAfter,
          roomSource: harness.getState().roomSource,
        }, previousSourceHash),
      });
    }
  }

  const byId = Object.fromEntries(steps.map((step) => [step.id, step]));
  const metrics = {
    proposalRequiresApply:
      byId.observation?.summary?.canonicalChanged === false &&
      byId.apply_observation?.summary?.canonicalChanged === true,
    returnRequiresApply:
      byId.report_return?.summary?.canonicalChanged === false &&
      byId.apply_return?.summary?.canonicalChanged === true,
    contradictionBlocksSeal:
      byId.seal_attempt?.summary?.previewStatus === "blocked" &&
      byId.apply_seal_attempt?.summary?.canonicalChanged === false,
    freshSessionSeesCanonNotDraft:
      byId.session_two_check?.summary?.activePreview === false &&
      byId.session_two_check?.summary?.sealed === false &&
      normalizeText(byId.session_two_check?.summary?.mirrorAim) === "Name the exact drop-off step.",
    explicitIntermediateState:
      byId.observation?.summary?.activePreview === true &&
      byId.observation?.summary?.canonicalChanged === false,
  };

  return {
    mode: "loegos",
    steps,
    metrics,
  };
}

function runPlainChatScenario(scenario) {
  const state = buildPlainChatState(scenario.initialState);
  const steps = [];

  for (const step of scenario.steps) {
    if (step.type === "turn") {
      const parsedTurn = parseRoomResponsesPayload(step.rawModelPayload);
      const stepResult = applyTurnToPlainChat(state, step, parsedTurn);
      steps.push({
        id: step.id,
        type: step.type,
        userMessage: step.userMessage,
        assistantText: normalizeText(parsedTurn?.assistantText),
        summary: stepResult.summary,
        canonicalChanged: stepResult.canonicalChanged,
      });
      continue;
    }

    const applyResult = applyStepToPlainChat(state);
    steps.push({
      id: step.id,
      type: step.type,
      userMessage: "",
      assistantText: "",
      summary: applyResult.summary,
      canonicalChanged: applyResult.canonicalChanged,
    });
  }

  const byId = Object.fromEntries(steps.map((step) => [step.id, step]));
  const metrics = {
    proposalRequiresApply:
      byId.observation?.canonicalChanged === false &&
      byId.apply_observation?.canonicalChanged === true,
    returnRequiresApply:
      byId.report_return?.canonicalChanged === false &&
      byId.apply_return?.canonicalChanged === true,
    contradictionBlocksSeal: byId.apply_seal_attempt?.summary?.sealed === false,
    freshSessionSeesCanonNotDraft: byId.session_two_check?.summary?.sealed === false,
    explicitIntermediateState: false,
  };

  return {
    mode: "plain_chat",
    steps,
    metrics,
  };
}

function runSchemaOnlyScenario(scenario) {
  const state = buildSchemaOnlyState(scenario.initialState);
  const steps = [];

  for (const step of scenario.steps) {
    if (step.type === "turn") {
      const parsedTurn = parseRoomResponsesPayload(step.rawModelPayload);
      const stepResult = applyTurnToSchemaOnly(state, step, parsedTurn);
      steps.push({
        id: step.id,
        type: step.type,
        userMessage: step.userMessage,
        assistantText: normalizeText(parsedTurn?.assistantText),
        summary: stepResult.summary,
        canonicalChanged: stepResult.canonicalChanged,
      });
      continue;
    }

    const applyResult = applyStepToSchemaOnly(state);
    steps.push({
      id: step.id,
      type: step.type,
      userMessage: "",
      assistantText: "",
      summary: applyResult.summary,
      canonicalChanged: applyResult.canonicalChanged,
    });
  }

  const byId = Object.fromEntries(steps.map((step) => [step.id, step]));
  const metrics = {
    proposalRequiresApply:
      byId.observation?.canonicalChanged === false &&
      byId.apply_observation?.canonicalChanged === true,
    returnRequiresApply:
      byId.report_return?.canonicalChanged === false &&
      byId.apply_return?.canonicalChanged === true,
    contradictionBlocksSeal: byId.apply_seal_attempt?.summary?.sealed === false,
    freshSessionSeesCanonNotDraft: byId.session_two_check?.summary?.sealed === false,
    explicitIntermediateState:
      byId.observation?.summary?.draftPresent === true &&
      byId.observation?.canonicalChanged === false,
  };

  return {
    mode: "schema_only",
    steps,
    metrics,
  };
}

function buildBenchmarkScorecard(result) {
  return Object.entries(result.metrics).map(([key, value]) => ({
    key,
    value: Boolean(value),
  }));
}

function buildBenchmarkReport(result) {
  const sections = [
    `# ${result.scenario.id}`,
    "",
    result.scenario.description || "",
    "",
    "## Scorecard",
    "",
  ];

  for (const mode of ["loegos", "schema_only", "plain_chat"]) {
    const modeResult = result.modes[mode];
    sections.push(`### ${mode}`);
    sections.push("");
    for (const row of buildBenchmarkScorecard(modeResult)) {
      sections.push(`- ${row.key}: ${row.value ? "yes" : "no"}`);
    }
    sections.push("");
  }

  sections.push("## Journey traces", "");
  for (const mode of ["loegos", "schema_only", "plain_chat"]) {
    const modeResult = result.modes[mode];
    sections.push(`### ${mode}`);
    sections.push("");
    for (const step of modeResult.steps) {
      sections.push(`#### ${step.id}`);
      sections.push("");
      if (step.userMessage) {
        sections.push(`- user: ${step.userMessage}`);
      }
      if (step.assistantText) {
        sections.push(`- assistant: ${step.assistantText}`);
      }
      sections.push(`- summary: ${JSON.stringify(step.summary)}`);
      if (typeof step.canonicalChanged === "boolean") {
        sections.push(`- canonical changed this step: ${step.canonicalChanged ? "yes" : "no"}`);
      } else if (typeof step.summary?.canonicalChanged === "boolean") {
        sections.push(`- canonical changed this step: ${step.summary.canonicalChanged ? "yes" : "no"}`);
      }
      sections.push("");
    }
  }

  return sections.join("\n");
}

async function emitBenchmarkArtifacts(result, { rootDir = "test-results/room-comparison-benchmark" } = {}) {
  const dossierDir = join(rootDir, result.scenario.id);
  await rm(dossierDir, { recursive: true, force: true });
  await mkdir(dossierDir, { recursive: true });
  await writeFile(join(dossierDir, "00-scenario.json"), `${JSON.stringify(result.scenario, null, 2)}\n`, "utf8");
  await writeFile(join(dossierDir, "01-result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(join(dossierDir, "02-report.md"), `${buildBenchmarkReport(result)}\n`, "utf8");
  return dossierDir;
}

export async function runRoomComparisonBenchmark(
  scenario,
  { writeArtifacts = true, artifactRoot = "test-results/room-comparison-benchmark" } = {},
) {
  const result = {
    scenario: clone(scenario),
    modes: {
      loegos: await runLoegosScenario(scenario),
      schema_only: runSchemaOnlyScenario(scenario),
      plain_chat: runPlainChatScenario(scenario),
    },
  };

  if (writeArtifacts) {
    result.dossierDir = await emitBenchmarkArtifacts(result, { rootDir: artifactRoot });
  }

  return result;
}

export function buildComparisonVerdict(result) {
  const loegos = result?.modes?.loegos?.metrics || {};
  const schemaOnly = result?.modes?.schema_only?.metrics || {};
  const plainChat = result?.modes?.plain_chat?.metrics || {};

  return {
    loegosPreservesBoundaries:
      Boolean(loegos.proposalRequiresApply) &&
      Boolean(loegos.returnRequiresApply) &&
      Boolean(loegos.explicitIntermediateState),
    loegosBlocksContradictorySeal: Boolean(loegos.contradictionBlocksSeal),
    schemaOnlyBlocksContradictorySeal: Boolean(schemaOnly.contradictionBlocksSeal),
    plainChatBlocksContradictorySeal: Boolean(plainChat.contradictionBlocksSeal),
    loegosWinsAgainstPlainChat:
      Boolean(loegos.proposalRequiresApply) &&
      Boolean(loegos.returnRequiresApply) &&
      Boolean(loegos.contradictionBlocksSeal) &&
      !Boolean(plainChat.proposalRequiresApply) &&
      !Boolean(plainChat.returnRequiresApply) &&
      !Boolean(plainChat.contradictionBlocksSeal),
    loegosWinsAgainstSchemaOnly:
      Boolean(loegos.proposalRequiresApply) &&
      Boolean(loegos.returnRequiresApply) &&
      Boolean(loegos.contradictionBlocksSeal) &&
      Boolean(schemaOnly.proposalRequiresApply) &&
      Boolean(schemaOnly.returnRequiresApply) &&
      !Boolean(schemaOnly.contradictionBlocksSeal),
  };
}
