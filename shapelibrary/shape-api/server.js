import { randomUUID } from "node:crypto";
import express from "express";
import { normalizeToCanonicalIR } from "../shape-core/translator.js";
import { analyzeCanonicalIR } from "../shape-core/engine.js";
import { loadFeatureFlagsFromEnv } from "../shape-core/features.js";
import { applyMythDecompression, hasNonMythReceipt } from "../shape-core/myth.js";
import { receiptsSatisfyAssemblyClass } from "../shape-core/assembly-path.js";
import { openDatabase, migrate } from "../shape-store/db.js";
import {
  getCandidateById,
  insertCandidateFromRun,
  insertMintedPrimitive,
  insertReceipt,
  insertRun,
  listCandidates,
  listLibrary,
  listReceiptsForCandidate,
  recordPromotionDecision,
  saveEpisode,
  seedLibraryIfEmpty,
  suggestPrimitiveLink,
  updateCandidateLibraryFields,
  updateCandidateStatus,
} from "../shape-store/repository.js";
import { ERROR_CODES } from "../shape-core/contracts.js";
import {
  validateIR,
  validatePromote,
  validateMythIrSemantics,
  assertAnalyzeResultShape,
  assertEvaluateResultShape,
} from "./validator.js";
import { evaluateEpisodes } from "../shape-eval/evaluator.js";
import {
  exportAnalyzeError,
  exportAnalyzeSuccess,
  exportEvaluateSuccess,
  exportPromoteBlocked,
  exportPromoteSuccess,
} from "./result-writer.js";
import fs from "node:fs";
import path from "node:path";

const app = express();
app.use(express.json({ limit: "2mb" }));

const db = openDatabase();
migrate(db);
seedLibraryIfEmpty(db);

const featureFlags = loadFeatureFlagsFromEnv();

function buildLibrary() {
  return listLibrary(db, { type: "all" });
}

function writeError(res, status, code, message, details = []) {
  return res.status(status).json({ ok: false, error: { code, message, details } });
}

function relPath(absolutePath) {
  if (!absolutePath) return null;
  return path.relative(process.cwd(), absolutePath);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "shapelibrary", version: "0.2.0" });
});

app.post("/v1/analyze", (req, res) => {
  let ir = normalizeToCanonicalIR(req.body || {});

  if (ir.inputMode === "myth" && !featureFlags.enableMyth) {
    const exportedTo = relPath(
      exportAnalyzeError({
        ir,
        code: ERROR_CODES.MYTH_MODE_DISABLED,
        message: "Myth inputMode requires SHAPELIBRARY_ENABLE_MYTH=1",
        details: [],
      }),
    );
    return res.status(400).json({
      ok: false,
      error: {
        code: ERROR_CODES.MYTH_MODE_DISABLED,
        message: "Myth inputMode requires SHAPELIBRARY_ENABLE_MYTH=1",
        details: [],
      },
      exportedTo,
    });
  }

  if (ir.inputMode === "myth" && featureFlags.enableMyth) {
    const mv = validateMythIrSemantics(ir, featureFlags);
    if (!mv.ok) {
      const exportedTo = relPath(
        exportAnalyzeError({
          ir,
          code: mv.error.code,
          message: mv.error.message,
          details: mv.error.details,
        }),
      );
      return res.status(400).json({
        ok: false,
        error: { code: mv.error.code, message: mv.error.message, details: mv.error.details },
        exportedTo,
      });
    }
    ir = applyMythDecompression(ir);
  }

  const valid = validateIR(ir);
  if (!valid.ok) {
    const exportedTo = relPath(
      exportAnalyzeError({
        ir,
        code: valid.error.code,
        message: valid.error.message,
        details: valid.error.details,
      }),
    );
    return res.status(400).json({
      ok: false,
      error: { code: valid.error.code, message: valid.error.message, details: valid.error.details },
      exportedTo,
    });
  }

  const result = analyzeCanonicalIR(ir, { library: buildLibrary(), features: featureFlags });
  if (!result.ok) {
    const exportedTo = relPath(
      exportAnalyzeError({
        ir,
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
      }),
    );
    return res.status(422).json({
      ok: false,
      error: { code: result.error.code, message: result.error.message, details: result.error.details },
      exportedTo,
    });
  }

  insertRun(db, ir, result.value);
  if (!result.value.gate?.passed) {
    const details = [
      { gate: result.value.gate, reads: result.value.reads, ambiguities: result.value.ambiguities },
    ];
    const exportedTo = relPath(
      exportAnalyzeError({
        ir,
        code: ERROR_CODES.GATE_FAILED,
        message: "Analyze gate failed",
        details,
      }),
    );
    return res.status(422).json({
      ok: false,
      error: { code: ERROR_CODES.GATE_FAILED, message: "Analyze gate failed", details },
      exportedTo,
    });
  }
  const candidateId = insertCandidateFromRun(db, ir, result.value);
  const output = { ...result.value, candidateId };
  if (!assertAnalyzeResultShape(output)) {
    return writeError(res, 500, ERROR_CODES.INVALID_INPUT, "Analyze result schema mismatch");
  }
  const exportedTo = relPath(exportAnalyzeSuccess({ ir, value: output }));
  return res.json({ ok: true, value: output, exportedTo });
});

