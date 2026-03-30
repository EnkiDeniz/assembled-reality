import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listReadingReceiptDraftsForUser, loadReaderPageData } from "@/lib/reader-db";
import AccountScreen from "@/components/AccountScreen";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const [readerData, drafts] = await Promise.all([
    loadReaderPageData(session.user.id),
    listReadingReceiptDraftsForUser(session.user.id),
  ]);

  return (
    <AccountScreen
      initialProfile={readerData?.profile || null}
      email={session.user.email || ""}
      connectionStatus={readerData?.getReceiptsConnection?.status?.toLowerCase() || "disconnected"}
      drafts={drafts}
    />
  );
}
