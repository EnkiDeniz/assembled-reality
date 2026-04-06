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
  isProjectDocumentVisible,
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

function listProjectDocuments(project = null, documents = []) {
  const documentKeys = Array.isArray(project?.documentKeys) ? project.documentKeys : [];
  if (!documentKeys.length) return [];
  const allowedKeys = new Set(documentKeys);
  return (Array.isArray(documents) ? documents : []).filter((document) =>
    allowedKeys.has(document.documentKey),
  );
}

function listVisibleProjectDocuments(project = null, documents = []) {
  return listProjectDocuments(project, documents).filter((document) =>
    isProjectDocumentVisible(document),
  );
}

function hasDocumentBearingProject(project = null, documents = []) {
  return listVisibleProjectDocuments(project, documents).length > 0;
}

function getFirstVisibleProjectDocumentKey(project = null, documents = []) {
  return listVisibleProjectDocuments(project, documents)[0]?.documentKey || "";
}

function getProjectDocumentCandidates(project = null, documents = []) {
  const visibleProjectDocuments = listVisibleProjectDocuments(project, documents);
  const visibleKeys = new Set(visibleProjectDocuments.map((document) => document.documentKey));

  return [
    String(project?.currentAssemblyDocumentKey || "").trim(),
    String(getProjectEntryDocumentKey(project) || "").trim(),
    String(getProjectListenDocumentKey(project, documents) || "").trim(),
    String(getFirstVisibleProjectDocumentKey(project, documents) || "").trim(),
  ].filter((documentKey, index, values) => {
    if (!documentKey) return false;
    if (values.indexOf(documentKey) !== index) return false;
    return visibleKeys.has(documentKey) || documentKey === PRIMARY_WORKSPACE_DOCUMENT_KEY;
  });
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

function getMostRecentWorkspaceProject(projects = [], documents = []) {
  const normalizedProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
  const nonExampleProjects = normalizedProjects.filter((project) => !isSystemExampleProject(project));
  const candidates = nonExampleProjects.length ? nonExampleProjects : normalizedProjects;
  const documentBearingCandidates = candidates.filter((project) =>
    hasDocumentBearingProject(project, documents),
  );
  const rankedCandidates = documentBearingCandidates.length ? documentBearingCandidates : candidates;
  return (
    [...rankedCandidates].sort((left, right) => getProjectTimestamp(right) - getProjectTimestamp(left))[0] ||
    null
  );
}

function getFirstDocumentBearingProject(projects = [], documents = []) {
  const normalizedProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
  return (
    normalizedProjects.find((project) => hasDocumentBearingProject(project, documents)) || null
  );
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

  const readerDataPromise = safeWorkspaceRead(
    "getReaderProfileByUserId",
    () => getReaderProfileByUserId(session.user.id),
    null,
  );

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
      refreshed: false,
    },
  );
  const hasExampleDocuments = documents.some((document) => isSystemExampleDocument(document));
  if (exampleBootstrap.refreshed || (exampleBootstrap.hasExampleProject && !hasExampleDocuments)) {
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
  const requestedProject = requestedProjectKey
    ? getProjectByKey(projects, requestedProjectKey)
    : null;
  const resumeProject = getProjectForDocumentKey(projects, requestedDocumentKey) || null;
  const primaryExampleProject =
    (exampleBootstrap.exampleProjectKey
      ? getProjectByKey(projects, exampleBootstrap.exampleProjectKey)
      : null) ||
    projects.find((project) => project?.isSystemExample) ||
    null;
  const mostRecentProject = getMostRecentWorkspaceProject(projects, documents);
  const firstDocumentBearingProject = getFirstDocumentBearingProject(projects, documents);
  const projectCandidates = [
    requestedProject,
    resumeProject,
    shouldAutoOpenExample ? primaryExampleProject : null,
    mostRecentProject,
    firstDocumentBearingProject,
    primaryExampleProject,
    projects[0] || null,
  ].filter((project, index, values) => project && values.indexOf(project) === index);
  const resolvedProject =
    projectCandidates.find((project) => hasDocumentBearingProject(project, documents)) ||
    projectCandidates[0] ||
    null;
  let initialProject = resolvedProject;
  let initialProjectDocuments = listProjectDocuments(initialProject, documents);
  const shouldSuppressExampleResume =
    Boolean(initialProject?.isSystemExample) &&
    !exampleBootstrap.hadRealHistory &&
    !shouldAutoOpenExample;
  const initialListenDocumentKey =
    [
      String(getProjectListenDocumentKey(initialProject, documents) || "").trim(),
      String(getFirstVisibleProjectDocumentKey(initialProject, documents) || "").trim(),
      String(getProjectEntryDocumentKey(initialProject) || "").trim(),
    ].find(Boolean) ||
    documents[0]?.documentKey ||
    PRIMARY_WORKSPACE_DOCUMENT_KEY;
  const initialAssembleDocumentKey =
    [
      String(initialProject?.currentAssemblyDocumentKey || "").trim(),
      String(getProjectEntryDocumentKey(initialProject) || "").trim(),
      String(getFirstVisibleProjectDocumentKey(initialProject, documents) || "").trim(),
    ].find(Boolean) ||
    documents[0]?.documentKey ||
    PRIMARY_WORKSPACE_DOCUMENT_KEY;
  const shouldReadResumeSessionSummary =
    !shouldSuppressExampleResume && !requestedDocumentKey;
  const initialReaderData = shouldReadResumeSessionSummary
    ? await readerDataPromise
    : null;
  const resumeOwner = initialReaderData?.profile?.id
    ? {
        userId: session.user.id,
        profileId: initialReaderData.profile.id,
        profile: initialReaderData.profile,
      }
    : null;
  const resumeSessionSummary = shouldReadResumeSessionSummary
    ? await safeWorkspaceRead(
        "buildResumeSessionSummaryForUser",
        () =>
          buildResumeSessionSummaryForUser(
            session.user.id,
            initialProject?.documentKeys || documents.map((document) => document.documentKey),
            resumeOwner,
          ),
        null,
      )
    : null;
  const mobileResumeDocumentKey =
    shouldSuppressExampleResume
      ? ""
      : String(resumeSessionSummary?.documentKey || "").trim() ||
        getLatestRealProjectDocumentKey(initialProject, initialProjectDocuments) ||
        "";
  const desktopResumeDocumentKey =
    String(requestedDocumentKey || "").trim() ||
    String(initialProject?.currentAssemblyDocumentKey || "").trim() ||
    String(initialAssembleDocumentKey || "").trim() ||
    String(resumeSessionSummary?.documentKey || "").trim() ||
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
      (!mobileRequest || !mobileResumeDocumentKey) &&
      (mobileRequest || !desktopResumeDocumentKey));
  const initialDocumentCandidates = [
    requestedDocumentKey,
    mobileRequest
      ? mobileResumeDocumentKey || initialAssembleDocumentKey
      : defaultMode === "assemble"
        ? initialAssembleDocumentKey
        : initialListenDocumentKey,
    ...getProjectDocumentCandidates(initialProject, documents),
    ...getProjectDocumentCandidates(primaryExampleProject, documents),
    PRIMARY_WORKSPACE_DOCUMENT_KEY,
  ].filter((documentKey, index, values) => {
    const normalizedDocumentKey = String(documentKey || "").trim();
    return normalizedDocumentKey && values.indexOf(documentKey) === index;
  });
  let initialDocument = null;
  for (const candidateDocumentKey of initialDocumentCandidates) {
    // Try every valid box-backed candidate before falling back to the built-in workspace doc.
    initialDocument = await safeWorkspaceRead(
      `getReaderDocumentDataForUser ${candidateDocumentKey}`,
      () => getReaderDocumentDataForUser(session.user.id, candidateDocumentKey),
      null,
    );
    if (initialDocument) break;
  }

  if (!initialDocument) {
    redirect("/");
  }

  const projectForInitialDocument =
    getProjectForDocumentKey(projects, initialDocument.documentKey) ||
    initialProject ||
    null;
  if (projectForInitialDocument?.projectKey && projectForInitialDocument.projectKey !== initialProject?.projectKey) {
    initialProject = projectForInitialDocument;
    initialProjectDocuments = listProjectDocuments(initialProject, documents);
  }

  const [projectDrafts, readerData] = await Promise.all([
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
    readerDataPromise,
  ]);

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
      initialDisclaimerAcceptedAt={readerData?.profile?.disclaimerAcceptedAt || null}
    />
  );
}
