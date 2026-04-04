import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/components/Providers";
import { METADATA_DESCRIPTION, PRODUCT_NAME } from "@/lib/product-language";
import "@/app/globals.css";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

const editorial = Newsreader({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

function resolveMetadataBase() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://assembledreality.com";

  try {
    return new URL(raw);
  } catch {
    return new URL("https://assembledreality.com");
  }
}

const metadataBase = resolveMetadataBase();
const ogImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${PRODUCT_NAME} share card`,
};

export const metadata = {
  metadataBase,
  title: {
    default: PRODUCT_NAME,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: METADATA_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: PRODUCT_NAME,
    description: METADATA_DESCRIPTION,
    url: metadataBase,
    siteName: PRODUCT_NAME,
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: PRODUCT_NAME,
    description: METADATA_DESCRIPTION,
    images: [ogImage.url],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${mono.variable} ${editorial.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
