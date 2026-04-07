import IntroLanding from "@/components/IntroLanding";
import { appEnv } from "@/lib/env";
import { getOptionalSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

export default async function IntroPage() {
  const session = await getOptionalSession();

  return (
    <IntroLanding
      authCapabilities={{
        appleEnabled: appEnv.apple.enabled,
        magicLinksEnabled: appEnv.magicLinksEnabled,
      }}
      signedIn={Boolean(session?.user?.id)}
      forceIntro
    />
  );
}
