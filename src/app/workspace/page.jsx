import { headers } from "next/headers";
import { redirect } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { loadWorkspacePageData } from "@/lib/workspace-page-data";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const useLegacyShell = String(resolvedSearchParams?.legacy || "").trim() === "1";
  if (!useLegacyShell) {
    const nextSearch = new URLSearchParams();
    Object.entries(resolvedSearchParams || {}).forEach(([key, value]) => {
      const normalized = String(value || "").trim();
      if (!normalized) return;
      nextSearch.set(key, normalized);
    });
    const query = nextSearch.toString();
    redirect(query ? `/workspace/phase1?${query}` : "/workspace/phase1");
  }

  const headerStore = await headers();
  const workspaceData = await loadWorkspacePageData({
    searchParams,
    headerStore,
  });
  return (
    <WorkspaceShell
      {...workspaceData}
    />
  );
}
