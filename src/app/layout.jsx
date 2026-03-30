import { Inter, Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import "@/app/globals.css";

const uiFont = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  weight: ["400", "500", "600"],
});

const displayFont = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const cuneiformFont = localFont({
  src: "../../public/fonts/NotoSansCuneiform-Regular.woff2",
  variable: "--font-cuneiform",
  display: "block",
});

export const metadata = {
  title: "Assembled Reality",
  description: "Private reading instrument for Assembled Reality.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${uiFont.variable} ${displayFont.variable} ${cuneiformFont.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
