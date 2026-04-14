import { prisma } from "@/lib/prisma";
import { normalizeBetaEmail, normalizeBetaText } from "@/lib/beta-access-core";

export const BETA_ADMISSION_OUTCOMES = {
  deniedAllowlist: "DENIED_ALLOWLIST",
};

export const BETA_ADMISSION_REASON_CODES = {
  emailNotAllowed: "email_not_allowed",
};

function normalizeProvider(value = "") {
  return normalizeBetaText(value).toLowerCase() || "unknown";
}

export async function recordDeniedBetaAdmissionAttempt({
  provider = "",
  candidateEmail = "",
  reasonCode = BETA_ADMISSION_REASON_CODES.emailNotAllowed,
} = {}) {
  const rawCandidateEmail = normalizeBetaText(candidateEmail);
  const normalizedEmail = normalizeBetaEmail(candidateEmail);

  if (!rawCandidateEmail || !normalizedEmail) {
    return null;
  }

  try {
    return await prisma.betaAdmissionAttempt.create({
      data: {
        provider: normalizeProvider(provider),
        candidateEmail: rawCandidateEmail,
        normalizedEmail,
        outcome: BETA_ADMISSION_OUTCOMES.deniedAllowlist,
        reasonCode: normalizeBetaText(reasonCode) || BETA_ADMISSION_REASON_CODES.emailNotAllowed,
      },
    });
  } catch (error) {
    console.error("[beta-admission] Failed to record denied admission attempt.", {
      provider: normalizeProvider(provider),
      candidateEmail: normalizedEmail,
      reasonCode: normalizeBetaText(reasonCode) || BETA_ADMISSION_REASON_CODES.emailNotAllowed,
      error,
    });
    return null;
  }
}
