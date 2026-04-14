CREATE TYPE "BetaAdmissionOutcome" AS ENUM ('DENIED_ALLOWLIST');

CREATE TABLE "BetaAdmissionAttempt" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "outcome" "BetaAdmissionOutcome" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaAdmissionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BetaAdmissionAttempt_normalizedEmail_createdAt_idx" ON "BetaAdmissionAttempt"("normalizedEmail", "createdAt");
CREATE INDEX "BetaAdmissionAttempt_provider_createdAt_idx" ON "BetaAdmissionAttempt"("provider", "createdAt");
CREATE INDEX "BetaAdmissionAttempt_outcome_createdAt_idx" ON "BetaAdmissionAttempt"("outcome", "createdAt");
