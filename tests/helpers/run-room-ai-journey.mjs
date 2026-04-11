import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { generateAiUserTurn, hashAiUserValue } from "./ai-user-generator.mjs";
import { runRoomJourney } from "./run-room-journey.mjs";
import { runRoomRouteJourney } from "./run-room-route-journey.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(path, value = "") {
  await writeFile(path, String(value || ""), "utf8");
}

function extractSentinelToken(aiUser = null) {
  return normalizeText(aiUser?.sentinelToken);
}

function collectRoomSurfaceStrings(result = null) {
  return JSON.stringify(
    {
      promptPacket: result?.turnStage?.promptPacket || null,
      rawModelPayload: result?.turnStage?.rawModelPayload || result?.turnRawModelPayload || null,
      guardedTurn: result?.turnStage?.guardedTurn || result?.turnResult?.body?.turn || null,
      turnView: result?.turnStage?.viewAfterTurn || result?.turnResult?.body?.view || null,
      applyView: result?.applyStage?.viewAfterApply || result?.applyResult?.body?.view || null,
      receiptView: result?.receiptResult?.body?.view || null,
      finalSource: result?.applyStage?.sourceAfterApply || result?.finalSource || "",
    },
    null,
    2,
  );
}

function buildResponderHashes(result = null) {
  const serviceStagePacket = result?.turnStage?.stagePacket || null;
  const routeFetchBody = result?.turnFetchBody || null;
  const routeRawPayload = result?.turnRawModelPayload || null;

  return {
    promptHash:
      normalizeText(serviceStagePacket?.promptHash) ||
      (routeFetchBody ? hashAiUserValue(routeFetchBody) : ""),
    payloadHash:
      normalizeText(serviceStagePacket?.rawModelPayloadHash) ||
      (routeRawPayload ? hashAiUserValue(routeRawPayload) : ""),
  };
}

function buildLeakVerdict({ aiUser = null, generation = null, result = null } = {}) {
  const sentinelToken = extractSentinelToken(aiUser);
  const generatedMessage = normalizeText(generation?.visibleMessage);
  const roomSurface = collectRoomSurfaceStrings(result);

  const boundaryOnlyMessage = {
    crossedFields: ["message"],
    visibleMessage: generatedMessage,
  };

  const leakDetected = Boolean(
    sentinelToken &&
      (generatedMessage.includes(sentinelToken) || roomSurface.includes(sentinelToken)),
  );

  return {
    sentinelTokenPresent: Boolean(sentinelToken),
    leakDetected,
    reason: sentinelToken
      ? leakDetected
        ? "Hidden generator token appeared outside the generator context."
        : "Hidden generator token stayed outside the Room path."
      : "No sentinel token configured for this journey.",
    boundary: boundaryOnlyMessage,
  };
}

async function appendAiUserDossier(result, {
  aiUser = null,
  generation = null,
  dossierDir = "",
  mode = "service-core",
} = {}) {
  if (!normalizeText(dossierDir)) return;

  const leakVerdict = buildLeakVerdict({ aiUser, generation, result });
  const responderHashes = buildResponderHashes(result);
  const aiMetadata = {
    fixtureId: result?.fixture?.id || "",
    mode,
    userTurnGeneratedBy: "model",
    roomResponseGeneratedBy: "stub",
    provider: generation?.provider || "",
    model: generation?.model || "",
    promptHash: generation?.promptHash || "",
    responseHash: generation?.responseHash || "",
    responderPromptHash: responderHashes.promptHash || "",
    responderPayloadHash: responderHashes.payloadHash || "",
    memoryEnabled: Boolean(generation?.isolation?.memory),
    toolsEnabled: Boolean(generation?.isolation?.tools),
    isolatedContext: Boolean(generation?.isolation?.isolatedContext),
    sharedThread: Boolean(generation?.isolation?.sharedThread),
    sharedRun: Boolean(generation?.isolation?.sharedRun),
    isolationVerdict: generation?.isolation?.isolatedContext
      ? "generator stayed in a separate stateless context"
      : "generator isolation could not be verified",
  };

  await writeJson(join(dossierDir, "20-ai-user-metadata.json"), aiMetadata);
  await writeJson(join(dossierDir, "21-ai-user-boundary.json"), {
    visibleMessage: generation?.visibleMessage || "",
    crossedFields: ["message"],
    responderPromptHash: responderHashes.promptHash || "",
    responderPayloadHash: responderHashes.payloadHash || "",
    assertion: "Only the visible message string crossed from generator to the Room path.",
  });
  await writeJson(join(dossierDir, "22-ai-user-leak-verdict.json"), leakVerdict);
  await writeText(
    join(dossierDir, "23-ai-user-report.md"),
    [
      `# ${result?.fixture?.id || "ai-user-journey"}`,
      "",
      `- generator provider: ${generation?.provider || "unknown"}`,
      `- generator model: ${generation?.model || "unknown"}`,
      `- userTurnGeneratedBy: model`,
      `- roomResponseGeneratedBy: stub`,
      `- isolated context: ${generation?.isolation?.isolatedContext ? "yes" : "no"}`,
      `- exact visible message: ${generation?.visibleMessage || ""}`,
      `- leak detected: ${leakVerdict.leakDetected ? "yes" : "no"}`,
      `- leak verdict: ${leakVerdict.reason}`,
      "",
    ].join("\n"),
  );
}

