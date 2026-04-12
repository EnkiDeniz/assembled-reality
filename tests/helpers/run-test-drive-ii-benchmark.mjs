import { execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  buildRoomPromptPacket,
  extractRoomMessageText,
  parseRoomJsonObject,
} from "../../src/lib/room-turn-service.js";
import { WORKING_ECHO_SCENARIOS } from "../fixtures/room-benchmarks/working-echo/index.mjs";
import { buildSchemaBoardSurface, SCHEMA_BOARD_JSON_SCHEMA } from "./build-schema-board-surface.mjs";
import { buildDriveTapeReplay, renderDriveTapeReplay } from "./build-drive-tape.mjs";
import {
  buildBlindfoldedSurfacedState,
  extractCurrentSurfacedRoomState,
  makeAnswerOnlySurfacedState,
  renderSurfacedStateForEvaluator,
} from "./extract-surfaced-room-state.mjs";
import {
  buildOpenAiCallSummary,
  createOpenAiTelemetryCollector,
  resolveOpenAiApiKey,
} from "./openai-telemetry.mjs";
import { createRoomRouteHarness } from "./run-room-route-journey.mjs";
import {
  SECOND_TURN_RESPONSE_SCHEMA,
  normalizeSecondTurnResponse,
  scoreWorkingEchoSecondTurn,
} from "./score-working-echo-second-turn.mjs";

