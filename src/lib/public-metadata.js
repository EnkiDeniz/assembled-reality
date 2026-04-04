import { publicPageOrder, publicPages, publicSite } from "@/lib/public-site";

export function resolveMetadataBase() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://loegos.com";

  try {
    return new URL(raw);
  } catch {
    return new URL("https://loegos.com");
  }
}

export const metadataBase = resolveMetadataBase();

export function siteUrl(pathname = "/") {
  return new URL(pathname, metadataBase).toString();
}

const ogImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${publicSite.name} share card`,
};

export function buildPublicPageMetadata(page) {
  const path = page?.path || "/";
  const title = page?.metaTitle || publicSite.name;
  const description = page?.description || publicPages.home.description;
  const url = siteUrl(path);

  return {
    title: {
      absolute: title,
    },
    description,
    keywords: publicSite.keywords,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: publicSite.name,
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

function anchor(id) {
  return `${siteUrl("/")}${id.startsWith("#") ? id : `#${id}`}`;
}

export function buildOrganizationNode() {
  return {
    "@type": "Organization",
    "@id": anchor("organization"),
    name: publicSite.company.legalName,
    brand: publicSite.mark,
    url: siteUrl("/"),
    founder: {
      "@id": anchor("founder"),
    },
  };
}

export function buildFounderNode() {
  return {
    "@type": "Person",
    "@id": anchor("founder"),
    name: publicSite.company.founder.name,
    jobTitle: publicSite.company.founder.title,
    worksFor: {
      "@id": anchor("organization"),
    },
  };
}

export function buildWebsiteNode() {
  return {
    "@type": "WebSite",
    "@id": anchor("website"),
    url: siteUrl("/"),
    name: publicSite.name,
    description: publicPages.home.description,
    publisher: {
      "@id": anchor("organization"),
    },
  };
}

export function buildWebPageNode(page, type = "WebPage") {
  return {
    "@type": type,
    "@id": `${siteUrl(page.path)}#webpage`,
    url: siteUrl(page.path),
    name: page.metaTitle || page.title,
    description: page.description,
    isPartOf: {
      "@id": anchor("website"),
    },
    about: {
      "@id": anchor("organization"),
    },
  };
}

export function buildSoftwareApplicationNode() {
  return {
    "@type": "SoftwareApplication",
    "@id": anchor("application"),
    name: publicSite.name,
    alternateName: publicSite.mark,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: publicPages.home.description,
    url: siteUrl("/"),
    publisher: {
      "@id": anchor("organization"),
    },
    featureList: [
      ...publicSite.supportedInputs,
      ...publicSite.operateOutputs,
    ],
  };
}

export function buildHomeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildFounderNode(),
      buildOrganizationNode(),
      buildWebsiteNode(),
      buildWebPageNode(publicPages.home),
      buildSoftwareApplicationNode(),
    ],
  };
}

export function buildAboutStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildFounderNode(),
      buildOrganizationNode(),
      buildWebPageNode(publicPages.about, "AboutPage"),
      buildSoftwareApplicationNode(),
    ],
  };
}

export function buildSimplePageStructuredData(page) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationNode(),
      buildWebPageNode(page),
    ],
  };
}

export function buildSitemapEntries() {
  const lastModified = new Date();
  return publicPageOrder.map((page, index) => ({
    url: siteUrl(page.path),
    lastModified,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.6,
  }));
}
