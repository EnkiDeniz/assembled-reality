function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildClaimMap(claims = []) {
  return new Map(
    claims
      .filter(Boolean)
      .map((claim) => [normalizeText(claim?.id) || normalizeText(claim?.text), claim])
      .filter(([key]) => key),
  );
}

function summarizeGroundingCount(compilerRead = null) {
  const claims = Array.isArray(compilerRead?.claimSet) ? compilerRead.claimSet : [];
  return claims.filter((claim) => normalizeText(claim?.supportStatus).toLowerCase() === "grounded").length;
}

export function buildCompilerReadDelta(currentRead = null, previousRead = null) {
  if (!currentRead || !previousRead) {
    return null;
  }

  const currentClaims = Array.isArray(currentRead?.claimSet) ? currentRead.claimSet : [];
  const previousClaims = Array.isArray(previousRead?.claimSet) ? previousRead.claimSet : [];
  const currentMap = buildClaimMap(currentClaims);
  const previousMap = buildClaimMap(previousClaims);

  const claimsAdded = Array.from(currentMap.keys()).filter((key) => !previousMap.has(key));
  const claimsRemoved = Array.from(previousMap.keys()).filter((key) => !currentMap.has(key));
  const currentGroundedCount = summarizeGroundingCount(currentRead);
  const previousGroundedCount = summarizeGroundingCount(previousRead);
  const currentRejected = Math.max(0, Number(currentRead?.groundingRejectedClaimCount) || 0);
  const previousRejected = Math.max(0, Number(previousRead?.groundingRejectedClaimCount) || 0);
  const currentFinding = normalizeText(currentRead?.verdict?.primaryFinding);
  const previousFinding = normalizeText(previousRead?.verdict?.primaryFinding);
  const currentNextMove = normalizeText(Array.isArray(currentRead?.nextMoves) ? currentRead.nextMoves[0] : "");
  const previousNextMove = normalizeText(Array.isArray(previousRead?.nextMoves) ? previousRead.nextMoves[0] : "");

  const trajectoryLine =
    currentGroundedCount !== previousGroundedCount
      ? `Grounded claim count ${currentGroundedCount > previousGroundedCount ? "improved" : "fell"} from ${previousGroundedCount} to ${currentGroundedCount}.`
      : currentRejected !== previousRejected
        ? `Grounding rejection count ${currentRejected < previousRejected ? "fell" : "rose"} from ${previousRejected} to ${currentRejected}.`
        : currentFinding && previousFinding && currentFinding !== previousFinding
          ? "Primary finding changed."
          : currentNextMove && previousNextMove && currentNextMove !== previousNextMove
            ? "Next move changed."
            : "The overall structural read stayed materially similar.";

  return {
    claimsAdded,
    claimsRemoved,
    currentGroundedCount,
    previousGroundedCount,
    currentRejected,
    previousRejected,
    primaryFindingChanged: Boolean(currentFinding && previousFinding && currentFinding !== previousFinding),
    nextMoveChanged: Boolean(currentNextMove && previousNextMove && currentNextMove !== previousNextMove),
    currentFinding,
    previousFinding,
    currentNextMove,
    previousNextMove,
    trajectoryLine,
  };
}
