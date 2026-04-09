import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoegosPhase1Shell from "../../../../LoegosCLI/UX/loegos-phase1-shell";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getRequiredSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

function normalizeWord(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

function buildInitialSourceFromDocument(document = null) {
  if (!document) return "";
  const titleToken = normalizeWord(document?.title || document?.documentKey || "workspace_window") || "workspace_window";
  const title = String(document?.title || "Workspace witness").trim();
  return `GND box @${titleToken}
DIR aim stabilize_real_workspace_phase2
GND witness @initial_witness from "${title}" with v_phase2
INT story loaded_from_workspace_context
MOV move validate_compiler_truth_ui via manual
TST test mirror_and_editor_render_same_artifact
`;
}

function buildSourceDocumentHints(documents = [], take = 4) {
  return (Array.isArray(documents) ? documents : [])
    .slice(0, take)
    .map((document) => ({
      title: String(document?.title || "Untitled source").trim(),
      subtitle: String(document?.subtitle || "").trim(),
      snippets: [String(document?.title || "").trim(), String(document?.subtitle || "").trim()].filter(
        Boolean,
      ),
    }));
}

export default async function WorkspacePhase1Page({ searchParams }) {
  await headers();
  const resolvedSearchParams = await searchParams;
  const demoMode = String(resolvedSearchParams?.phase2demo || "").trim() === "1";
  const requestedDocumentKey = String(resolvedSearchParams?.document || "").trim();
  const requestedProjectKey = String(resolvedSearchParams?.project || "").trim();
  if (demoMode) {
    const demoBootstrap = {
      projectKey: requestedProjectKey || "demo_project",
      documentKey: requestedDocumentKey || "demo_document",
      documentTitle: "Phase 2 Demo Witness",
      sourceDocuments: [
        {
          title: "Demo source",
          subtitle: "Phase 2 demo bootstrap",
          snippets: ["demo source", "phase2"],
        },
      ],
      files: [],
    };
    return <LoegosPhase1Shell bootstrap={demoBootstrap} />;
  }

  const session = await getRequiredSession();
  if (!session?.user?.id) {
    redirect("/");
  }

  const documents = await listReaderDocumentsForUser(session.user.id).catch(() => []);
  const initialDocument =
    documents.find((document) => document.documentKey === requestedDocumentKey) ||
    documents.find(
      (document) =>
        document?.documentType !== "builtin" &&
        document?.sourceType !== "builtin",
    ) ||
    documents[0] ||
    null;
  const fallbackSource = buildInitialSourceFromDocument(initialDocument);
  const filenameStem = normalizeWord(initialDocument?.title || initialDocument?.documentKey || "workspace_phase2");
  const bootstrap = {
    projectKey: requestedProjectKey || String(initialDocument?.projectKey || "").trim(),
    documentKey: String(initialDocument?.documentKey || "").trim(),
    documentTitle: String(initialDocument?.title || "Workspace witness").trim(),
    sourceDocuments: buildSourceDocumentHints(documents || []),
    files: fallbackSource
      ? [
          {
            filename: `${filenameStem || "workspace_phase2"}.loe`,
            source: fallbackSource,
          },
        ]
      : [],
  };

  return <LoegosPhase1Shell bootstrap={bootstrap} />;
}
