import { redirect } from "next/navigation";
import RoomWorkspace from "@/components/room/RoomWorkspace";
import { loadRoomWorkspacePageData } from "@/lib/room-server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const view = await loadRoomWorkspacePageData({ searchParams: resolvedSearchParams });

  if (!view) {
    redirect("/");
  }

  return (
    <RoomWorkspace
      initialView={view}
      initialSection={String(resolvedSearchParams?.section || "").trim()}
    />
  );
}
