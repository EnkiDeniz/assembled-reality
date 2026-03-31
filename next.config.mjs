import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  typedRoutes: false,
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingIncludes: {
    "/": ["./content/**/*", "./docs/**/*"],
    "/read": ["./content/**/*", "./docs/**/*"],
    "/api/reader/receipts/from-reading": ["./content/**/*", "./docs/**/*"],
  },
};

export default nextConfig;
