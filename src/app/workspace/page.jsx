import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const isLegacyAttempt = String(resolvedSearchParams?.legacy || "").trim() === "1";
  const nextSearch = new URLSearchParams();
  Object.entries(resolvedSearchParams || {}).forEach(([key, value]) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    if (key === "legacy") return;
    nextSearch.set(key, normalized);
  });
  if (isLegacyAttempt) {
    nextSearch.set("deprecated", "legacy-workspace");
  }
  const query = nextSearch.toString();
  redirect(query ? `/workspace/phase1?${query}` : "/workspace/phase1");
}
