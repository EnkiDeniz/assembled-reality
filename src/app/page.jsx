import { redirect } from "next/navigation";
import IntroLanding from "@/components/IntroLanding";
import { getBetaGateState } from "@/lib/beta-access";
import { appEnv } from "@/lib/env";
import { buildHomeStructuredData, buildPublicPageMetadata } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";
import { getOptionalSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";
export const metadata = buildPublicPageMetadata(publicPages.home);

function normalizeAuthError(searchParams = {}) {
  return String(searchParams?.error || "").trim();
}

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const betaAccess = await getBetaGateState();
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
        authError={normalizeAuthError(resolvedSearchParams)}
        betaAccess={betaAccess}
        signedIn={false}
        forceIntro={false}
      />
    </>
  );
}
