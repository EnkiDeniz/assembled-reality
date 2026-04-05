import { getServerSession } from "next-auth";
import { headers } from "next/headers";
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
  buildProjectsFromDocuments,
  getProjectByKey,
  getProjectEntryDocumentKey,
  getProjectListenDocumentKey,
  PRIMARY_WORKSPACE_DOCUMENT_KEY,
} from "@/lib/project-model";
import { listReaderProjectsForUser } from "@/lib/reader-projects";
import {
  getReaderProfileByUserId,
  listReadingReceiptDraftsForProjectForUser,
} from "@/lib/reader-db";
import { ensureLoegosOriginExampleForUser } from "@/lib/loegos-origin-example";
import { buildResumeSessionSummaryForUser } from "@/lib/reader-workspace";

export const dynamic = "force-dynamic";

function getProjectForDocumentKey(projects = [], documentKey = "") {
  const normalizedDocumentKey = String(documentKey || "").trim();
  if (!normalizedDocumentKey) return null;

  return (
    (Array.isArray(projects) ? projects : []).find((project) =>
      Array.isArray(project?.documentKeys) && project.documentKeys.includes(normalizedDocumentKey),
    ) || null
  );
}

function getProjectTimestamp(project = null) {
  const parsed = Date.parse(project?.updatedAt || project?.createdAt || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getDocumentTimestamp(document = null) {
  const parsed = Date.parse(document?.updatedAt || document?.createdAt || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function listRealDocuments(documents = []) {
  return (Array.isArray(documents) ? documents : []).filter(
    (document) =>
      document?.documentType !== "builtin" &&
      document?.sourceType !== "builtin" &&
      !document?.isAssembly &&
      document?.documentType !== "assembly",
  );
}

function isSystemExampleDocument(document = null) {
  return Boolean(
    document?.sourceProvenance?.systemTemplateId || document?.seedMeta?.systemTemplateId,
  );
}

function listRealHistoryDocuments(documents = []) {
  return (Array.isArray(documents) ? documents : []).filter(
    (document) =>
      document?.documentType !== "builtin" &&
      document?.sourceType !== "builtin" &&
      !isSystemExampleDocument(document),
  );
}

function isSystemExampleProject(project = null) {
  return Boolean(
    project?.isSystemExample ||
      project?.metadataJson?.system?.templateId ||
      project?.architectureMeta?.system?.templateId,
  );
}

function getMostRecentWorkspaceProject(projects = []) {
  const normalizedProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
  const nonExampleProjects = normalizedProjects.filter((project) => !isSystemExampleProject(project));
  const candidates = nonExampleProjects.length ? nonExampleProjects : normalizedProjects;
  return [...candidates].sort((left, right) => getProjectTimestamp(right) - getProjectTimestamp(left))[0] || null;
}

function getLatestRealProjectDocumentKey(project = null, documents = []) {
  return (
    [...listRealDocuments(documents).filter((document) =>
      Array.isArray(project?.documentKeys) ? project.documentKeys.includes(document.documentKey) : false,
    )].sort((left, right) => getDocumentTimestamp(right) - getDocumentTimestamp(left))[0]?.documentKey ||
    ""
  );
}

function isMobileRequest(userAgent = "") {
  const normalized = String(userAgent || "").toLowerCase();
  return /iphone|ipad|ipod|android|mobile|blackberry|opera mini|windows phone/.test(normalized);
}

function decodeNoticeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch {
    return String(value || "");
  }
}

async function safeWorkspaceRead(label, action, fallback) {
  try {
    return await action();
  } catch (error) {
    console.error(`[workspace] ${label} failed`, error);
    return typeof fallback === "function" ? fallback(error) : fallback;
  }
}

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
  const requestedPhase = String(resolvedSearchParams?.phase || "").trim().toLowerCase();
  const connectedIntegration = String(resolvedSearchParams?.connected || "").trim().toLowerCase();
  const integrationError = String(resolvedSearchParams?.error || "").trim();
  const headerStore = await headers();
  const mobileRequest = isMobileRequest(headerStore.get("user-agent") || "");
  const initialBoxPhase =
    requestedPhase === "receipts"
      ? "receipts"
      : requestedPhase === "operate"
        ? "operate"
        : "";
  const initialWorkspaceNotice =
    connectedIntegration === "getreceipts"
      ? {
          message: "Connected. Your next sealed receipt will be stamped by GetReceipts.",
          tone: "success",
        }
      : integrationError
        ? {
            message:
              integrationError === "access_denied"
                ? "GetReceipts connection was canceled. Local proof still works."
                : integrationError === "getreceipts-state"
                  ? "GetReceipts could not restore the workspace return path. Reconnect from Receipts."
                  : decodeNoticeValue(integrationError),
            tone: "error",
          }
        : null;
  let documents = await safeWorkspaceRead(
    "listReaderDocumentsForUser",
    () => listReaderDocumentsForUser(session.user.id),
    [],
  );
  const exampleBootstrap = await safeWorkspaceRead(
    "ensureLoegosOriginExampleForUser",
    () => ensureLoegosOriginExampleForUser(session.user.id, { documents }),
    {
      hadRealHistory: listRealHistoryDocuments(documents).length > 0,
      hasExampleProject: false,
      exampleProjectKey: "",
      autoOpenProjectKey: "",
      dismissed: false,
    },
  );
  const hasExampleDocuments = documents.some((document) => isSystemExampleDocument(document));
  if (exampleBootstrap.hasExampleProject && !hasExampleDocuments) {
    documents = await safeWorkspaceRead(
      "listReaderDocumentsForUser seeded example",
      () => listReaderDocumentsForUser(session.user.id),
      documents,
    );
  }

  const projects = await safeWorkspaceRead(
    "listReaderProjectsForUser",
    () => listReaderProjectsForUser(session.user.id, documents),
    () => buildProjectsFromDocuments(documents),
  );
  const realDocuments = listRealDocuments(documents);
  const hasSeed = documents.some(
    (document) => document?.isAssembly || document?.documentType === "assembly",
  );
  const shouldAutoOpenExample =
    Boolean(exampleBootstrap.autoOpenProjectKey) &&
    !requestedProjectKey &&
    !requestedDocumentKey;
  const isFirstTime =
    !exampleBootstrap.hadRealHistory &&
    !exampleBootstrap.hasExampleProject &&
    realDocuments.length === 0 &&
    !hasSeed;
  const initialLaunchpadView =
    requestedLaunchpadView === "box" || requestedLaunchpadView === "boxes"
      ? requestedLaunchpadView
      : requestedProjectKey || shouldAutoOpenExample || !mobileRequest
        ? "box"
        : "boxes";
  const resumeProject =
    getProjectForDocumentKey(projects, requestedDocumentKey) ||
    null;
  const mostRecentProject = getMostRecentWorkspaceProject(projects);
  const resolvedProject =
    getProjectByKey(projects, requestedProjectKey) ||
    resumeProject ||
    (shouldAutoOpenExample
      ? getProjectByKey(projects, exampleBootstrap.autoOpenProjectKey)
      : null) ||
    mostRecentProject ||
    projects[0] ||
    null;
  const initialProject = resolvedProject;
  const initialProjectDocuments = documents.filter((document) =>
    Array.isArray(initialProject?.documentKeys) ? initialProject.documentKeys.includes(document.documentKey) : false,
  );
  const shouldSuppressExampleResume =
    Boolean(initialProject?.isSystemExample) &&
    !exampleBootstrap.hadRealHistory &&
    !shouldAutoOpenExample;
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
  const resumeSessionSummary = await safeWorkspaceRead(
    "buildResumeSessionSummaryForUser",
    () =>
      shouldSuppressExampleResume
        ? null
        : buildResumeSessionSummaryForUser(
            session.user.id,
            initialProject?.documentKeys || documents.map((document) => document.documentKey),
          ),
    null,
  );
  const mobileResumeDocumentKey =
    shouldSuppressExampleResume
      ? ""
      : String(resumeSessionSummary?.documentKey || "").trim() ||
        getLatestRealProjectDocumentKey(initialProject, initialProjectDocuments) ||
        "";

  const defaultMode =
    requestedMode === "listen" || requestedMode === "assemble"
      ? requestedMode
      : mobileRequest
        ? "listen"
        : initialProject?.currentAssemblyDocumentKey
        ? "assemble"
        : "listen";
  const showLaunchpadInitially =
    requestedLaunchpad ||
    (!shouldAutoOpenExample &&
      !isFirstTime &&
      !requestedDocumentKey &&
      (!mobileRequest || !mobileResumeDocumentKey));
  const fallbackDocumentKey =
    requestedDocumentKey ||
    (mobileRequest
      ? mobileResumeDocumentKey || initialAssembleDocumentKey
      : defaultMode === "assemble"
        ? initialAssembleDocumentKey
        : initialListenDocumentKey);
  let [initialDocument, projectDrafts, readerData] = await Promise.all([
    safeWorkspaceRead(
      "getReaderDocumentDataForUser",
      () => getReaderDocumentDataForUser(session.user.id, fallbackDocumentKey),
      null,
    ),
    safeWorkspaceRead(
      "listReadingReceiptDraftsForProjectForUser",
      () =>
        listReadingReceiptDraftsForProjectForUser(session.user.id, {
          projectId: initialProject?.id || null,
          documentKeys: initialProject?.documentKeys || [],
          take: 6,
        }),
      [],
    ),
    safeWorkspaceRead(
      "getReaderProfileByUserId",
      () => getReaderProfileByUserId(session.user.id),
      null,
    ),
  ]);

  if (!initialDocument) {
    initialDocument = await safeWorkspaceRead(
      "getReaderDocumentDataForUser builtin fallback",
      () => getReaderDocumentDataForUser(session.user.id, PRIMARY_WORKSPACE_DOCUMENT_KEY),
      null,
    );
  }

  if (!initialDocument && !isFirstTime) {
    redirect("/");
  }

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
      initialMode={defaultMode}
      voiceCatalog={voiceCatalog}
      defaultVoiceChoice={voiceCatalog[0] || null}
      showLaunchpadInitially={showLaunchpadInitially}
      initialLaunchpadView={initialLaunchpadView}
      resumeSessionSummary={resumeSessionSummary}
      initialEntryState={isFirstTime ? "first-time" : "returning"}
      initialBoxPhase={initialBoxPhase}
      initialWorkspaceNotice={initialWorkspaceNotice}
    />
  );
}
