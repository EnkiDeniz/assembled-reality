import PublicDocumentPage from "@/components/PublicDocumentPage";
import { buildPublicPageMetadata, buildSimplePageStructuredData } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";

export const metadata = buildPublicPageMetadata(publicPages.disclaimer);

export default function DisclaimerPage() {
  return (
    <PublicDocumentPage
      page={publicPages.disclaimer}
      jsonLd={buildSimplePageStructuredData(publicPages.disclaimer)}
    />
  );
}