export const TEST_DRIVE_II_MODEL = "gpt-5.4-mini";
export const TEST_DRIVE_II_MASTER_REPORT_PATH =
  "test-results/room-benchmarks/test-drive-ii-master-report.md";

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function mean(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function median(values = []) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function renderJsonBlock(value) {
  return ["```json", JSON.stringify(value, null, 2), "```"].join("\n");
}

function renderTextBlock(value = "") {
  return ["```text", String(value || ""), "```"].join("\n");
}

function escapeCell(value = "") {
  return String(value || "").replace(/\|/g, "\\|");
}

function formatCommand(command = {}) {
  const envPrefix = Object.entries(command.env || {})
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  const args = [command.labelCommand || command.command, ...(command.args || [])].filter(Boolean);
  return [envPrefix, ...args].filter(Boolean).join(" ");
}

function summarizeNodeTestOutput(output = "") {
  const tests = Number(output.match(/# tests\s+(\d+)/)?.[1] || 0);
  const pass = Number(output.match(/# pass\s+(\d+)/)?.[1] || 0);
  const fail = Number(output.match(/# fail\s+(\d+)/)?.[1] || 0);
  return { tests, pass, fail };
}

function parseJsonSafe(text = "") {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isOpenAiPayloadDegraded(payload = null) {
  if (!payload || typeof payload !== "object") return false;
  const status = normalizeText(payload?.status).toLowerCase();
  return Boolean(payload?.incomplete_details) || (status && status !== "completed");
}

function readGitSha(cwd = process.cwd()) {
  try {
    return normalizeText(execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }));
  } catch {
    return "";
  }
}

function buildEvidenceDossierText(scenario) {
  return scenario.evidenceBundle
    .map((item) => `${item.id} | ${item.title}\n${item.body}`)
    .join("\n\n");
}

function extractStructuredPayload(payload = null) {
  return payload?.output?.[0]?.content?.[0]?.json || parseRoomJsonObject(extractRoomMessageText(payload)) || payload;
}

function buildSchemaFormatName(label = "") {
  return `${String(label || "").replace(/[^a-z0-9_]+/gi, "_")}_schema`.slice(0, 64);
}

function buildPlainChatPrompt(scenario) {
  return {
    system: [
      "You are a thoughtful collaborator helping someone reason through an uncertain situation.",
      "Use only the supplied evidence.",
      "Stay tentative where the evidence conflicts.",
      "Do not declare a settled cause.",
      "Reply in 2-4 natural sentences with no bullets or headings.",
    ].join(" "),
    user: [scenario.initialUserTurn, "", "Available evidence:", buildEvidenceDossierText(scenario)].join("\n"),
  };
}

function buildStructuredChatPrompt(scenario) {
  return {
    system: [
      "You are a careful operator helping structure uncertainty.",
      "Use only the supplied evidence.",
      "Stay tentative where evidence conflicts.",
      "Do not declare a settled cause.",
      "Reply in three short labelled lines: Read:, Tension:, Next:.",
    ].join(" "),
    user: [scenario.initialUserTurn, "", "Available evidence:", buildEvidenceDossierText(scenario)].join("\n"),
  };
}

function buildSchemaBoardPrompt({ scenario, assistantText }) {
  return {
    system: [
      "You are building a generic external working board.",
      "Use only the supplied evidence and the assistant answer.",
      "Do not use Lœgos-specific language or hidden state.",
      "Reflect uncertainty honestly.",
      "Return strict JSON only.",
    ].join(" "),
    user: [
      `Initial user turn: ${scenario.initialUserTurn}`,
      "",
      "Assistant answer:",
      assistantText,
      "",
      "Available evidence:",
      buildEvidenceDossierText(scenario),
    ].join("\n"),
  };
}

function buildPilotPrompt({ scenario, surfacedState }) {
  return {
    system: [
      "You are the operator taking the next user turn in a reasoning tool.",
      "You may only use the visible information below.",
      "Do not use hidden state, future returns, or benchmark labels.",
      "Stay tentative if the situation is unresolved.",
      "If you reference evidence, use the visible ids or names when available.",
      "Keep replyText compact: at most 2 sentences and under 90 words.",
      "Keep noticedContradictions and rejectedClaims to at most 2 short items each.",
      "Use supportingEvidenceIds for evidence that supports the leading read.",
      "Use weakeningEvidenceIds for evidence that weakens the popular or earlier story.",
      "Use missingEvidenceIds only for missing witnesses or logs named on the visible surface.",
      "Only fill returnChangedRead and returnWeakenedRead when the visible surface includes a return-aware change.",
      "Prefer a concrete next question or move over a long explanation.",
      "Return strict JSON only.",
    ].join(" "),
    user: [
      `Your previous first turn: ${scenario.initialUserTurn}`,
      "",
      renderSurfacedStateForEvaluator(surfacedState),
      "",
      "Write the next user turn you would send now.",
      "Use chosenMoveFamily for a concrete next move if one is justified.",
      "Use clarifyingMove for a lawful clarification if you need more signal before moving.",
    ].join("\n"),
  };
}

function buildLoegosPromptPacket(input = {}, scenario) {
  const basePacket = buildRoomPromptPacket(input);
  return {
    systemPrompt: basePacket.systemPrompt,
    userPrompt: [
      basePacket.userPrompt,
      "",
      "Test Drive II benchmark evidence bundle:",
      buildEvidenceDossierText(scenario),
      "",
      "Benchmark evaluation focus:",
      "Help the operator by reflecting what seems real, what conflicts, and what next question or move is live without pretending certainty.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function buildLoegosInitialState(scenario) {
  return {
    project: {
      projectKey: `${scenario.id}_box`,
      title: scenario.title,
      subtitle: "Test Drive II benchmark box",
    },
    session: {
      id: `session_${scenario.id}_1`,
      title: "Test Drive II Session",
      handoffSummary: "",
      threadDocumentKey: `thread_${scenario.id}_1`,
      isActive: true,
      isArchived: false,
      messageCount: 0,
      updatedAt: new Date().toISOString(),
    },
    sessions: [
      {
        id: `session_${scenario.id}_1`,
        title: "Test Drive II Session",
        handoffSummary: "",
        threadDocumentKey: `thread_${scenario.id}_1`,
        isActive: true,
        isArchived: false,
        messageCount: 0,
        updatedAt: new Date().toISOString(),
      },
    ],
    roomDocument: {
      documentKey: `room_${scenario.id}`,
      title: `${scenario.title} Room`,
    },
    roomSource: `GND box @room_${scenario.id}`,
    runtimeWindow: null,
    recentSources: scenario.evidenceBundle.map((item, index) => ({
      id: `working_echo_source_${index + 1}`,
      documentKey: `${scenario.id}_${item.id.toLowerCase()}`,
      title: item.title,
      metaLine: "Working echo benchmark evidence",
      operateSummary: item.body,
    })),
    receiptDrafts: [],
    latestReceiptKit: null,
    messages: [],
    focusedWitness: null,
    adjacent: { operate: null },
  };
}

function buildPerformance(calls = []) {
  const usage = calls.reduce(
    (sum, call) => ({
      inputTokens: sum.inputTokens + Number(call?.usage?.inputTokens || 0),
      outputTokens: sum.outputTokens + Number(call?.usage?.outputTokens || 0),
      costEstimateUsd:
        sum.costEstimateUsd === null || call?.costEstimateUsd === null
          ? null
          : Number(sum.costEstimateUsd) + Number(call.costEstimateUsd),
    }),
    { inputTokens: 0, outputTokens: 0, costEstimateUsd: 0 },
  );

  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costEstimateUsd: usage.costEstimateUsd,
  };
}

async function runCommand(command) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const child = spawn(command.command, command.args || [], {
      cwd: command.cwd,
      env: { ...process.env, ...(command.env || {}) },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      stderr += String(error instanceof Error ? error.message : error);
    });

    child.on("close", (exitCode) => {
      const parsedJson =
        command.id === "diagnostics" || command.id === "marker" ? parseJsonSafe(stdout) : null;
      resolve({
        id: command.id,
        label: command.label,
        command: formatCommand(command),
        cwd: command.cwd,
        startedAt,
        endedAt: new Date().toISOString(),
        exitCode: Number(exitCode || 0),
        stdout,
        stderr,
        summary: command.id === "truth_path_prereqs" ? summarizeNodeTestOutput(stdout) : null,
        json: parsedJson,
      });
    });
  });
}

function buildPreflightCommands(cwd) {
  return [
    {
      id: "diagnostics",
      label: "OpenAI diagnostics",
      command: process.execPath,
      labelCommand: "node",
      args: ["scripts/check-openai-collab-diagnostics.mjs", "--json"],
      cwd,
      env: {
        ROOM_AI_COLLAB_OPENAI_MODEL: TEST_DRIVE_II_MODEL,
      },
    },
    {
      id: "marker",
      label: "OpenAI log marker",
      command: process.execPath,
      labelCommand: "node",
      args: ["scripts/send-openai-log-marker.mjs"],
      cwd,
      env: {
        ROOM_AI_COLLAB_OPENAI_MODEL: TEST_DRIVE_II_MODEL,
      },
    },
    {
      id: "truth_path_prereqs",
      label: "Truth-path prerequisite suite",
      command: process.execPath,
      labelCommand: "node",
      args: [
        "--test",
        "tests/room-route-journeys.test.mjs",
        "tests/room-turn-journeys.test.mjs",
        "tests/room-first-workspace.test.mjs",
        "tests/room-working-echo-contract.test.mjs",
        "tests/room-preview-state.test.mjs",
        "tests/room-advisory-seam.test.mjs",
        "tests/room-adjacent-lanes.test.mjs",
        "tests/room-session-reset.test.mjs",
        "tests/room-turn-policy.test.mjs",
        "tests/test-drive-ii-benchmark.test.mjs",
        "tests/echo-field-state.test.mjs",
        "tests/echo-ripple-signal.test.mjs",
        "LoegosCLI/packages/compiler/test/proposal-gate.integration.test.mjs",
      ],
      cwd,
    },
  ];
}

async function runPreflight(cwd) {
  const commands = buildPreflightCommands(cwd);
  const results = [];
  for (const command of commands) {
    results.push(await runCommand(command));
  }
  return results;
}

async function callAssistantFirstTurn({ prompt, label, maxOutputTokens = 260 }) {
  const collector = createOpenAiTelemetryCollector({ defaultModel: TEST_DRIVE_II_MODEL });
  const startedAtMs = Date.now();
  const { payload, call } = await collector.callResponses({
    label,
    body: {
      model: TEST_DRIVE_II_MODEL,
      store: false,
      max_output_tokens: maxOutputTokens,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: prompt.system }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt.user }],
        },
      ],
    },
  });

  return {
    assistantText: extractRoomMessageText(payload),
    prompt,
    openaiCalls: clone(collector.calls),
    openaiCall: call,
    degraded: isOpenAiPayloadDegraded(payload),
    performance: {
      ...buildPerformance(collector.calls),
      wallClockMs: Date.now() - startedAtMs,
    },
  };
}

