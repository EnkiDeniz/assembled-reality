/** @type {import("next").NextConfig} */
const nextConfig = {
  typedRoutes: false,
  outputFileTracingIncludes: {
    "/": ["./content/**/*", "./docs/**/*"],
    "/read": ["./content/**/*", "./docs/**/*"],
    "/api/reader/receipts/from-reading": ["./content/**/*", "./docs/**/*"],
  },
};

export default nextConfig;
