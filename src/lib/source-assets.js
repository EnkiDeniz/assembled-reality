import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getReaderSourceAssetModel(db = prisma) {
  return db.readerSourceAsset || null;
}

function isMissingSourceAssetTableError(error) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

export function serializeReaderSourceAsset(asset) {
  if (!asset) return null;

  const resolvedUrl = asset.blobUrl || asset.canonicalUrl || asset.sourceUrl || null;

  return {
    id: asset.id,
    documentKey: asset.documentKey,
    projectKey: asset.projectKey || null,
    kind: String(asset.kind || "IMAGE").trim().toLowerCase(),
    blobUrl: asset.blobUrl || null,
    blobPath: asset.blobPath || null,
    sourceUrl: asset.sourceUrl || null,
    canonicalUrl: asset.canonicalUrl || null,
    label: asset.label || null,
    mimeType: asset.mimeType || null,
    originalFilename: asset.originalFilename || null,
    width: Number.isFinite(asset.width) ? asset.width : null,
    height: Number.isFinite(asset.height) ? asset.height : null,
    durationMs: Number.isFinite(asset.durationMs) ? asset.durationMs : null,
    byteSize: Number.isFinite(asset.byteSize) ? asset.byteSize : null,
    sha256: asset.sha256 || null,
    metadata: asset.metadataJson || null,
    createdAt: asset.createdAt?.toISOString?.() || null,
    updatedAt: asset.updatedAt?.toISOString?.() || null,
    url: resolvedUrl,
  };
}

export async function listReaderSourceAssetsByDocumentKeysForUser(
  userId,
  documentKeys = [],
  db = prisma,
) {
  const readerSourceAssetModel = getReaderSourceAssetModel(db);
  if (!readerSourceAssetModel || !userId) {
    return new Map();
  }

  const keys = [...new Set((Array.isArray(documentKeys) ? documentKeys : []).filter(Boolean))];
  if (!keys.length) {
    return new Map();
  }

  try {
    const assets = await readerSourceAssetModel.findMany({
      where: {
        userId,
        documentKey: {
          in: keys,
        },
      },
      orderBy: [{ createdAt: "asc" }, { updatedAt: "asc" }],
    });

    return assets.reduce((map, asset) => {
      const serialized = serializeReaderSourceAsset(asset);
      if (!serialized) return map;
      const existing = map.get(asset.documentKey) || [];
      map.set(asset.documentKey, [...existing, serialized]);
      return map;
    }, new Map());
  } catch (error) {
    if (isMissingSourceAssetTableError(error)) {
      return new Map();
    }

    throw error;
  }
}

export async function listReaderSourceAssetsForDocumentForUser(
  userId,
  documentKey,
  db = prisma,
) {
  const assetsByDocumentKey = await listReaderSourceAssetsByDocumentKeysForUser(
    userId,
    [documentKey],
    db,
  );

  return assetsByDocumentKey.get(documentKey) || [];
}

export async function createReaderSourceAssetForUser(
  userId,
  asset,
  db = prisma,
) {
  const readerSourceAssetModel = getReaderSourceAssetModel(db);
  if (!readerSourceAssetModel) {
    throw new Error("Source asset storage is unavailable.");
  }

  try {
    const created = await readerSourceAssetModel.create({
      data: {
        id: asset.id,
        userId,
        documentKey: asset.documentKey,
        projectKey: asset.projectKey || null,
        kind: String(asset.kind || "IMAGE").trim().toUpperCase(),
        blobUrl: asset.blobUrl || null,
        blobPath: asset.blobPath || null,
        sourceUrl: asset.sourceUrl || null,
        canonicalUrl: asset.canonicalUrl || null,
        label: asset.label || null,
        mimeType: asset.mimeType || null,
        originalFilename: asset.originalFilename || null,
        width: Number.isFinite(asset.width) ? asset.width : null,
        height: Number.isFinite(asset.height) ? asset.height : null,
        durationMs: Number.isFinite(Number(asset.durationMs))
          ? Number(asset.durationMs)
          : null,
        byteSize: Number.isFinite(Number(asset.byteSize))
          ? Number(asset.byteSize)
          : null,
        sha256: asset.sha256 || null,
        metadataJson: asset.metadataJson || null,
      },
    });

    return serializeReaderSourceAsset(created);
  } catch (error) {
    if (isMissingSourceAssetTableError(error)) {
      throw new Error("Source asset storage is unavailable until the latest database migration is applied.");
    }

    throw error;
  }
}
