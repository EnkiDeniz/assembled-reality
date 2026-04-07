import { redirect } from "next/navigation";
import AccountShell from "@/components/AccountShell";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import {
  listReadingReceiptDraftsForUser,
  getReaderProfileByUserId,
} from "@/lib/reader-db";
import { getRequiredSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

function resolveAccountNotice(searchParams = {}) {
  const connected = String(searchParams?.connected || "").trim().toLowerCase();
  const error = String(searchParams?.error || "").trim();

  if (connected === "getreceipts") {
    return {
      tone: "success",
      message: "GetReceipts connected. New receipt drafts can now be pushed from the workspace.",
    };
  }

  if (!error) {
    return {
      tone: "",
      message: "",
    };
  }

  if (error === "getreceipts-config") {
    return {
      tone: "error",
      message: "GetReceipts is not configured yet. Add the integration settings and try again.",
    };
  }

  if (error === "getreceipts-state") {
    return {
      tone: "error",
      message: "The GetReceipts connection could not be verified. Try connecting again.",
    };
  }

  return {
    tone: "error",
    message: error,
  };
}

export default async function AccountPage({ searchParams }) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const [readerData, drafts, documents] = await Promise.all([
    getReaderProfileByUserId(session.user.id),
    listReadingReceiptDraftsForUser(session.user.id),
    listReaderDocumentsForUser(session.user.id),
  ]);
  const notice = resolveAccountNotice(resolvedSearchParams || {});

  return (
    <AccountShell
      profile={readerData?.profile || null}
      email={session.user.email || ""}
      connectionStatus={readerData?.getReceiptsConnection?.status || "DISCONNECTED"}
      drafts={drafts}
      documentCount={documents.length}
      notice={notice.message}
      noticeTone={notice.tone}
    />
  );
}
