import PublicDocumentPage from "@/components/PublicDocumentPage";
import { buildPublicPageMetadata, buildSimplePageStructuredData } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";

export const metadata = buildPublicPageMetadata(publicPages.privacy);

export default function PrivacyPage() {
  return (
    <PublicDocumentPage
      page={publicPages.privacy}
      jsonLd={buildSimplePageStructuredData(publicPages.privacy)}
    />
  );
}
