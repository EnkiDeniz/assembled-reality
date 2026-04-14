import IntroLanding from "@/components/IntroLanding";
import { getBetaGateState } from "@/lib/beta-access";
import { appEnv } from "@/lib/env";
import { getOptionalSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

function normalizeAuthError(searchParams = {}) {
  return String(searchParams?.error || "").trim();
}

export default async function IntroPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const betaAccess = await getBetaGateState();
  const session = await getOptionalSession();

  return (
    <IntroLanding
      authCapabilities={{
        appleEnabled: appEnv.apple.enabled,
        magicLinksEnabled: appEnv.magicLinksEnabled,
      }}
      authError={normalizeAuthError(resolvedSearchParams)}
      betaAccess={betaAccess}
      signedIn={Boolean(session?.user?.id)}
      forceIntro
    />
  );
}
