-- CreateTable
CREATE TABLE "ReaderOperateRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "documentKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'overlay',
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "engineKind" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "modelName" TEXT,
    "promptVersion" TEXT,
    "sourceFingerprint" TEXT NOT NULL,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderOperateRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReaderAttestedOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "documentKey" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "spanStart" INTEGER,
    "spanEnd" INTEGER,
    "excerptSnapshot" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderAttestedOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReaderOperateRun_userId_projectId_documentKey_mode_createdAt_idx" ON "ReaderOperateRun"("userId", "projectId", "documentKey", "mode", "createdAt");

-- CreateIndex
CREATE INDEX "ReaderOperateRun_documentKey_createdAt_idx" ON "ReaderOperateRun"("documentKey", "createdAt");

-- CreateIndex
CREATE INDEX "ReaderAttestedOverride_userId_projectId_documentKey_blockId_updatedAt_idx" ON "ReaderAttestedOverride"("userId", "projectId", "documentKey", "blockId", "updatedAt");

-- CreateIndex
CREATE INDEX "ReaderAttestedOverride_documentKey_updatedAt_idx" ON "ReaderAttestedOverride"("documentKey", "updatedAt");

-- AddForeignKey
ALTER TABLE "ReaderOperateRun" ADD CONSTRAINT "ReaderOperateRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReaderOperateRun" ADD CONSTRAINT "ReaderOperateRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ReaderProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReaderAttestedOverride" ADD CONSTRAINT "ReaderAttestedOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReaderAttestedOverride" ADD CONSTRAINT "ReaderAttestedOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ReaderProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