function materializeAiFixture(fixture = null, visibleMessage = "") {
  const nextFixture = clone(fixture);
  nextFixture.turn = {
    ...(nextFixture.turn || {}),
    userMessage: visibleMessage,
  };
  return nextFixture;
}

export async function runRoomAiJourney(
  fixture,
  { artifactRoot = "test-results/room-agent-collaboration/service-core" } = {},
) {
  const generation = await generateAiUserTurn({
    fixtureId: fixture?.id,
    aiUser: fixture?.aiUser,
  });

  if (generation.skipped) {
    return {
      skipped: true,
      skipReason: generation.skipReason,
      fixture,
    };
  }

  const materializedFixture = materializeAiFixture(fixture, generation.visibleMessage);
  const result = await runRoomJourney(materializedFixture, {
    writeDossierArtifacts: true,
    artifactRoot,
  });

  const enriched = {
    ...result,
    aiUser: {
      config: clone(fixture?.aiUser),
      generation,
      leakVerdict: buildLeakVerdict({
        aiUser: fixture?.aiUser,
        generation,
        result,
      }),
    },
  };

  await appendAiUserDossier(enriched, {
    aiUser: fixture?.aiUser,
    generation,
    dossierDir: result?.dossierDir,
    mode: "service-core",
  });

  return enriched;
}

export async function runRoomAiRouteJourney(
  fixture,
  { artifactRoot = "test-results/room-agent-collaboration/route" } = {},
) {
  const generation = await generateAiUserTurn({
    fixtureId: fixture?.id,
    aiUser: fixture?.aiUser,
  });

  if (generation.skipped) {
    return {
      skipped: true,
      skipReason: generation.skipReason,
      fixture,
    };
  }

  const materializedFixture = materializeAiFixture(fixture, generation.visibleMessage);
  const result = await runRoomRouteJourney(materializedFixture, {
    writeDossierArtifacts: true,
    artifactRoot,
  });

  const enriched = {
    ...result,
    aiUser: {
      config: clone(fixture?.aiUser),
      generation,
      leakVerdict: buildLeakVerdict({
        aiUser: fixture?.aiUser,
        generation,
        result,
      }),
    },
  };

  await appendAiUserDossier(enriched, {
    aiUser: fixture?.aiUser,
    generation,
    dossierDir: result?.dossierDir,
    mode: "route",
  });

  return enriched;
}

export function buildAiTruthPathFingerprint(result = null) {
  const serviceResult = result?.turnStage || null;
  const routeBody = result?.turnResult?.body || null;

  return {
    classifiedTurnMode:
      serviceResult?.stagePacket?.classifiedTurnMode ||
      normalizeText(routeBody?.turn?.turnMode) ||
      "unknown",
    previewPresent: Boolean(
      serviceResult?.viewAfterTurn?.activePreview || routeBody?.view?.activePreview,
    ),
    gateAccepted:
      serviceResult?.gateResult?.accepted ??
      routeBody?.turn?.gatePreview?.accepted ??
      null,
    canonicalMutation:
      result?.applyStage?.flags?.sourceMutated ??
      (result?.initialSnapshot?.source && result?.finalSource
        ? hashAiUserValue(result.initialSnapshot.source) !== hashAiUserValue(result.finalSource)
        : null),
    runtimeMutation:
      result?.applyStage?.flags?.runtimeMutated ??
      (result?.initialSnapshot?.runtimeWindow && result?.finalSnapshot?.runtimeWindow
        ? hashAiUserValue(result.initialSnapshot.runtimeWindow) !== hashAiUserValue(result.finalSnapshot.runtimeWindow)
        : null),
  };
}
