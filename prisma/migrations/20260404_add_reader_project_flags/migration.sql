ALTER TABLE "ReaderProject"
ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ReaderProject_userId_isArchived_updatedAt_idx"
ON "ReaderProject"("userId", "isArchived", "updatedAt");
