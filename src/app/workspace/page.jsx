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
} from "@/lib/project-model";
import { listReaderProjectsForUser } from "@/lib/reader-projects";
import {
  listReadingReceiptDraftsForProjectForUser,
} from "@/lib/reader-db";

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

  const documents = await listReaderDocumentsForUser(session.user.id);

  const projects = await listReaderProjectsForUser(session.user.id, documents);
  const initialProject = getProjectByKey(projects, requestedProjectKey);

  const fallbackDocumentKey =
    requestedDocumentKey ||
    getProjectEntryDocumentKey(initialProject) ||
    documents[0]?.documentKey ||
    "";
  const [initialDocument, projectDrafts] = await Promise.all([
    getReaderDocumentDataForUser(
      session.user.id,
      fallbackDocumentKey,
    ),
    listReadingReceiptDraftsForProjectForUser(session.user.id, {
      projectId: initialProject?.id || null,
      documentKeys: initialProject?.documentKeys || [],
      take: 6,
    }),
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
      initialDocument={initialDocument}
      initialProjectKey={initialProject?.projectKey || null}
      voiceCatalog={voiceCatalog}
      defaultVoiceChoice={voiceCatalog[0] || null}
      showLaunchpadInitially={requestedLaunchpad || (!requestedDocumentKey && !requestedProjectKey)}
    />
  );
}
