import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/components/Providers";
import { metadataBase } from "@/lib/public-metadata";
import { publicPages } from "@/lib/public-site";
import { PRODUCT_NAME } from "@/lib/product-language";
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
  description: publicPages.home.description,
  openGraph: {
    title: PRODUCT_NAME,
    description: publicPages.home.description,
    url: metadataBase,
    siteName: PRODUCT_NAME,
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: PRODUCT_NAME,
    description: publicPages.home.description,
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
    googleBot: {
      index: false,
      follow: false,
      "max-image-preview": "none",
      "max-snippet": 0,
      "max-video-preview": 0,
    },
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