async function callJsonArm({ prompt, label, schema, maxOutputTokens = 320 }) {
  const collector = createOpenAiTelemetryCollector({ defaultModel: TEST_DRIVE_II_MODEL });
  const startedAtMs = Date.now();
  const { payload, call } = await collector.callResponses({
    label,
    body: {
      model: TEST_DRIVE_II_MODEL,
      store: false,
      max_output_tokens: maxOutputTokens,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: prompt.system }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt.user }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: buildSchemaFormatName(label),
          strict: true,
          schema,
        },
      },
    },
  });

  return {
    payload,
    prompt,
    openaiCalls: clone(collector.calls),
    openaiCall: call,
    degraded: isOpenAiPayloadDegraded(payload),
    performance: {
      ...buildPerformance(collector.calls),
      wallClockMs: Date.now() - startedAtMs,
    },
  };
}

async function runPilotSecondTurn({ scenario, surface, label }) {
  const prompt = buildPilotPrompt({ scenario, surfacedState: surface });
  const result = await callJsonArm({
    prompt,
    label,
    schema: SECOND_TURN_RESPONSE_SCHEMA,
    maxOutputTokens: 560,
  });
  const normalized = normalizeSecondTurnResponse(extractStructuredPayload(result.payload));

  return {
    prompt,
    structuredOutput: normalized,
    rawPayload: clone(result.payload),
    rawOutputText: extractRoomMessageText(result.payload),
    openaiCalls: result.openaiCalls,
    openaiCall: result.openaiCall,
    degraded: result.degraded,
    performance: result.performance,
  };
}

function buildLoegosPairRecord({ scenarioId, assistantText, firstTurnCall, surfacedState }) {
  return {
    pairType: "loegos_visibility_pair",
    scenarioId,
    assistantText: normalizeText(assistantText),
    firstTurnOpenAiCall: buildOpenAiCallSummary(firstTurnCall),
    surfacedSighted: clone(surfacedState),
    surfacedBlindfolded: buildBlindfoldedSurfacedState(surfacedState),
  };
}

function buildStructuredPairRecord({ scenarioId, assistantText, firstTurnCall, schemaBoardSurface }) {
  return {
    pairType: "structured_board_pair",
    scenarioId,
    assistantText: normalizeText(assistantText),
    firstTurnOpenAiCall: buildOpenAiCallSummary(firstTurnCall),
    surfacedStructured: makeAnswerOnlySurfacedState(assistantText),
    surfacedSchemaBoard: clone(schemaBoardSurface),
  };
}

function buildRunRecord({
  arm,
  scenario,
  pairId = "",
  surfacedState,
  firstTurnAssistantText,
  secondTurn,
  secondTurnScore,
  openaiCalls = [],
  stagePerformances = [],
  prompts = {},
  rawArtifacts = {},
  degraded = false,
}) {
  const allCalls = openaiCalls.map(clone);
  const performance = buildPerformance(allCalls);
  const wallClockMs = stagePerformances.reduce(
    (sum, item) => sum + Number(item?.wallClockMs || 0),
    0,
  );
  const driveTapeReplay = buildDriveTapeReplay({
    scenarioId: scenario.id,
    arm,
    surfacedState,
    secondTurnOutput: secondTurn?.structuredOutput?.replyText,
    secondTurnScore,
  });

  return {
    arm,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    pairId,
    surfacedState: clone(surfacedState),
    firstTurnAssistantText: normalizeText(firstTurnAssistantText),
    secondTurnInputSeenByEvaluator: renderSurfacedStateForEvaluator(surfacedState),
    secondTurnOutput: normalizeText(secondTurn?.structuredOutput?.replyText),
    secondTurnStructured: clone(secondTurn?.structuredOutput),
    secondTurnScore: clone(secondTurnScore),
    openaiCalls: allCalls.map(buildOpenAiCallSummary),
    openaiTelemetry: allCalls,
    performance: {
      wallClockMs,
      inputTokens: Number(performance.inputTokens || 0),
      outputTokens: Number(performance.outputTokens || 0),
      costEstimateUsd: performance.costEstimateUsd,
    },
    degraded: Boolean(degraded),
    prompt: clone(prompts),
    rawArtifacts: clone(rawArtifacts),
    driveTapeReplay: clone(driveTapeReplay),
    sourceClassification: clone(driveTapeReplay?.sourceClassification),
  };
}

async function runPlainChatArm(scenario) {
  const firstTurn = await callAssistantFirstTurn({
    prompt: buildPlainChatPrompt(scenario),
    label: `plain_chat.${scenario.id}.first_turn`,
  });
  const surface = makeAnswerOnlySurfacedState(firstTurn.assistantText);
  const secondTurn = await runPilotSecondTurn({
    scenario,
    surface,
    label: `plain_chat.${scenario.id}.second_turn`,
  });
  const score = scoreWorkingEchoSecondTurn(secondTurn.structuredOutput, scenario);

  return buildRunRecord({
    arm: "plain_chat",
    scenario,
    surfacedState: surface,
    firstTurnAssistantText: firstTurn.assistantText,
    secondTurn,
    secondTurnScore: score,
    openaiCalls: [...firstTurn.openaiCalls, ...secondTurn.openaiCalls],
    stagePerformances: [firstTurn.performance, secondTurn.performance],
    degraded: firstTurn.degraded || secondTurn.degraded,
    prompts: {
      firstTurn: firstTurn.prompt,
      secondTurn: secondTurn.prompt,
    },
    rawArtifacts: {
      firstTurnOutput: firstTurn.assistantText,
      secondTurnPayload: secondTurn.rawPayload,
    },
  });
}

