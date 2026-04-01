CREATE TYPE "ReceiptStance" AS ENUM ('TENTATIVE', 'WORKING', 'CONFIDENT');
CREATE TYPE "ConversationMessageRole" AS ENUM ('USER', 'ASSISTANT');
CREATE TYPE "EvidenceOrigin" AS ENUM ('READER', 'SEVEN');
CREATE TYPE "EvidenceSourceType" AS ENUM ('PASSAGE', 'HIGHLIGHT', 'NOTE', 'CITATION');

CREATE TABLE "ReaderConversationThread" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readerProfileId" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReaderConversationThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReaderConversationMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "role" "ConversationMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "citations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReaderConversationMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReaderEvidenceSet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readerProfileId" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReaderEvidenceSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReaderEvidenceItem" (
  "id" TEXT NOT NULL,
  "evidenceSetId" TEXT NOT NULL,
  "origin" "EvidenceOrigin" NOT NULL,
  "sourceType" "EvidenceSourceType" NOT NULL,
  "sectionSlug" TEXT NOT NULL,
  "sectionTitle" TEXT NOT NULL,
  "blockId" TEXT,
  "startOffset" INTEGER,
  "endOffset" INTEGER,
  "quote" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "noteText" TEXT,
  "sourceMarkId" TEXT,
  "sourceMessageId" TEXT,
  "sourceCitationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReaderEvidenceItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReadingReceiptDraft"
  ADD COLUMN "documentKey" TEXT NOT NULL DEFAULT 'assembled-reality-v07-final',
  ADD COLUMN "conversationThreadId" TEXT,
  ADD COLUMN "interpretation" TEXT,
  ADD COLUMN "implications" TEXT,
  ADD COLUMN "stance" "ReceiptStance" NOT NULL DEFAULT 'TENTATIVE',
  ADD COLUMN "linkedEvidenceItemIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "linkedMessageIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX "ReaderConversationThread_readerProfileId_documentKey_key"
  ON "ReaderConversationThread"("readerProfileId", "documentKey");

CREATE INDEX "ReaderConversationThread_userId_documentKey_idx"
  ON "ReaderConversationThread"("userId", "documentKey");

CREATE INDEX "ReaderConversationMessage_threadId_createdAt_idx"
  ON "ReaderConversationMessage"("threadId", "createdAt");

CREATE UNIQUE INDEX "ReaderEvidenceSet_readerProfileId_documentKey_key"
  ON "ReaderEvidenceSet"("readerProfileId", "documentKey");

CREATE INDEX "ReaderEvidenceSet_userId_documentKey_idx"
  ON "ReaderEvidenceSet"("userId", "documentKey");

CREATE INDEX "ReaderEvidenceItem_evidenceSetId_createdAt_idx"
  ON "ReaderEvidenceItem"("evidenceSetId", "createdAt");

CREATE INDEX "ReaderEvidenceItem_sourceMarkId_idx"
  ON "ReaderEvidenceItem"("sourceMarkId");

CREATE INDEX "ReaderEvidenceItem_sourceMessageId_idx"
  ON "ReaderEvidenceItem"("sourceMessageId");

CREATE INDEX "ReadingReceiptDraft_documentKey_createdAt_idx"
  ON "ReadingReceiptDraft"("documentKey", "createdAt");

CREATE INDEX "ReadingReceiptDraft_conversationThreadId_idx"
  ON "ReadingReceiptDraft"("conversationThreadId");

ALTER TABLE "ReaderConversationThread"
  ADD CONSTRAINT "ReaderConversationThread_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderConversationThread"
  ADD CONSTRAINT "ReaderConversationThread_readerProfileId_fkey"
  FOREIGN KEY ("readerProfileId") REFERENCES "ReaderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderConversationMessage"
  ADD CONSTRAINT "ReaderConversationMessage_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "ReaderConversationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderEvidenceSet"
  ADD CONSTRAINT "ReaderEvidenceSet_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderEvidenceSet"
  ADD CONSTRAINT "ReaderEvidenceSet_readerProfileId_fkey"
  FOREIGN KEY ("readerProfileId") REFERENCES "ReaderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderEvidenceItem"
  ADD CONSTRAINT "ReaderEvidenceItem_evidenceSetId_fkey"
  FOREIGN KEY ("evidenceSetId") REFERENCES "ReaderEvidenceSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderEvidenceItem"
  ADD CONSTRAINT "ReaderEvidenceItem_sourceMessageId_fkey"
  FOREIGN KEY ("sourceMessageId") REFERENCES "ReaderConversationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReadingReceiptDraft"
  ADD CONSTRAINT "ReadingReceiptDraft_conversationThreadId_fkey"
  FOREIGN KEY ("conversationThreadId") REFERENCES "ReaderConversationThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
