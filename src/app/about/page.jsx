import PublicDocumentPage from "@/components/PublicDocumentPage";
import { buildAboutStructuredData, buildPublicPageMetadata } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";

export const metadata = buildPublicPageMetadata(publicPages.about);

export default function AboutPage() {
  return <PublicDocumentPage page={publicPages.about} jsonLd={buildAboutStructuredData()} />;
}
