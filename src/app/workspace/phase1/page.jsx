import { headers } from "next/headers";
import Link from "next/link";
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

function buildMigrationNotice({
  deprecated = "",
  connected = "",
  error = "",
  mode = "",
} = {}) {
  const normalizedDeprecated = String(deprecated || "").trim().toLowerCase();
  if (normalizedDeprecated === "legacy-workspace") {
    return "Legacy workspace is now frozen. You are on the launch shell.";
  }

  const normalizedConnected = String(connected || "").trim().toLowerCase();
  if (normalizedConnected === "getreceipts") {
    return "GetReceipts is connected. Continue in the launch shell.";
  }

  const normalizedError = String(error || "").trim();
  if (normalizedError) {
    return `Integration notice: ${normalizedError}`;
  }

  const normalizedMode = String(mode || "").trim().toLowerCase();
  if (normalizedMode === "listen" || normalizedMode === "assemble") {
    return `Mode '${normalizedMode}' now resolves into the launch shell experience.`;
  }
  return "";
}

function buildLegacyBanner(roomHref = "/workspace") {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        padding: "14px 18px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          margin: "0 auto",
          maxWidth: 1320,
          padding: "12px 14px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          background: "rgba(16, 18, 22, 0.92)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 18px 36px rgba(0,0,0,0.24)",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-code)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(162, 204, 255, 0.92)",
            }}
          >
            Legacy Workbench
          </span>
          <p
            style={{
              margin: 0,
              maxWidth: 680,
              fontSize: 15,
              lineHeight: 1.55,
              color: "rgba(228, 228, 232, 0.84)",
            }}
          >
            The breathing Room now lives at <strong style={{ color: "#e4e4e8" }}>/workspace</strong>.
            This surface stays available for deep workbench flows and legacy inspection.
          </p>
        </div>
        <Link
          href={roomHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 40,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid rgba(84,150,216,0.22)",
            background: "rgba(84,150,216,0.12)",
            color: "#8fc4ff",
            textDecoration: "none",
            fontFamily: "var(--font-code)",
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Open Room
        </Link>
      </div>
    </div>
  );
}

export default async function WorkspacePhase1Page({ searchParams }) {
  await headers();
  const resolvedSearchParams = await searchParams;
  const demoMode = String(resolvedSearchParams?.phase2demo || "").trim() === "1";
  const requestedDocumentKey = String(resolvedSearchParams?.document || "").trim();
  const requestedProjectKey = String(resolvedSearchParams?.project || "").trim();
  const requestedMode = String(resolvedSearchParams?.mode || "").trim();
  const requestedConnected = String(resolvedSearchParams?.connected || "").trim();
  const requestedError = String(resolvedSearchParams?.error || "").trim();
  const requestedDeprecated = String(resolvedSearchParams?.deprecated || "").trim();
  const roomHref = requestedProjectKey
    ? `/workspace?project=${encodeURIComponent(requestedProjectKey)}`
    : "/workspace";
  const migrationNotice = buildMigrationNotice({
    deprecated: requestedDeprecated,
    connected: requestedConnected,
    error: requestedError,
    mode: requestedMode,
  });
  if (demoMode) {
    const demoBootstrap = {
      projectKey: requestedProjectKey || "demo_project",
      documentKey: requestedDocumentKey || "demo_document",
      documentTitle: "Phase 2 Demo Witness",
      migrationNotice,
      sourceDocuments: [
        {
          title: "Demo source",
          subtitle: "Phase 2 demo bootstrap",
          snippets: ["demo source", "phase2"],
        },
      ],
      files: [],
    };
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top right, rgba(84, 150, 216, 0.08), transparent 28%), linear-gradient(180deg, #0f1013 0%, #090a0c 100%)",
        }}
      >
        {buildLegacyBanner(roomHref)}
        <LoegosPhase1Shell bootstrap={demoBootstrap} />
      </div>
    );
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
    migrationNotice,
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(84, 150, 216, 0.08), transparent 28%), linear-gradient(180deg, #0f1013 0%, #090a0c 100%)",
      }}
    >
      {buildLegacyBanner(roomHref)}
      <LoegosPhase1Shell bootstrap={bootstrap} />
    </div>
  );
}
