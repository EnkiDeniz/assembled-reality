import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appEnv } from "@/lib/env";

function shouldRedirectHost(currentHost, canonicalHost) {
  if (!currentHost || !canonicalHost) return false;
  if (currentHost === canonicalHost) return false;
  if (process.env.VERCEL_ENV !== "production") return false;
  return currentHost.endsWith(".vercel.app");
}

export async function redirectToCanonicalHost(pathname = "/", searchParams) {
  const canonicalOrigin = appEnv.siteUrl;
  if (!canonicalOrigin) return;

  const canonicalUrl = new URL(canonicalOrigin);
  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";

  if (!shouldRedirectHost(requestHost, canonicalUrl.host)) {
    return;
  }

  const destination = new URL(pathname, canonicalUrl);
  const entries = Object.entries(searchParams || {});

  entries.forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((entry) => destination.searchParams.append(key, entry));
      return;
    }

    if (typeof value === "string" && value.length > 0) {
      destination.searchParams.set(key, value);
    }
  });

  redirect(destination.toString());
}
