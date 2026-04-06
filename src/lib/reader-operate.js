import { prisma } from "@/lib/prisma";

function normalizeOperateRun(record = null) {
  if (!record) return null;

  return {
    id: String(record.id || ""),
    userId: String(record.userId || ""),
    projectId: record.projectId ? String(record.projectId) : null,
    documentKey: String(record.documentKey || ""),
    mode: String(record.mode || "overlay"),
    schemaVersion: Number(record.schemaVersion) || 1,
    engineKind: String(record.engineKind || ""),
    engineVersion: String(record.engineVersion || ""),
    modelName: record.modelName ? String(record.modelName) : "",
    promptVersion: record.promptVersion ? String(record.promptVersion) : "",
    sourceFingerprint: String(record.sourceFingerprint || ""),
    stale: Boolean(record.stale),
    payloadJson:
      record.payloadJson && typeof record.payloadJson === "object" ? record.payloadJson : null,
    createdAt: record.createdAt ? record.createdAt.toISOString() : "",
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : "",
  };
}

function normalizeAttestedOverride(record = null) {
  if (!record) return null;

  return {
    id: String(record.id || ""),
    userId: String(record.userId || ""),
    projectId: record.projectId ? String(record.projectId) : null,
    documentKey: String(record.documentKey || ""),
    blockId: String(record.blockId || ""),
    spanStart: Number.isInteger(record.spanStart) ? record.spanStart : null,
    spanEnd: Number.isInteger(record.spanEnd) ? record.spanEnd : null,
    excerptSnapshot: String(record.excerptSnapshot || ""),
    note: String(record.note || ""),
    createdAt: record.createdAt ? record.createdAt.toISOString() : "",
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : "",
  };
}

export async function createReaderOperateRunForUser(userId, input = {}) {
  const created = await prisma.readerOperateRun.create({
    data: {
      userId,
      projectId: input.projectId || null,
      documentKey: String(input.documentKey || "").trim(),
      mode: String(input.mode || "overlay").trim() || "overlay",
      schemaVersion: Number(input.schemaVersion) || 1,
      engineKind: String(input.engineKind || "").trim(),
      engineVersion: String(input.engineVersion || "").trim(),
      modelName: input.modelName ? String(input.modelName).trim() : null,
      promptVersion: input.promptVersion ? String(input.promptVersion).trim() : null,
      sourceFingerprint: String(input.sourceFingerprint || "").trim(),
      stale: Boolean(input.stale),
      payloadJson: input.payloadJson || {},
    },
  });

  return normalizeOperateRun(created);
}

export async function getLatestReaderOperateRunForUser(
  userId,
  {
    projectId = null,
    documentKey = "",
    mode = "overlay",
  } = {},
) {
  const normalizedDocumentKey = String(documentKey || "").trim();
  if (!normalizedDocumentKey) return null;

  const record = await prisma.readerOperateRun.findFirst({
    where: {
      userId,
      documentKey: normalizedDocumentKey,
      mode: String(mode || "overlay").trim() || "overlay",
      ...(projectId ? { projectId } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return normalizeOperateRun(record);
}

export async function listReaderAttestedOverridesForUser(
  userId,
  {
    projectId = null,
    documentKey = "",
  } = {},
) {
  const normalizedDocumentKey = String(documentKey || "").trim();
  if (!normalizedDocumentKey) return [];

  const rows = await prisma.readerAttestedOverride.findMany({
    where: {
      userId,
      documentKey: normalizedDocumentKey,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return rows.map((row) => normalizeAttestedOverride(row)).filter(Boolean);
}

export async function upsertReaderAttestedOverrideForUser(userId, input = {}) {
  const documentKey = String(input.documentKey || "").trim();
  const blockId = String(input.blockId || "").trim();
  const note = String(input.note || "").trim();

  if (!documentKey) {
    throw new Error("Document key is required for an attested override.");
  }
  if (!blockId) {
    throw new Error("Block id is required for an attested override.");
  }
  if (!note) {
    throw new Error("A note is required for an attested override.");
  }

  await prisma.readerAttestedOverride.deleteMany({
    where: {
      userId,
      projectId: input.projectId || null,
      documentKey,
      blockId,
      spanStart: Number.isInteger(input.spanStart) ? input.spanStart : null,
      spanEnd: Number.isInteger(input.spanEnd) ? input.spanEnd : null,
    },
  });

  const created = await prisma.readerAttestedOverride.create({
    data: {
      userId,
      projectId: input.projectId || null,
      documentKey,
      blockId,
      spanStart: Number.isInteger(input.spanStart) ? input.spanStart : null,
      spanEnd: Number.isInteger(input.spanEnd) ? input.spanEnd : null,
      excerptSnapshot: String(input.excerptSnapshot || "").trim(),
      note,
    },
  });

  return normalizeAttestedOverride(created);
}

export async function deleteReaderAttestedOverrideForUser(userId, overrideId = "") {
  const normalizedOverrideId = String(overrideId || "").trim();
  if (!normalizedOverrideId) {
    throw new Error("Override id is required.");
  }

  const removed = await prisma.readerAttestedOverride.deleteMany({
    where: {
      id: normalizedOverrideId,
      userId,
    },
  });

  return {
    removed: Number(removed?.count || 0) > 0,
  };
}
