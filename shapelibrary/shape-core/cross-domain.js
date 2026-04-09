/**
 * Cross-domain convergence from IR.crossDomainMap (or heuristic when flag on without map).
 */
export function runCrossDomainPass(ir, features) {
  if (!features?.enableCrossDomain) return null;

  const map = ir.crossDomainMap;
  const domains = Array.isArray(map?.domains) ? map.domains.map(String) : [];
  const domainCoverageCount = domains.length;
  let convergenceScore =
    typeof map?.consistencyScore === "number" && !Number.isNaN(map.consistencyScore)
      ? Math.min(1, Math.max(0, map.consistencyScore))
      : Math.min(1, domainCoverageCount * 0.22);
  const crossDomainPass = domainCoverageCount >= 2 || convergenceScore >= 0.5;

  return {
    convergenceScore,
    domainCoverageCount,
    crossDomainPass,
    domains,
    functionalClass: map?.functionalClass != null ? String(map.functionalClass) : undefined,
  };
}
