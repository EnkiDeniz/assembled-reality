import "server-only";

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import {
  ingestHtmlSource,
  ingestPlainTextSource,
} from "@/lib/document-import";

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127(?:\.\d{1,3}){3}$/,
  /^10(?:\.\d{1,3}){3}$/,
  /^192\.168(?:\.\d{1,3}){2}$/,
  /^172\.(1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/,
  /^\[?::1\]?$/i,
];

function createLinkIntakeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createIntakeDiagnostic(code, severity, message) {
  return {
    code: String(code || "info").trim() || "info",
    severity:
      severity === "warning" || severity === "error" ? severity : "info",
    message: String(message || "").trim(),
  };
}

function isPrivateHost(hostname = "") {
  const normalized = String(hostname || "").trim().toLowerCase();
  if (!normalized) return true;
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
}

function normalizeLinkTitle(value = "", fallback = "Linked source") {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return fallback;
  if (normalized.length <= 90) return normalized;
  return `${normalized.slice(0, 87).trimEnd()}...`;
}

function titleFromUrl(url) {
  const pathname = String(url?.pathname || "").trim();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || url?.hostname || "";
  return normalizeLinkTitle(
    decodeURIComponent(lastSegment)
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_]+/g, " "),
    url?.hostname || "Linked source",
  );
}

export function normalizePublicHttpUrl(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw createLinkIntakeError("link_missing", "Paste a public link to create a source.");
  }

  let url;

  try {
    url = new URL(normalized);
  } catch {
    throw createLinkIntakeError("link_invalid", "Paste a valid public HTTP or HTTPS link.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw createLinkIntakeError("link_invalid", "Only HTTP and HTTPS links are supported.");
  }

  if (url.username || url.password) {
    throw createLinkIntakeError("link_invalid", "Links with embedded credentials are not supported.");
  }

  if (isPrivateHost(url.hostname)) {
    throw createLinkIntakeError("link_private", "Paste a public link, not a local or private address.");
  }

  return url;
}

function getCanonicalUrl(document, fallbackUrl) {
  const explicit =
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
    document.querySelector('meta[property="og:url"]')?.getAttribute("content") ||
    "";

  if (!explicit) {
    return fallbackUrl;
  }

  try {
    return new URL(explicit, fallbackUrl).toString();
  } catch {
    return fallbackUrl;
  }
}

export async function deriveSourceFromLink(urlValue) {
  const parsedUrl = normalizePublicHttpUrl(urlValue);

  let response;
  try {
    response = await fetch(parsedUrl.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "text/html, text/plain, text/markdown;q=0.9, */*;q=0.1",
        "User-Agent": "AssembledRealityBot/1.0 (+https://assembledreality.com)",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw createLinkIntakeError(
      "link_fetch_failed",
      "Could not fetch this link right now. Check that it is public and try again.",
    );
  }

  if (!response.ok) {
    throw createLinkIntakeError(
      "link_unreadable",
      response.status === 401 || response.status === 403
        ? "This link is protected or requires a login."
        : `Could not read this link (${response.status}).`,
    );
  }

  const finalUrl = normalizePublicHttpUrl(response.url || parsedUrl.toString());
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const bodyText = await response.text();

  if (!bodyText.trim()) {
    throw createLinkIntakeError(
      "link_empty",
      "This link did not contain readable content.",
    );
  }

  if (contentType.includes("html") || /<html[\s>]|<body[\s>]|<article[\s>]/i.test(bodyText)) {
    const dom = new JSDOM(bodyText, { url: finalUrl.toString() });
    const document = dom.window.document;
    const readability = new Readability(document);
    const article = readability.parse();
    const extractedHtml = String(article?.content || "").trim();
    const extractedText = String(article?.textContent || "").replace(/\s+/g, " ").trim();

    if (!extractedHtml || extractedText.length < 80) {
      throw createLinkIntakeError(
        "link_unreadable",
        "This page could not be turned into a clean source. It may be app-gated, script-rendered, or mostly boilerplate.",
      );
    }

    const canonicalUrl = getCanonicalUrl(document, finalUrl.toString());
    const title = normalizeLinkTitle(
      article?.title || document.title || titleFromUrl(finalUrl),
      titleFromUrl(finalUrl),
    );
    const imported = await ingestHtmlSource({
      html: extractedHtml,
      titleHint: title,
      fallbackTitle: titleFromUrl(finalUrl),
    });

    return {
      ...imported,
      sourceAsset: {
        kind: "LINK",
        sourceUrl: parsedUrl.toString(),
        canonicalUrl,
        label: title,
        metadataJson: {
          host: finalUrl.hostname,
          pathname: finalUrl.pathname,
          fetchedUrl: finalUrl.toString(),
          contentType,
        },
      },
      diagnostics: [
        createIntakeDiagnostic(
          "link_source",
          "info",
          `Created source from ${finalUrl.hostname}.`,
        ),
        ...(imported.diagnostics || []),
      ],
      derivationKind: "link-document",
      derivationStatus: "succeeded",
      derivationModel: "",
      sourceUrl: parsedUrl.toString(),
      canonicalUrl,
      displayDomain: finalUrl.hostname,
    };
  }

  if (
    contentType.startsWith("text/") ||
    contentType.includes("markdown") ||
    contentType.includes("json")
  ) {
    const imported = ingestPlainTextSource({
      text: bodyText,
      titleHint: titleFromUrl(finalUrl),
      fallbackTitle: titleFromUrl(finalUrl),
    });

    return {
      ...imported,
      sourceAsset: {
        kind: "LINK",
        sourceUrl: parsedUrl.toString(),
        canonicalUrl: finalUrl.toString(),
        label: imported.title || titleFromUrl(finalUrl),
        metadataJson: {
          host: finalUrl.hostname,
          pathname: finalUrl.pathname,
          fetchedUrl: finalUrl.toString(),
          contentType,
        },
      },
      diagnostics: [
        createIntakeDiagnostic(
          "link_source",
          "info",
          `Created source from ${finalUrl.hostname}.`,
        ),
        ...(imported.diagnostics || []),
      ],
      derivationKind: "link-document",
      derivationStatus: "succeeded",
      derivationModel: "",
      sourceUrl: parsedUrl.toString(),
      canonicalUrl: finalUrl.toString(),
      displayDomain: finalUrl.hostname,
    };
  }

  throw createLinkIntakeError(
    "link_unsupported",
    "This link did not return readable page content.",
  );
}