async function runStructuredAndSchemaBoardArms(scenario) {
  const firstTurn = await callAssistantFirstTurn({
    prompt: buildStructuredChatPrompt(scenario),
    label: `structured_chat.${scenario.id}.first_turn`,
  });
  const structuredSurface = makeAnswerOnlySurfacedState(firstTurn.assistantText);
  const schemaBoard = await callJsonArm({
    prompt: buildSchemaBoardPrompt({ scenario, assistantText: firstTurn.assistantText }),
    label: `schema_board.${scenario.id}.board`,
    schema: SCHEMA_BOARD_JSON_SCHEMA,
    maxOutputTokens: 760,
  });
  const schemaBoardSurface = buildSchemaBoardSurface({
    assistantText: firstTurn.assistantText,
    board: extractStructuredPayload(schemaBoard.payload),
    degraded: schemaBoard.degraded,
  });

  const structuredSecondTurn = await runPilotSecondTurn({
    scenario,
    surface: structuredSurface,
    label: `structured_chat.${scenario.id}.second_turn`,
  });
  const schemaBoardSecondTurn = await runPilotSecondTurn({
    scenario,
    surface: schemaBoardSurface,
    label: `schema_board.${scenario.id}.second_turn`,
  });

  return {
    pairRecord: buildStructuredPairRecord({
      scenarioId: scenario.id,
      assistantText: firstTurn.assistantText,
      firstTurnCall: firstTurn.openaiCalls[0],
      schemaBoardSurface,
    }),
    records: [
      buildRunRecord({
        arm: "structured_chat",
        scenario,
        pairId: `structured_board:${scenario.id}`,
        surfacedState: structuredSurface,
        firstTurnAssistantText: firstTurn.assistantText,
        secondTurn: structuredSecondTurn,
        secondTurnScore: scoreWorkingEchoSecondTurn(structuredSecondTurn.structuredOutput, scenario),
        openaiCalls: [...firstTurn.openaiCalls, ...structuredSecondTurn.openaiCalls],
        stagePerformances: [firstTurn.performance, structuredSecondTurn.performance],
        degraded: firstTurn.degraded || structuredSecondTurn.degraded,
        prompts: {
          firstTurn: firstTurn.prompt,
          secondTurn: structuredSecondTurn.prompt,
        },
        rawArtifacts: {
          firstTurnOutput: firstTurn.assistantText,
          secondTurnPayload: structuredSecondTurn.rawPayload,
        },
      }),
      buildRunRecord({
        arm: "schema_board",
        scenario,
        pairId: `structured_board:${scenario.id}`,
        surfacedState: schemaBoardSurface,
        firstTurnAssistantText: firstTurn.assistantText,
        secondTurn: schemaBoardSecondTurn,
        secondTurnScore: scoreWorkingEchoSecondTurn(schemaBoardSecondTurn.structuredOutput, scenario),
        openaiCalls: [
          ...firstTurn.openaiCalls,
          ...schemaBoard.openaiCalls,
          ...schemaBoardSecondTurn.openaiCalls,
        ],
        stagePerformances: [
          firstTurn.performance,
          schemaBoard.performance,
          schemaBoardSecondTurn.performance,
        ],
        degraded: firstTurn.degraded || schemaBoard.degraded || schemaBoardSecondTurn.degraded,
        prompts: {
          firstTurn: firstTurn.prompt,
          board: schemaBoard.prompt,
          secondTurn: schemaBoardSecondTurn.prompt,
        },
        rawArtifacts: {
          firstTurnOutput: firstTurn.assistantText,
          boardPayload: schemaBoard.payload,
          boardDegraded: schemaBoard.degraded,
          secondTurnPayload: schemaBoardSecondTurn.rawPayload,
        },
      }),
    ],
  };
}

