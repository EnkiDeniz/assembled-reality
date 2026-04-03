CREATE TYPE "ReaderVoiceProvider" AS ENUM ('OPENAI', 'ELEVENLABS', 'DEVICE');

CREATE TYPE "ReaderPlaybackScope" AS ENUM ('FLOW', 'SECTION', 'SELECTION', 'MESSAGE');

CREATE TYPE "ListeningSessionStatus" AS ENUM ('IDLE', 'ACTIVE', 'PAUSED');

ALTER TABLE "ReaderProfile"
  ADD COLUMN "preferredVoiceProvider" "ReaderVoiceProvider",
  ADD COLUMN "preferredVoiceId" TEXT,
  ADD COLUMN "preferredListeningRate" DOUBLE PRECISION NOT NULL DEFAULT 1;

CREATE TABLE "ReaderListeningSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readerProfileId" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "mode" "ReaderPlaybackScope" NOT NULL DEFAULT 'FLOW',
  "scopeStartNodeId" TEXT,
  "scopeEndNodeId" TEXT,
  "activeNodeId" TEXT,
  "activeSectionSlug" TEXT,
  "nodeOffsetMs" INTEGER NOT NULL DEFAULT 0,
  "rate" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "provider" "ReaderVoiceProvider",
  "voiceId" TEXT,
  "status" "ListeningSessionStatus" NOT NULL DEFAULT 'IDLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReaderListeningSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReaderListeningSession_readerProfileId_documentKey_key"
  ON "ReaderListeningSession"("readerProfileId", "documentKey");

CREATE INDEX "ReaderListeningSession_userId_documentKey_idx"
  ON "ReaderListeningSession"("userId", "documentKey");

ALTER TABLE "ReaderListeningSession"
  ADD CONSTRAINT "ReaderListeningSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReaderListeningSession"
  ADD CONSTRAINT "ReaderListeningSession_readerProfileId_fkey"
  FOREIGN KEY ("readerProfileId") REFERENCES "ReaderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