app.get("/v1/library", (req, res) => {
  const type = String(req.query.type || "all");
  const status = req.query.status ? String(req.query.status) : undefined;
  const minConfidence = req.query.minConfidence ? Number(req.query.minConfidence) : undefined;
  const value = listLibrary(db, { type, status, minConfidence });
  res.json({ ok: true, value });
});

app.post("/v1/evaluate", (req, res) => {
  const filePath = path.resolve(process.cwd(), "fixtures", "episodes", "benchmark.episodes.json");
  const fileEpisodes = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf8"))
    : [];
  const episodes = Array.isArray(req.body?.episodes) && req.body.episodes.length ? req.body.episodes : fileEpisodes;
  for (const episode of episodes) {
    saveEpisode(db, episode);
  }
  const iterations = Number(req.body?.iterations || 3);
  const value = evaluateEpisodes({
    episodes,
    iterations,
    library: buildLibrary(),
    features: featureFlags,
  });
  if (!assertEvaluateResultShape(value)) {
    return writeError(res, 500, ERROR_CODES.INVALID_INPUT, "Evaluate result schema mismatch");
  }
  const exportedTo = relPath(exportEvaluateSuccess({ requestBody: req.body || {}, value }));
  return res.json({ ok: true, value, exportedTo });
});

app.post("/v1/promote", (req, res) => {
  const valid = validatePromote(req.body || {});
  if (!valid.ok) {
    return writeError(res, 400, valid.error.code, valid.error.message, valid.error.details);
  }
  const {
    candidateId,
    targetType,
    receiptEvidence,
    reproducibility = 0,
    utility = 0,
    nonAdditive = false,
    newFailureSignature = false,
    newTransferPrediction = false,
    crossDomainConvergence,
    assemblyClass,
    libraryAction,
    targetShapeId,
    mintedName,
  } = req.body;
  const candidate = getCandidateById(db, candidateId);
  if (!candidate) return writeError(res, 404, ERROR_CODES.INVALID_INPUT, "Candidate not found");

  const fromState = candidate.status;
  if (!Array.isArray(receiptEvidence) || !receiptEvidence.length) {
    recordPromotionDecision(db, {
      candidateId,
      targetType,
      fromState,
      toState: fromState,
      approved: false,
      rationale: "Blocked: no receipt evidence",
    });
    const exportedTo = relPath(
      exportPromoteBlocked({
        requestBody: req.body,
        code: ERROR_CODES.PROMOTION_BLOCKED_MISSING_RECEIPTS,
        message: "Promotion blocked: no receipts supplied",
      }),
    );
    return res.status(422).json({
      ok: false,
      error: {
        code: ERROR_CODES.PROMOTION_BLOCKED_MISSING_RECEIPTS,
        message: "Promotion blocked: no receipts supplied",
        details: [],
      },
      exportedTo,
    });
  }

  const cdc =
    crossDomainConvergence !== undefined && crossDomainConvergence !== null
      ? Number(crossDomainConvergence)
      : NaN;
  const thresholdsOkClassic = Number(reproducibility) >= 0.8 && Number(utility) >= 0.5;
  const thresholdsOkConvergence =
    !Number.isNaN(cdc) && cdc >= 0.5 && Number(utility) >= 0.5;
  const thresholdsOk = thresholdsOkClassic || thresholdsOkConvergence;

  const assemblyRulesOk =
    targetType !== "assembly" ||
    (Boolean(nonAdditive) && Boolean(newFailureSignature) && Boolean(newTransferPrediction));

  for (const receipt of receiptEvidence) {
    insertReceipt(db, {
      candidateId,
      receiptType: String(receipt.receiptType || "runtime_observation"),
      payload: receipt.payload || {},
      accepted: true,
    });
  }

  const receipts = listReceiptsForCandidate(db, candidateId);
  const resolvedAssemblyClass = String(
    candidate.assemblyClass || assemblyClass || "combinable",
  );
  const classReceiptCheck = receiptsSatisfyAssemblyClass(receipts, resolvedAssemblyClass);

  const mythEvidenceBlock =
    featureFlags.enableMyth &&
    candidate.isMythDerived &&
    !hasNonMythReceipt(receiptEvidence);

  const approved =
    receipts.length > 0 &&
    thresholdsOk &&
    assemblyRulesOk &&
    classReceiptCheck.passed &&
    !mythEvidenceBlock;

  const toState = approved ? "promoted" : "provisional";

  let rationale = approved
    ? "Promotion approved via receipt gate"
    : mythEvidenceBlock
      ? "Myth-derived candidate requires at least one non-myth receipt"
      : !classReceiptCheck.passed
        ? `Missing class-specific receipts: ${classReceiptCheck.missing.join(", ")}`
      : targetType === "assembly" && !assemblyRulesOk
        ? "Assembly promotion blocked: non-additivity/new failure/new prediction not satisfied"
        : "Receipts present; thresholds not met";

  updateCandidateStatus(db, candidateId, toState);
  updateCandidateLibraryFields(db, candidateId, { assemblyClass: resolvedAssemblyClass });

  let linkedShapeId = null;
  let mintedShapeId = null;
  let libraryMergeStatus = null;

  if (approved && libraryAction) {
    if (libraryAction === "link") {
      const tid = targetShapeId || suggestPrimitiveLink(db, candidate.invariant);
      if (tid) {
        linkedShapeId = tid;
        libraryMergeStatus = "linked";
        updateCandidateLibraryFields(db, candidateId, { linkedShapeId: tid, libraryMergeStatus: "linked" });
      } else {
        libraryMergeStatus = "pending";
        updateCandidateLibraryFields(db, candidateId, { libraryMergeStatus: "pending" });
      }
    } else if (libraryAction === "mint") {
      const shapeId = `mint_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
      insertMintedPrimitive(db, {
        shapeId,
        name: mintedName || "MintedPrimitive",
        invariantText: candidate.invariant,
        metadata: { source: "promotion_mint", candidateId },
      });
      mintedShapeId = shapeId;
      linkedShapeId = shapeId;
      libraryMergeStatus = "minted";
      updateCandidateLibraryFields(db, candidateId, {
        linkedShapeId: shapeId,
        libraryMergeStatus: "minted",
      });
    } else if (libraryAction === "pending") {
      libraryMergeStatus = "pending";
      updateCandidateLibraryFields(db, candidateId, { libraryMergeStatus: "pending" });
    }
  }

  const decisionId = recordPromotionDecision(db, {
    candidateId,
    targetType,
    fromState,
    toState,
    approved,
    rationale,
  });

  const promoteValue = {
    decisionId,
    candidateId,
    fromState,
    toState,
    approved,
    receiptsAccepted: receipts.length,
    assemblyRules: {
      nonAdditive: Boolean(nonAdditive),
      newFailureSignature: Boolean(newFailureSignature),
      newTransferPrediction: Boolean(newTransferPrediction),
      passed: assemblyRulesOk,
    },
    thresholds: {
      reproducibility: Number(reproducibility),
      utility: Number(utility),
      crossDomainConvergence: Number.isNaN(cdc) ? null : cdc,
      passedClassic: thresholdsOkClassic,
      passedWithConvergence: thresholdsOk,
    },
    assemblyPath: {
      assemblyClass: resolvedAssemblyClass,
      receiptsPassed: classReceiptCheck.passed,
      requiredReceipts: classReceiptCheck.required,
      missingReceipts: classReceiptCheck.missing,
    },
    libraryOutcome: {
      linkedShapeId,
      mintedShapeId,
      libraryMergeStatus,
    },
  };
  const exportedTo = relPath(exportPromoteSuccess({ requestBody: req.body, value: promoteValue }));
  return res.json({ ok: true, value: promoteValue, exportedTo });
});

app.get("/v1/candidates", (_req, res) => {
  res.json({ ok: true, value: listCandidates(db) });
});

const port = Number(process.env.SHAPELIBRARY_PORT || 4310);
app.listen(port, () => {
  console.info(`Shape Library API listening on http://localhost:${port}`);
});