async function runLoegosVisibilityArms(scenario) {
  const apiKey = resolveOpenAiApiKey();
  const collector = createOpenAiTelemetryCollector({
    apiKey,
    defaultModel: TEST_DRIVE_II_MODEL,
  });
  const initialState = buildLoegosInitialState(scenario);
  const harness = createRoomRouteHarness(
    {
      id: `${scenario.id}_test_drive_ii`,
      initialState,
    },
    {
      turnDependencyOverrides: {
        appEnvValue: {
          openai: {
            enabled: true,
            apiKey,
            textModel: TEST_DRIVE_II_MODEL,
          },
        },
        fetchImpl: collector.createFetchImpl({
          label: `loegos.${scenario.id}.first_turn`,
        }),
        buildRoomPromptPacket: (input) =>
          buildLoegosPromptPacket(
            {
              ...input,
              userPrompt: input?.userPrompt,
              systemPrompt: input?.systemPrompt,
            },
            scenario,
          ),
      },
    },
  );

  const firstTurnStartedAtMs = Date.now();
  const turn = await harness.turn({
    message: scenario.initialUserTurn,
    sessionId: initialState.session.id,
  });
  const firstTurnCalls = clone(collector.calls);
  const firstTurnPerformance = {
    ...buildPerformance(firstTurnCalls),
    wallClockMs: Date.now() - firstTurnStartedAtMs,
  };
  const assistantText = normalizeText(
    turn.response?.body?.turn?.assistantText || turn.response?.body?.answer,
  );
  const currentSurface = extractCurrentSurfacedRoomState({
    view: turn.response?.body?.view,
    assistantText,
  });
  const blindfoldedSurface = buildBlindfoldedSurfacedState(currentSurface);

  const sightedSecondTurn = await runPilotSecondTurn({
    scenario,
    surface: currentSurface,
    label: `loegos_sighted.${scenario.id}.second_turn`,
  });
  const blindfoldedSecondTurn = await runPilotSecondTurn({
    scenario,
    surface: blindfoldedSurface,
    label: `loegos_blindfolded.${scenario.id}.second_turn`,
  });

  return {
    pairRecord: buildLoegosPairRecord({
      scenarioId: scenario.id,
      assistantText,
      firstTurnCall: firstTurnCalls[0],
      surfacedState: currentSurface,
    }),
    records: [
      buildRunRecord({
        arm: "loegos_sighted",
        scenario,
        pairId: `loegos_visibility:${scenario.id}`,
        surfacedState: currentSurface,
        firstTurnAssistantText: assistantText,
        secondTurn: sightedSecondTurn,
        secondTurnScore: scoreWorkingEchoSecondTurn(sightedSecondTurn.structuredOutput, scenario),
        openaiCalls: [...firstTurnCalls, ...sightedSecondTurn.openaiCalls],
        stagePerformances: [firstTurnPerformance, sightedSecondTurn.performance],
        degraded: sightedSecondTurn.degraded,
        prompts: {
          secondTurn: sightedSecondTurn.prompt,
        },
        rawArtifacts: {
          loegosTurn: turn.response,
          secondTurnPayload: sightedSecondTurn.rawPayload,
        },
      }),
      buildRunRecord({
        arm: "loegos_blindfolded",
        scenario,
        pairId: `loegos_visibility:${scenario.id}`,
        surfacedState: blindfoldedSurface,
        firstTurnAssistantText: assistantText,
        secondTurn: blindfoldedSecondTurn,
        secondTurnScore: scoreWorkingEchoSecondTurn(blindfoldedSecondTurn.structuredOutput, scenario),
        openaiCalls: [...firstTurnCalls, ...blindfoldedSecondTurn.openaiCalls],
        stagePerformances: [firstTurnPerformance, blindfoldedSecondTurn.performance],
        degraded: blindfoldedSecondTurn.degraded,
        prompts: {
          secondTurn: blindfoldedSecondTurn.prompt,
        },
        rawArtifacts: {
          loegosTurn: turn.response,
          secondTurnPayload: blindfoldedSecondTurn.rawPayload,
        },
      }),
    ],
  };
}

function aggregateArmRuns(records = []) {
  return {
    runs: records.length,
    meanSecondTurnScore: Number(mean(records.map((record) => record.secondTurnScore.total)).toFixed(2)),
    meanSpecificityGain: Number(mean(records.map((record) => record.secondTurnScore.specificityGain)).toFixed(2)),
    meanEvidenceAlignment: Number(mean(records.map((record) => record.secondTurnScore.evidenceAlignment)).toFixed(2)),
    meanEvidenceDiscriminationQuality: Number(
      mean(records.map((record) => record.secondTurnScore.evidenceDiscriminationQuality)).toFixed(2),
    ),
    meanDecidingSplitQuality: Number(
      mean(records.map((record) => record.secondTurnScore.decidingSplitQuality)).toFixed(2),
    ),
    meanReturnUpdateQuality: Number(
      mean(records.map((record) => record.secondTurnScore.returnUpdateQuality)).toFixed(2),
    ),
    contradictionAwarenessRate: Number(
      mean(records.map((record) => (record.secondTurnScore.flags.noticedContradiction ? 1 : 0))).toFixed(2),
    ),
    counterfeitRepeatCount: records.filter((record) => record.secondTurnScore.flags.repeatedCounterfeit).length,
    prematureMoveCount: records.filter((record) => record.secondTurnScore.flags.attemptedPrematureMove).length,
    degradedRunCount: records.filter((record) => record.degraded).length,
    medianWallClockMs: median(records.map((record) => record.performance.wallClockMs)),
    medianTotalTokens: median(
      records.map(
        (record) => Number(record.performance.inputTokens || 0) + Number(record.performance.outputTokens || 0),
      ),
    ),
    totalCostEstimateUsd: records.some((record) => record.performance.costEstimateUsd === null)
      ? null
      : Number(
          records.reduce((sum, record) => sum + Number(record.performance.costEstimateUsd || 0), 0).toFixed(6),
        ),
  };
}

