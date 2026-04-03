CREATE TYPE "ReaderProjectDocumentRole" AS ENUM ('SOURCE', 'ASSEMBLY');

CREATE TABLE "ReaderProject" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "currentAssemblyDocumentKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReaderProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReaderProjectDocument" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "role" "ReaderProjectDocumentRole" NOT NULL DEFAULT 'SOURCE',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReaderProjectDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReaderProject_userId_projectKey_key"
  ON "ReaderProject"("userId", "projectKey");

CREATE INDEX "ReaderProject_userId_updatedAt_idx"
  ON "ReaderProject"("userId", "updatedAt");

CREATE UNIQUE INDEX "ReaderProjectDocument_projectId_documentKey_key"
  ON "ReaderProjectDocument"("projectId", "documentKey");

CREATE INDEX "ReaderProjectDocument_projectId_role_position_idx"
  ON "ReaderProjectDocument"("projectId", "role", "position");

CREATE INDEX "ReaderProjectDocument_documentKey_idx"
  ON "ReaderProjectDocument"("documentKey");

ALTER TABLE "ReaderProject"
  ADD CONSTRAINT "ReaderProject_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderProjectDocument"
  ADD CONSTRAINT "ReaderProjectDocument_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "ReaderProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
