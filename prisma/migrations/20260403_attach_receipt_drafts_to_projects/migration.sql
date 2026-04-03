ALTER TABLE "ReadingReceiptDraft"
ADD COLUMN "projectId" TEXT;

CREATE INDEX "ReadingReceiptDraft_projectId_createdAt_idx"
ON "ReadingReceiptDraft"("projectId", "createdAt");

ALTER TABLE "ReadingReceiptDraft"
ADD CONSTRAINT "ReadingReceiptDraft_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "ReaderProject"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
