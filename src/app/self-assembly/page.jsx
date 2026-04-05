import SelfAssemblyPage from "@/components/SelfAssemblyPage";
import { buildPublicPageMetadata, buildSimplePageStructuredData } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";
import { getSelfAssemblyDemo } from "@/lib/self-assembly";

export const metadata = buildPublicPageMetadata(publicPages.selfAssembly);

export default function SelfAssemblyRoute() {
  const demo = getSelfAssemblyDemo();

  return (
    <SelfAssemblyPage
      page={publicPages.selfAssembly}
      demo={demo}
      jsonLd={buildSimplePageStructuredData(publicPages.selfAssembly)}
    />
  );
}
