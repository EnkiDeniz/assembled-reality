import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  typedRoutes: false,
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingIncludes: {
    "/": ["./content/**/*", "./docs/**/*"],
    "/read": ["./content/**/*", "./docs/**/*"],
    "/api/documents": [
      "./node_modules/pdf-parse/**/*",
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/@napi-rs/**/*",
    ],
    "/api/reader/receipts/from-reading": ["./content/**/*", "./docs/**/*"],
  },
};

export default nextConfig;
