export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/['".,]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildExcerpt(text, limit = 140) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1).trimEnd()}…`;
}
