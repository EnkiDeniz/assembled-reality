import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountShell from "@/components/AccountShell";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import {
  listReadingReceiptDraftsForUser,
  getReaderProfileByUserId,
} from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const [readerData, drafts, documents] = await Promise.all([
    getReaderProfileByUserId(session.user.id),
    listReadingReceiptDraftsForUser(session.user.id),
    listReaderDocumentsForUser(session.user.id),
  ]);

  return (
    <AccountShell
      profile={readerData?.profile || null}
      email={session.user.email || ""}
      connectionStatus={readerData?.getReceiptsConnection?.status || "DISCONNECTED"}
      drafts={drafts}
      documentCount={documents.length}
    />
  );
}
