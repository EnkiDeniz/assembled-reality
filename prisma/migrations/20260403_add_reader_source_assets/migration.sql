CREATE TYPE "ReaderSourceAssetKind" AS ENUM ('IMAGE', 'LINK', 'AUDIO');

CREATE TABLE "ReaderSourceAsset" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "projectKey" TEXT,
  "kind" "ReaderSourceAssetKind" NOT NULL DEFAULT 'IMAGE',
  "blobUrl" TEXT,
  "blobPath" TEXT,
  "sourceUrl" TEXT,
  "canonicalUrl" TEXT,
  "label" TEXT,
  "mimeType" TEXT,
  "originalFilename" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "durationMs" INTEGER,
  "byteSize" INTEGER,
  "sha256" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReaderSourceAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReaderSourceAsset_userId_documentKey_kind_key"
  ON "ReaderSourceAsset"("userId", "documentKey", "kind");

CREATE INDEX "ReaderSourceAsset_documentKey_idx"
  ON "ReaderSourceAsset"("documentKey");

CREATE INDEX "ReaderSourceAsset_userId_createdAt_idx"
  ON "ReaderSourceAsset"("userId", "createdAt");

ALTER TABLE "ReaderSourceAsset"
  ADD CONSTRAINT "ReaderSourceAsset_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderSourceAsset"
  ADD CONSTRAINT "ReaderSourceAsset_documentKey_fkey"
  FOREIGN KEY ("documentKey") REFERENCES "ReaderDocument"("documentKey") ON DELETE CASCADE ON UPDATE CASCADE;
