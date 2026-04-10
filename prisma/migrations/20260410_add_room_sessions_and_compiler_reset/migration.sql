-- Compiler-first workspace reset marker on reader profiles.
ALTER TABLE "ReaderProfile"
ADD COLUMN "compilerFirstWorkspaceResetAt" TIMESTAMP(3);

-- Explicit Room sessions replace the hidden one-thread-per-project assumption.
CREATE TABLE "ReaderRoomSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "threadDocumentKey" TEXT NOT NULL,
    "title" TEXT,
    "handoffSummary" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderRoomSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReaderRoomSession_sessionKey_key" ON "ReaderRoomSession"("sessionKey");
CREATE UNIQUE INDEX "ReaderRoomSession_threadDocumentKey_key" ON "ReaderRoomSession"("threadDocumentKey");
CREATE INDEX "ReaderRoomSession_userId_projectId_isActive_updatedAt_idx" ON "ReaderRoomSession"("userId", "projectId", "isActive", "updatedAt");
CREATE INDEX "ReaderRoomSession_projectId_isArchived_updatedAt_idx" ON "ReaderRoomSession"("projectId", "isArchived", "updatedAt");

ALTER TABLE "ReaderRoomSession"
ADD CONSTRAINT "ReaderRoomSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderRoomSession"
ADD CONSTRAINT "ReaderRoomSession_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "ReaderProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
