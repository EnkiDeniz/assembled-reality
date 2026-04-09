/**
 * Feature flags from environment. Defaults keep v0.1 behavior unless opt-in,
 * except v0.1 fidelity extras (matchBasis, nearMiss, derived confidence) which default on.
 */
function envOn(value, defaultValue = false) {
  if (value === undefined || value === "") return defaultValue;
  return /^(1|true|on|yes)$/i.test(String(value).trim());
}

export function loadFeatureFlagsFromEnv() {
  return {
    enableV01Fidelity: envOn(process.env.SHAPELIBRARY_ENABLE_V01_FIDELITY, true),
    enableMyth: envOn(process.env.SHAPELIBRARY_ENABLE_MYTH, false),
    enableKernel: envOn(process.env.SHAPELIBRARY_ENABLE_KERNEL, false),
    enableCrossDomain: envOn(process.env.SHAPELIBRARY_ENABLE_CROSS_DOMAIN, false),
  };
}