export function buildTestDriveIiVerdict(runRecords = [], preflight = []) {
  const grouped = Object.fromEntries(
    ["plain_chat", "structured_chat", "loegos_blindfolded", "loegos_sighted", "schema_board"].map((arm) => [
      arm,
      runRecords.filter((record) => record.arm === arm),
    ]),
  );
  const aggregates = Object.fromEntries(
    Object.entries(grouped).map(([arm, records]) => [arm, aggregateArmRuns(records)]),
  );

  const prerequisitesPassed = preflight.every((item) => item.exitCode === 0);
  const expectedRuns = WORKING_ECHO_SCENARIOS.length * 5;
  const allRunsComplete = runRecords.length === expectedRuns;
  const schemaBoardPresent = grouped.schema_board.length === WORKING_ECHO_SCENARIOS.length;
  const noDegradedRuns = runRecords.every((record) => !record.degraded);
  const telemetryComplete = runRecords.every(
    (record) =>
      Array.isArray(record.openaiCalls) &&
      record.openaiCalls.length >= 1 &&
      record.openaiCalls.every((call) => normalizeText(call?.requestId) && normalizeText(call?.model)),
  );
  const allOpenAiCallsSucceeded = runRecords.every((record) =>
    (Array.isArray(record.openaiTelemetry) ? record.openaiTelemetry : []).every((call) => call?.ok !== false),
  );

  const loegosSighted = aggregates.loegos_sighted.meanSecondTurnScore;
  const beatsBlindfolded = loegosSighted > aggregates.loegos_blindfolded.meanSecondTurnScore;
  const beatsPlain = loegosSighted > aggregates.plain_chat.meanSecondTurnScore;
  const meetsStructured = loegosSighted >= aggregates.structured_chat.meanSecondTurnScore;
  const decidingSplitImproves =
    aggregates.loegos_sighted.meanDecidingSplitQuality >
    aggregates.loegos_blindfolded.meanDecidingSplitQuality;
  const evidenceDiscriminationImproves =
    aggregates.loegos_sighted.meanEvidenceDiscriminationQuality >
    aggregates.loegos_blindfolded.meanEvidenceDiscriminationQuality;
  const returnUpdateImproves =
    aggregates.loegos_sighted.meanReturnUpdateQuality >
    aggregates.loegos_blindfolded.meanReturnUpdateQuality;
  const truthLawRegressions = !prerequisitesPassed;
  const scenarioScore = (arm, scenarioId) =>
    runRecords.find((record) => record.arm === arm && record.scenarioId === scenarioId)?.secondTurnScore?.total || 0;
  const contradictoryReturnImproves =
    scenarioScore("loegos_sighted", "contradictory_return_journey") >= 60 &&
    scenarioScore("loegos_sighted", "contradictory_return_journey") >
      scenarioScore("loegos_blindfolded", "contradictory_return_journey");
  const noMovePreserved =
    scenarioScore("loegos_sighted", "no_move_yet") >
    scenarioScore("loegos_blindfolded", "no_move_yet");
  const correctionPreserved =
    scenarioScore("loegos_sighted", "working_echo_correction") >
    scenarioScore("loegos_blindfolded", "working_echo_correction");

  let winner = "neither";
  if (beatsBlindfolded && beatsPlain && meetsStructured && contradictoryReturnImproves && !truthLawRegressions) {
    winner = "loegos_sighted";
  } else {
    const bestArm = Object.entries(aggregates)
      .sort((a, b) => b[1].meanSecondTurnScore - a[1].meanSecondTurnScore)[0]?.[0];
    winner = normalizeText(bestArm) || "neither";
  }

  return {
    benchmarkMode: "current_surface",
    valid:
      prerequisitesPassed &&
      allRunsComplete &&
      telemetryComplete &&
      schemaBoardPresent &&
      allOpenAiCallsSucceeded &&
      noDegradedRuns,
    winner,
    aggregates,
    prerequisitesPassed,
    allRunsComplete,
    telemetryComplete,
    schemaBoardPresent,
    allOpenAiCallsSucceeded,
    noDegradedRuns,
    headlineValid:
      beatsBlindfolded &&
      beatsPlain &&
      meetsStructured &&
      decidingSplitImproves &&
      evidenceDiscriminationImproves &&
      returnUpdateImproves &&
      contradictoryReturnImproves &&
      (noMovePreserved || correctionPreserved) &&
      !truthLawRegressions &&
      noDegradedRuns,
    checks: {
      loegosSightedBeatsBlindfolded: beatsBlindfolded,
      loegosSightedBeatsPlainChat: beatsPlain,
      loegosSightedMeetsStructuredChat: meetsStructured,
      loegosSightedImprovesDecidingSplit: decidingSplitImproves,
      loegosSightedImprovesEvidenceDiscrimination: evidenceDiscriminationImproves,
      loegosSightedImprovesReturnUpdate: returnUpdateImproves,
      contradictoryReturnJourneyImproves: contradictoryReturnImproves,
      noMoveYetPreserved: noMovePreserved,
      workingEchoCorrectionPreserved: correctionPreserved,
      noTruthLawRegressions: !truthLawRegressions,
      noDegradedRuns,
    },
  };
}

async function runBlindAuditor({ runRecords, verdict }) {
  const collector = createOpenAiTelemetryCollector({ defaultModel: TEST_DRIVE_II_MODEL });
  const system = [
    "You are a non-gating benchmark auditor.",
    "Do not change the official result.",
    "Explain only the behavioral differences across arms.",
    "Return three short paragraphs labelled: Surface, Steering, Ambiguity.",
  ].join(" ");
  const user = [
    `Official winner: ${verdict.winner}`,
    "",
    "Run summary:",
    JSON.stringify(
      runRecords.map((record) => ({
        arm: record.arm,
        scenarioId: record.scenarioId,
        secondTurnOutput: record.secondTurnOutput,
        secondTurnScore: record.secondTurnScore,
      })),
      null,
      2,
    ),
  ].join("\n");
  const { payload } = await collector.callResponses({
    label: "test_drive_ii.blind_auditor",
    body: {
      model: TEST_DRIVE_II_MODEL,
      store: false,
      max_output_tokens: 420,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: system }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: user }],
        },
      ],
    },
  });

  return {
    prompt: { system, user },
    rawOutputText: extractRoomMessageText(payload),
    rawPayload: clone(payload),
    telemetry: clone(collector.calls[0]),
    openaiCall: buildOpenAiCallSummary(collector.calls[0]),
  };
}

