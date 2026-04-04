import PublicDocumentPage from "@/components/PublicDocumentPage";
import { buildPublicPageMetadata, buildSimplePageStructuredData } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";

export const metadata = buildPublicPageMetadata(publicPages.trust);

export default function TrustPage() {
  return (
    <PublicDocumentPage
      page={publicPages.trust}
      jsonLd={buildSimplePageStructuredData(publicPages.trust)}
    />
  );
}
