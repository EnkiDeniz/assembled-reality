import { randomUUID } from "node:crypto";

function toJson(value) {
  return JSON.stringify(value ?? {});
}

function tokenize(text = "") {
  return String(text || "")
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter(Boolean);
}

function similarityScoreInv(a, b) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap / Math.max(left.size, right.size);
}

export function seedLibraryIfEmpty(db) {
  const primitiveCount = db.prepare("SELECT COUNT(*) AS count FROM ShapePrimitive").get().count;
  if (primitiveCount > 0) return;

  const now = new Date().toISOString();
  const insertPrimitive = db.prepare(`
    INSERT INTO ShapePrimitive (shapeId, name, invariantText, status, metadataJson, createdAt)
    VALUES (@shapeId, @name, @invariantText, @status, @metadataJson, @createdAt)
  `);

  const starterPrimitives = [
    { shapeId: "primitive_bottleneck", name: "Bottleneck", invariantText: "One constrained step limits whole flow." },
    { shapeId: "primitive_feedback_loop", name: "FeedbackLoop", invariantText: "Output reinforces its own input over cycles." },
    { shapeId: "primitive_gate_dependency", name: "GateDependency", invariantText: "Progress blocked until specific condition is met." },
    { shapeId: "primitive_saturation", name: "Saturation", invariantText: "Additional input yields diminishing returns." },
    { shapeId: "primitive_extraction", name: "Extraction", invariantText: "Value removed faster than replenishment." },
  ];

  for (const row of starterPrimitives) {
    insertPrimitive.run({
      ...row,
      status: "promoted",
      metadataJson: toJson({ source: "starter_library_v0_1" }),
      createdAt: now,
    });
  }
}

export function listLibrary(db, { type = "all", status, minConfidence } = {}) {
  const primitives =
    type === "assembly"
      ? []
      : db.prepare("SELECT shapeId, name, invariantText, status, metadataJson, createdAt FROM ShapePrimitive").all();
  const assemblies =
    type === "primitive"
      ? []
      : db.prepare("SELECT shapeId, name, invariantText, status, metadataJson, createdAt FROM ShapeAssembly").all();

  const mapRows = (rows) =>
    rows
      .map((row) => ({
        ...row,
        metadata: JSON.parse(row.metadataJson || "{}"),
      }))
      .filter((row) => (status ? row.status === status : true))
      .filter((row) => (typeof minConfidence === "number" ? Number(row.metadata?.confidence || 0) >= minConfidence : true));

  return {
    primitives: mapRows(primitives),
    assemblies: mapRows(assemblies),
  };
}

export function insertRun(db, ir, result) {
  const kernelState = result.kernel?.stateMode ?? null;
  const kernelTraceJson = result.kernel ? toJson(result.kernel.kernelGateDetails ?? result.kernel) : null;
  const convergenceScore = result.crossDomain?.convergenceScore ?? null;
  const domainMapJson = result.crossDomain ? toJson(result.crossDomain) : null;
  const isMythDerived = result.isMythDerived ? 1 : 0;
  const assemblyClass = result.assemblyClass ?? null;
  const maturationJson = result.maturation ? toJson(result.maturation) : null;

  db.prepare(`
    INSERT INTO ShapeRun (
      runId, runType, inputMode, mode, intentLayer, granularity, resultType, confidence,
      confidenceSource, modelVersion, promptHash, traceJson, readsJson, gateJson,
      kernelState, kernelTraceJson, convergenceScore, domainMapJson, isMythDerived,
      assemblyClass, maturationJson,
      createdAt
    ) VALUES (
      @runId, @runType, @inputMode, @mode, @intentLayer, @granularity, @resultType, @confidence,
      @confidenceSource, @modelVersion, @promptHash, @traceJson, @readsJson, @gateJson,
      @kernelState, @kernelTraceJson, @convergenceScore, @domainMapJson, @isMythDerived,
      @assemblyClass, @maturationJson,
      @createdAt
    )
  `).run({
    runId: ir.runId,
    runType: ir.runType,
    inputMode: ir.inputMode,
    mode: ir.mode,
    intentLayer: ir.intentLayer,
    granularity: result.granularity,
    resultType: result.resultType,
    confidence: result.confidence,
    confidenceSource: result.confidenceSource,
    modelVersion: String(ir?.metadata?.trace?.modelVersion || "unknown"),
    promptHash: String(ir?.metadata?.trace?.promptHash || "unknown"),
    traceJson: toJson(ir?.metadata?.trace || {}),
    readsJson: toJson(result.reads),
    gateJson: toJson(result.gate),
    kernelState,
    kernelTraceJson,
    convergenceScore,
    domainMapJson,
    isMythDerived,
    assemblyClass,
    maturationJson,
    createdAt: new Date().toISOString(),
  });
}

export function insertCandidateFromRun(db, ir, result) {
  if (!result.resultType.startsWith("candidate_")) return null;
  const candidateId = randomUUID();
  const kernelState = result.kernel?.stateMode ?? null;
  const convergenceScore = result.crossDomain?.convergenceScore ?? null;
  const domainMapJson = result.crossDomain ? toJson(result.crossDomain) : null;
  const isMythDerived = result.isMythDerived ? 1 : 0;
  const assemblyClass = result.assemblyClass ?? null;
  const maturationJson = result.maturation ? toJson(result.maturation) : null;

  db.prepare(`
    INSERT INTO ShapeCandidate (
      candidateId, runId, resultType, granularity, invariant, status, createdAt,
      linkedShapeId, libraryMergeStatus, kernelState, convergenceScore, domainMapJson, isMythDerived,
      assemblyClass, maturationJson
    )
    VALUES (
      @candidateId, @runId, @resultType, @granularity, @invariant, @status, @createdAt,
      NULL, NULL, @kernelState, @convergenceScore, @domainMapJson, @isMythDerived,
      @assemblyClass, @maturationJson
    )
  `).run({
    candidateId,
    runId: ir.runId,
    resultType: result.resultType,
    granularity: result.granularity,
    invariant: String(ir.invariant || ""),
    status: "candidate",
    createdAt: new Date().toISOString(),
    kernelState,
    convergenceScore,
    domainMapJson,
    isMythDerived,
    assemblyClass,
    maturationJson,
  });
  return candidateId;
}

