import { IBM_Plex_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "@/app/globals.css";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "Document Assembler",
  description: "Terminal-like workspace for reading, assembling, and receipting documents.",
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
