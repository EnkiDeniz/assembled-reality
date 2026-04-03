import { getServerSession } from "next-auth";
import IntroLanding from "@/components/IntroLanding";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function IntroPage() {
  const session = await getServerSession(authOptions);

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
