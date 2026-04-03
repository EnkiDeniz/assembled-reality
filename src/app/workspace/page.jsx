import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { authOptions } from "@/lib/auth";
import { buildDocumentBlocks } from "@/lib/document-blocks";
import { appEnv } from "@/lib/env";
import { getReaderDocumentDataForUser, listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getReaderProfileByUserId } from "@/lib/reader-db";
import { loadReaderWorkspaceForUser } from "@/lib/reader-workspace";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const requestedDocumentKey = String(resolvedSearchParams?.document || "").trim();

  const [documents, readerData] = await Promise.all([
    listReaderDocumentsForUser(session.user.id),
    getReaderProfileByUserId(session.user.id),
  ]);

  const fallbackDocumentKey = requestedDocumentKey || documents[0]?.documentKey || "";
  const documentData = await getReaderDocumentDataForUser(session.user.id, fallbackDocumentKey);

  const selectedDocument =
    documents.find((document) => document.documentKey === (documentData?.documentKey || fallbackDocumentKey)) ||
    documents[0] ||
    null;

  const workspace = selectedDocument
    ? await loadReaderWorkspaceForUser(session.user.id, selectedDocument.documentKey)
    : null;

  return (
    <WorkspaceShell
      profile={readerData?.profile || null}
      documents={documents}
      selectedDocument={selectedDocument}
      blocks={buildDocumentBlocks(documentData)}
      evidenceCount={workspace?.evidenceSet?.items?.length || 0}
      messageCount={workspace?.thread?.messages?.length || 0}
      connectionStatus={readerData?.getReceiptsConnection?.status || "DISCONNECTED"}
      voiceEnabled={appEnv.elevenlabs.enabled || appEnv.openai.enabled}
      defaultVoiceProvider={appEnv.elevenlabs.enabled ? "elevenlabs" : appEnv.openai.enabled ? "openai" : null}
    />
  );
}
