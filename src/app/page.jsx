import { redirect } from "next/navigation";
import IntroLanding from "@/components/IntroLanding";
import { appEnv } from "@/lib/env";
import { buildHomeStructuredData, buildPublicPageMetadata } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";
import { getOptionalSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";
export const metadata = buildPublicPageMetadata(publicPages.home);

export default async function HomePage() {
  const session = await getOptionalSession();
  if (session?.user?.id) {
    redirect("/workspace");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildHomeStructuredData()) }}
      />
      <IntroLanding
        authCapabilities={{
          appleEnabled: appEnv.apple.enabled,
          magicLinksEnabled: appEnv.magicLinksEnabled,
        }}
        signedIn={false}
        forceIntro={false}
      />
    </>
  );
}
