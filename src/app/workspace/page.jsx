import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import {
  getVoiceCatalog,
} from "@/lib/listening";
import {
  getReaderDocumentDataForUser,
  listReaderDocumentsForUser,
} from "@/lib/reader-documents";
import {
  getProjectByKey,
  getProjectEntryDocumentKey,
  getProjectListenDocumentKey,
} from "@/lib/project-model";
import { listReaderProjectsForUser } from "@/lib/reader-projects";
import {
  getReaderProfileByUserId,
  listReadingReceiptDraftsForProjectForUser,
} from "@/lib/reader-db";
import { buildResumeSessionSummaryForUser } from "@/lib/reader-workspace";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const requestedDocumentKey = String(resolvedSearchParams?.document || "").trim();
  const requestedProjectKey = String(resolvedSearchParams?.project || "").trim();
  const requestedLaunchpad = String(resolvedSearchParams?.launchpad || "").trim() === "1";
  const requestedLaunchpadView = String(resolvedSearchParams?.launchpadView || "").trim().toLowerCase();
  const requestedMode = String(resolvedSearchParams?.mode || "").trim().toLowerCase();
  const initialLaunchpadView =
    requestedLaunchpadView === "box" || requestedLaunchpadView === "boxes"
      ? requestedLaunchpadView
      : requestedProjectKey
        ? "box"
        : "boxes";

  const documents = await listReaderDocumentsForUser(session.user.id);

  const projects = await listReaderProjectsForUser(session.user.id, documents);
  const initialProject = getProjectByKey(projects, requestedProjectKey);
  const initialListenDocumentKey =
    getProjectListenDocumentKey(initialProject, documents) ||
    getProjectEntryDocumentKey(initialProject) ||
    documents[0]?.documentKey ||
    "";
  const initialAssembleDocumentKey =
    initialProject?.currentAssemblyDocumentKey ||
    getProjectEntryDocumentKey(initialProject) ||
    documents[0]?.documentKey ||
    "";

  const fallbackDocumentKey =
    requestedDocumentKey ||
    (requestedMode === "listen"
      ? initialListenDocumentKey
      : requestedMode === "assemble"
        ? initialAssembleDocumentKey
        : getProjectEntryDocumentKey(initialProject) ||
          documents[0]?.documentKey ||
          "");
  const [initialDocument, projectDrafts, resumeSessionSummary, readerData] = await Promise.all([
    getReaderDocumentDataForUser(
      session.user.id,
      fallbackDocumentKey,
    ),
    listReadingReceiptDraftsForProjectForUser(session.user.id, {
      projectId: initialProject?.id || null,
      documentKeys: initialProject?.documentKeys || [],
      take: 6,
    }),
    buildResumeSessionSummaryForUser(
      session.user.id,
      initialProject?.documentKeys || documents.map((document) => document.documentKey),
    ),
    getReaderProfileByUserId(session.user.id),
  ]);

  if (!initialDocument) {
    redirect("/");
  }

  const voiceCatalog = getVoiceCatalog({
    openAiEnabled: appEnv.openai.enabled,
    openAiVoice: appEnv.openai.voice,
    elevenLabsEnabled: appEnv.elevenlabs.enabled,
    elevenLabsVoiceId: appEnv.elevenlabs.voiceId,
    includeDevice: true,
  });
  return (
    <WorkspaceShell
      userId={session.user.id}
      documents={documents}
      projects={projects}
      projectDrafts={projectDrafts}
      getReceiptsConnectionStatus={readerData?.getReceiptsConnection?.status || "DISCONNECTED"}
      getReceiptsConnectionLastError={readerData?.getReceiptsConnection?.lastError || ""}
      initialDocument={initialDocument}
      initialProjectKey={initialProject?.projectKey || null}
      initialMode={requestedMode === "listen" || requestedMode === "assemble" ? requestedMode : ""}
      voiceCatalog={voiceCatalog}
      defaultVoiceChoice={voiceCatalog[0] || null}
      showLaunchpadInitially={requestedLaunchpad || (!requestedDocumentKey && !requestedProjectKey)}
      initialLaunchpadView={initialLaunchpadView}
      resumeSessionSummary={resumeSessionSummary}
    />
  );
}
