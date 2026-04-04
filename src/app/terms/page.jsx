import PublicDocumentPage from "@/components/PublicDocumentPage";
import { buildPublicPageMetadata, buildSimplePageStructuredData } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";

export const metadata = buildPublicPageMetadata(publicPages.terms);

export default function TermsPage() {
  return (
    <PublicDocumentPage
      page={publicPages.terms}
      jsonLd={buildSimplePageStructuredData(publicPages.terms)}
    />
  );
}