function renderScoreTable(runRecords = []) {
  const lines = [
    "| Arm | Scenario | Total | Specificity | Evidence | Evidence Split | Contradiction | Counterfeit | False Forward | Move | Decide | Return Update |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];

  runRecords.forEach((record) => {
    lines.push(
      `| ${escapeCell(record.arm)} | ${escapeCell(record.scenarioId)} | ${record.secondTurnScore.total} | ${record.secondTurnScore.specificityGain} | ${record.secondTurnScore.evidenceAlignment} | ${record.secondTurnScore.evidenceDiscriminationQuality} | ${record.secondTurnScore.contradictionAwareness} | ${record.secondTurnScore.counterfeitResistance} | ${record.secondTurnScore.falseForwardAvoidance} | ${record.secondTurnScore.moveReadiness} | ${record.secondTurnScore.decidingSplitQuality} | ${record.secondTurnScore.returnUpdateQuality} |`,
    );
  });

  return lines.join("\n");
}

function renderEfficiencyTable(verdict = null) {
  const lines = [
    "| Arm | Mean Second Turn | Mean Evidence | Mean Evidence Split | Mean Decide | Mean Return Update | Contradiction Rate | Counterfeit Repeats | Premature Moves | Degraded Runs | Median Wall Clock | Median Tokens | Total Cost (USD) |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const [arm, summary] of Object.entries(verdict?.aggregates || {})) {
    lines.push(
      `| ${escapeCell(arm)} | ${summary.meanSecondTurnScore} | ${summary.meanEvidenceAlignment} | ${summary.meanEvidenceDiscriminationQuality} | ${summary.meanDecidingSplitQuality} | ${summary.meanReturnUpdateQuality} | ${summary.contradictionAwarenessRate} | ${summary.counterfeitRepeatCount} | ${summary.prematureMoveCount} | ${summary.degradedRunCount} | ${summary.medianWallClockMs} | ${summary.medianTotalTokens} | ${summary.totalCostEstimateUsd === null ? "not configured" : summary.totalCostEstimateUsd} |`,
    );
  }
  return lines.join("\n");
}

function buildFailureAppendix(preflight = [], runRecords = [], blindAuditor = null, verdict = null) {
  const issues = [];
  if (!verdict?.prerequisitesPassed) {
    issues.push("Prerequisite suites did not all pass.");
  }
  if (!verdict?.allRunsComplete) {
    issues.push("Not all expected arm/scenario runs completed.");
  }
  if (!verdict?.telemetryComplete) {
    issues.push("At least one run record is missing complete OpenAI telemetry.");
  }
  if (!verdict?.allOpenAiCallsSucceeded) {
    issues.push("At least one OpenAI call failed, so the benchmark run is not clean.");
  }
  if (!verdict?.noDegradedRuns) {
    issues.push("At least one arm produced degraded or incomplete output.");
  }
  if (!verdict?.schemaBoardPresent) {
    issues.push("Schema-board control arm is missing.");
  }
  if (!blindAuditor?.openaiCall?.requestId) {
    issues.push("Blind auditor call did not return complete telemetry.");
  }
  const failedPreflight = preflight.filter((item) => item.exitCode !== 0);
  failedPreflight.forEach((item) => {
    issues.push(`${item.label} failed with exit code ${item.exitCode}.`);
  });
  if (runRecords.length === 0) {
    issues.push("No run records were produced.");
  }

  return [
    "## Failures And Exclusions",
    "",
    ...(issues.length ? issues.map((issue) => `- ${issue}`) : ["- none"]),
    "",
  ].join("\n");
}

export function buildTestDriveIiReport({
  generatedAt = new Date().toISOString(),
  cwd = process.cwd(),
  gitSha = "",
  nodeVersion = process.version,
  preflight = [],
  scenarios = [],
  pairedRecords = [],
  runRecords = [],
  blindAuditor = null,
  verdict = null,
  reportPath = TEST_DRIVE_II_MASTER_REPORT_PATH,
} = {}) {
  const sections = [
    "# Test Drive II Master Report",
    "",
    "## Executive Verdict",
    "",
    `- benchmark mode: current_surface`,
    `- benchmark valid: ${verdict?.valid ? "yes" : "no"}`,
    `- headline valid: ${verdict?.headlineValid ? "yes" : "no"}`,
    `- official winner: ${verdict?.winner || "unknown"}`,
    `- canonical report path: ${reportPath}`,
    "",
    "## Repo And Environment Metadata",
    "",
    `- generatedAt: ${generatedAt}`,
    `- cwd: ${cwd}`,
    `- gitSha: ${gitSha}`,
    `- nodeVersion: ${nodeVersion}`,
    `- benchmarkModel: ${TEST_DRIVE_II_MODEL}`,
    `- openAiKeyPresent: ${resolveOpenAiApiKey() ? "yes" : "no"}`,
    "",
    renderJsonBlock({
      generatedAt,
      cwd,
      gitSha,
      nodeVersion,
      model: TEST_DRIVE_II_MODEL,
      openAiKeyPresent: Boolean(resolveOpenAiApiKey()),
    }),
    "",
    "## Prerequisite Suite Status",
    "",
  ];

  preflight.forEach((item) => {
    sections.push(`### ${item.label}`);
    sections.push("");
    sections.push(`- command: \`${item.command}\``);
    sections.push(`- exitCode: ${item.exitCode}`);
    sections.push(`- startedAt: ${item.startedAt}`);
    sections.push(`- endedAt: ${item.endedAt}`);
    if (item.summary) {
      sections.push(`- summary: ${JSON.stringify(item.summary)}`);
    }
    sections.push("");
    sections.push("#### stdout");
    sections.push("");
    sections.push(renderTextBlock(item.stdout));
    if (normalizeText(item.stderr)) {
      sections.push("");
      sections.push("#### stderr");
      sections.push("");
      sections.push(renderTextBlock(item.stderr));
    }
    if (item.json) {
      sections.push("");
      sections.push("#### parsed");
      sections.push("");
      sections.push(renderJsonBlock(item.json));
    }
    sections.push("");
  });

  sections.push("## Surfaced Object Contract");
  sections.push("");
  sections.push("- mode: `current_surface`");
  sections.push("- visible fields only: assistant answer, working echo panel, preview banner/status, witness panel when visible, mirror when visible, field state label");
  sections.push("- excluded: hidden preview sections, raw segments, gate internals, hidden canon/runtime metadata");
  sections.push("");
  sections.push("## Arm Definitions");
  sections.push("");
  sections.push("- `plain_chat`: assistant answer only.");
  sections.push("- `structured_chat`: structured assistant answer only.");
  sections.push("- `loegos_blindfolded`: real Loegos first turn, assistant answer only.");
  sections.push("- `loegos_sighted`: same real Loegos first turn, current surfaced UI object visible.");
  sections.push("- `schema_board`: same structured answer plus a generic visible external board.");
  sections.push("");
  sections.push("## Scenario Packs And Gold Labels");
  sections.push("");
  scenarios.forEach((scenario) => {
    sections.push(`### ${scenario.title}`);
    sections.push("");
    sections.push(renderJsonBlock(scenario));
    sections.push("");
  });

  sections.push("## Paired First-Turn Records");
  sections.push("");
  pairedRecords.forEach((pair) => {
    sections.push(`### ${pair.pairType} :: ${pair.scenarioId}`);
    sections.push("");
    sections.push(renderJsonBlock(pair));
    sections.push("");
  });

  sections.push("## Deterministic Score Table");
  sections.push("");
  sections.push(renderScoreTable(runRecords));
  sections.push("");
  sections.push("## Efficiency Table");
  sections.push("");
  sections.push(renderEfficiencyTable(verdict));
  sections.push("");
  sections.push("## Drive Tape Replays");
  sections.push("");
  runRecords
    .filter(
      (record) =>
        record.arm === "loegos_sighted" &&
        ["contradictory_return_journey", "working_echo_correction", "no_move_yet"].includes(record.scenarioId),
    )
    .forEach((record) => {
      sections.push(`### ${record.scenarioId}`);
      sections.push("");
      sections.push("#### replay");
      sections.push("");
      sections.push(renderTextBlock(renderDriveTapeReplay(record.driveTapeReplay)));
      sections.push("");
      sections.push("#### source classification");
      sections.push("");
      sections.push(renderJsonBlock(record.sourceClassification || {}));
      sections.push("");
      sections.push("#### replay json");
      sections.push("");
      sections.push(renderJsonBlock(record.driveTapeReplay || {}));
      sections.push("");
    });
  sections.push("## Per-Run Records");
  sections.push("");
  runRecords.forEach((record) => {
    sections.push(`### ${record.arm} :: ${record.scenarioId}`);
    sections.push("");
    sections.push(`- firstTurnAssistantText: ${record.firstTurnAssistantText}`);
    sections.push(`- secondTurnOutput: ${record.secondTurnOutput}`);
    sections.push(`- score: ${record.secondTurnScore.total}`);
    sections.push(`- degraded: ${record.degraded ? "yes" : "no"}`);
    sections.push("");
    sections.push("#### surfacedState");
    sections.push("");
    sections.push(renderJsonBlock(record.surfacedState));
    sections.push("");
    sections.push("#### evaluator-visible input");
    sections.push("");
    sections.push(renderTextBlock(record.secondTurnInputSeenByEvaluator));
    sections.push("");
    sections.push("#### second-turn structured output");
    sections.push("");
    sections.push(renderJsonBlock(record.secondTurnStructured));
    sections.push("");
    sections.push("#### second-turn score");
    sections.push("");
    sections.push(renderJsonBlock(record.secondTurnScore));
    sections.push("");
    sections.push("#### telemetry");
    sections.push("");
    sections.push(renderJsonBlock(record.openaiTelemetry));
    sections.push("");
    sections.push("#### prompts");
    sections.push("");
    sections.push(renderJsonBlock(record.prompt));
    sections.push("");
  });

  sections.push("## Blind Auditor Appendix");
  sections.push("");
  sections.push(`- requestId: ${blindAuditor?.openaiCall?.requestId || ""}`);
  sections.push(`- model: ${blindAuditor?.openaiCall?.model || ""}`);
  sections.push("");
  sections.push("### Prompt");
  sections.push("");
  sections.push(renderJsonBlock(blindAuditor?.prompt || {}));
  sections.push("");
  sections.push("### Raw output");
  sections.push("");
  sections.push(renderTextBlock(blindAuditor?.rawOutputText || ""));
  sections.push("");
  sections.push("### Raw payload");
  sections.push("");
  sections.push(renderJsonBlock(blindAuditor?.rawPayload || {}));
  sections.push("");
  sections.push(buildFailureAppendix(preflight, runRecords, blindAuditor, verdict));
  sections.push("");
  sections.push("## Final Conclusion");
  sections.push("");
  sections.push(renderJsonBlock(verdict || {}));
  sections.push("");

  return sections.join("\n");
}

async function writeReport(reportPath, report) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${report}\n`, "utf8");
}

export async function runTestDriveIiBenchmark({
  cwd = process.cwd(),
  reportPath = TEST_DRIVE_II_MASTER_REPORT_PATH,
  writeReportToDisk = true,
} = {}) {
  const preflight = await runPreflight(cwd);
  const pairedRecords = [];
  const runRecords = [];

  for (const scenario of WORKING_ECHO_SCENARIOS) {
    runRecords.push(await runPlainChatArm(scenario));

    const structured = await runStructuredAndSchemaBoardArms(scenario);
    pairedRecords.push(structured.pairRecord);
    runRecords.push(...structured.records);

    const loegos = await runLoegosVisibilityArms(scenario);
    pairedRecords.push(loegos.pairRecord);
    runRecords.push(...loegos.records);
  }

  const verdict = buildTestDriveIiVerdict(runRecords, preflight);
  const blindAuditor = await runBlindAuditor({ runRecords, verdict });
  const gitSha = normalizeText(process.env.GIT_COMMIT_SHA || readGitSha(cwd));
  const report = buildTestDriveIiReport({
    generatedAt: new Date().toISOString(),
    cwd,
    gitSha,
    nodeVersion: process.version,
    preflight,
    scenarios: WORKING_ECHO_SCENARIOS,
    pairedRecords,
    runRecords,
    blindAuditor,
    verdict,
    reportPath,
  });

  if (writeReportToDisk) {
    await writeReport(reportPath, report);
  }

  return {
    ok: true,
    reportPath,
    preflight,
    pairedRecords,
    runRecords,
    blindAuditor,
    verdict,
    report,
  };
}
