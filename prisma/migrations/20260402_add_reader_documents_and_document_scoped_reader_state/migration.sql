CREATE TYPE "ReaderDocumentFormat" AS ENUM ('MARKDOWN', 'DOC', 'DOCX', 'PDF');

CREATE TABLE "ReaderDocument" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "format" "ReaderDocumentFormat" NOT NULL DEFAULT 'MARKDOWN',
  "mimeType" TEXT,
  "originalFilename" TEXT,
  "contentMarkdown" TEXT NOT NULL,
  "wordCount" INTEGER NOT NULL DEFAULT 0,
  "sectionCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReaderDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Bookmark"
  ADD COLUMN "documentKey" TEXT NOT NULL DEFAULT 'assembled-reality-v07-final';

ALTER TABLE "Highlight"
  ADD COLUMN "documentKey" TEXT NOT NULL DEFAULT 'assembled-reality-v07-final';

ALTER TABLE "Note"
  ADD COLUMN "documentKey" TEXT NOT NULL DEFAULT 'assembled-reality-v07-final';

ALTER TABLE "ReadingProgress"
  ADD COLUMN "documentKey" TEXT NOT NULL DEFAULT 'assembled-reality-v07-final';

DROP INDEX IF EXISTS "Bookmark_readerProfileId_sectionSlug_key";
DROP INDEX IF EXISTS "ReadingProgress_readerProfileId_key";

CREATE UNIQUE INDEX "ReaderDocument_documentKey_key"
  ON "ReaderDocument"("documentKey");

CREATE INDEX "ReaderDocument_userId_updatedAt_idx"
  ON "ReaderDocument"("userId", "updatedAt");

CREATE UNIQUE INDEX "Bookmark_readerProfileId_documentKey_sectionSlug_key"
  ON "Bookmark"("readerProfileId", "documentKey", "sectionSlug");

CREATE INDEX "Bookmark_readerProfileId_documentKey_createdAt_idx"
  ON "Bookmark"("readerProfileId", "documentKey", "createdAt");

CREATE INDEX "Highlight_readerProfileId_documentKey_sectionSlug_idx"
  ON "Highlight"("readerProfileId", "documentKey", "sectionSlug");

CREATE INDEX "Highlight_readerProfileId_documentKey_blockId_idx"
  ON "Highlight"("readerProfileId", "documentKey", "blockId");

CREATE INDEX "Note_readerProfileId_documentKey_sectionSlug_idx"
  ON "Note"("readerProfileId", "documentKey", "sectionSlug");

CREATE INDEX "Note_readerProfileId_documentKey_blockId_idx"
  ON "Note"("readerProfileId", "documentKey", "blockId");

CREATE UNIQUE INDEX "ReadingProgress_readerProfileId_documentKey_key"
  ON "ReadingProgress"("readerProfileId", "documentKey");

CREATE INDEX "ReadingProgress_readerProfileId_updatedAt_idx"
  ON "ReadingProgress"("readerProfileId", "updatedAt");

ALTER TABLE "ReaderDocument"
  ADD CONSTRAINT "ReaderDocument_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
