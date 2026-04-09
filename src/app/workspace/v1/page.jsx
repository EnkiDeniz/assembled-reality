import { headers } from "next/headers";
import RealityAssemblyShell from "@/components/reality-assembly/RealityAssemblyShell";
import { loadWorkspacePageData } from "@/lib/workspace-page-data";

export const dynamic = "force-dynamic";

export default async function WorkspaceV1Page({ searchParams }) {
  const headerStore = await headers();
  const workspaceData = await loadWorkspacePageData({
    searchParams,
    headerStore,
  });

  return <RealityAssemblyShell {...workspaceData} />;
}