export function listCandidates(db) {
  return db
    .prepare(
      `SELECT candidateId, runId, resultType, granularity, invariant, status, createdAt,
       linkedShapeId, libraryMergeStatus, kernelState, convergenceScore, domainMapJson, isMythDerived,
       assemblyClass, maturationJson
       FROM ShapeCandidate ORDER BY createdAt DESC`,
    )
    .all()
    .map((row) => ({
      ...row,
      isMythDerived: row.isMythDerived === 1,
      maturation:
        typeof row.maturationJson === "string" && row.maturationJson.length
          ? JSON.parse(row.maturationJson)
          : null,
    }));
}

export function insertReceipt(db, { candidateId, receiptType, payload, accepted = true }) {
  const receiptId = randomUUID();
  db.prepare(`
    INSERT INTO ShapeReceipt (receiptId, candidateId, receiptType, payloadJson, accepted, createdAt)
    VALUES (@receiptId, @candidateId, @receiptType, @payloadJson, @accepted, @createdAt)
  `).run({
    receiptId,
    candidateId,
    receiptType,
    payloadJson: toJson(payload),
    accepted: accepted ? 1 : 0,
    createdAt: new Date().toISOString(),
  });
  return receiptId;
}

export function listReceiptsForCandidate(db, candidateId) {
  return db
    .prepare("SELECT receiptId, candidateId, receiptType, payloadJson, accepted, createdAt FROM ShapeReceipt WHERE candidateId = ?")
    .all(candidateId)
    .map((row) => ({ ...row, payload: JSON.parse(row.payloadJson || "{}"), accepted: row.accepted === 1 }));
}

export function recordPromotionDecision(
  db,
  { candidateId, targetType, fromState, toState, approved, rationale },
) {
  const decisionId = randomUUID();
  db.prepare(`
    INSERT INTO ShapePromotionDecision (decisionId, candidateId, targetType, fromState, toState, approved, rationale, createdAt)
    VALUES (@decisionId, @candidateId, @targetType, @fromState, @toState, @approved, @rationale, @createdAt)
  `).run({
    decisionId,
    candidateId,
    targetType,
    fromState,
    toState,
    approved: approved ? 1 : 0,
    rationale,
    createdAt: new Date().toISOString(),
  });
  return decisionId;
}

export function updateCandidateStatus(db, candidateId, status) {
  db.prepare("UPDATE ShapeCandidate SET status = ? WHERE candidateId = ?").run(status, candidateId);
}

export function updateCandidateLibraryFields(db, candidateId, fields) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  const setClause = entries.map(([k]) => `${k} = @${k}`).join(", ");
  const params = { candidateId, ...Object.fromEntries(entries) };
  db.prepare(`UPDATE ShapeCandidate SET ${setClause} WHERE candidateId = @candidateId`).run(params);
}

export function getCandidateById(db, candidateId) {
  const row =
    db
      .prepare(
        `SELECT candidateId, runId, resultType, granularity, invariant, status, createdAt,
         linkedShapeId, libraryMergeStatus, kernelState, convergenceScore, domainMapJson, isMythDerived,
         assemblyClass, maturationJson
         FROM ShapeCandidate WHERE candidateId = ?`,
      )
      .get(candidateId) || null;
  if (!row) return null;
  return {
    ...row,
    isMythDerived: row.isMythDerived === 1,
    maturation:
      typeof row.maturationJson === "string" && row.maturationJson.length
        ? JSON.parse(row.maturationJson)
        : null,
  };
}

export function suggestPrimitiveLink(db, invariant, threshold = 0.55) {
  const rows = db.prepare("SELECT shapeId, invariantText FROM ShapePrimitive").all();
  let best = null;
  for (const row of rows) {
    const s = similarityScoreInv(invariant, row.invariantText);
    if (s >= threshold && (!best || s > best.score)) best = { shapeId: row.shapeId, score: s };
  }
  return best?.shapeId ?? null;
}

export function insertMintedPrimitive(db, { shapeId, name, invariantText, metadata = {} }) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO ShapePrimitive (shapeId, name, invariantText, status, metadataJson, createdAt)
    VALUES (@shapeId, @name, @invariantText, @status, @metadataJson, @createdAt)
  `).run({
    shapeId,
    name,
    invariantText,
    status: "promoted",
    metadataJson: toJson(metadata),
    createdAt: now,
  });
}

export function saveEpisode(db, episode) {
  db.prepare(`
    INSERT OR REPLACE INTO ShapeEpisode (episodeId, label, payloadJson, expectedJson, createdAt)
    VALUES (@episodeId, @label, @payloadJson, @expectedJson, @createdAt)
  `).run({
    episodeId: episode.episodeId,
    label: episode.label,
    payloadJson: toJson(episode.payload),
    expectedJson: toJson(episode.expected || {}),
    createdAt: new Date().toISOString(),
  });
}
