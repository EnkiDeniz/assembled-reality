import { buildExcerpt } from "@/lib/text";

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

export function buildWorkspaceBlockLineage(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block, index) => ({
    order: index,
    block_id: block.id,
    document_key: block.documentKey,
    source_document_key: block.sourceDocumentKey,
    source_position: block.sourcePosition,
    source_title: block.sourceTitle || null,
    author: block.author,
    operation: block.operation,
    kind: block.kind,
    text_excerpt: buildExcerpt(block.plainText || block.text || "", 140),
  }));
}

export function buildWorkspaceReceiptPayload({
  profile,
  document,
  blocks = [],
  logEntries = [],
  mode = "assembly",
}) {
  const normalizedBlocks = Array.isArray(blocks) ? blocks : [];
  const normalizedLogEntries = Array.isArray(logEntries) ? logEntries : [];
  const sourceDocumentKeys = unique(
    normalizedBlocks.map((block) => block.sourceDocumentKey || block.documentKey),
  );
  const sourceTitles = unique(
    normalizedBlocks.map((block) => block.sourceTitle || block.sourceDocumentKey),
  );
  const blockLineage = buildWorkspaceBlockLineage(normalizedBlocks);
  const excerpt = buildExcerpt(
    normalizedBlocks.map((block) => block.plainText || block.text || "").join(" "),
    220,
  );
  const actionCounts = normalizedLogEntries.reduce((accumulator, entry) => {
    const key = String(entry?.action || "INFO").trim().toUpperCase();
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return {
    aim:
      mode === "assembly"
        ? `Assemble ${document?.title || "a new document"}`
        : `Capture a workspace receipt for ${document?.title || "the current document"}`,
    tried:
      mode === "assembly"
        ? `Curated, ordered, and assembled ${normalizedBlocks.length} block(s) from ${sourceDocumentKeys.length} source document(s) inside Document Assembler.`
        : `Worked through the document inside Document Assembler with listening, selection, AI, and editing operations recorded in a visible receipt log.`,
    outcome: excerpt
      ? `Produced "${document?.title || "Untitled document"}" with content including: "${excerpt}"`
      : `Produced "${document?.title || "Untitled document"}" inside Document Assembler.`,
    learned:
      mode === "assembly"
        ? "The assembled output preserves source lineage per block so the document can be traced back to the documents and operations that formed it."
        : "The workspace receipt preserves the visible sequence of listening, selection, AI, editing, and assembly actions that shaped the document.",
    decision:
      mode === "assembly"
        ? "Keep the assembled document as a working draft, continue refining it, and preserve its lineage as a receipt."
        : "Preserve the current workspace state as a draft receipt for later review and export.",
    owner: profile?.displayName || "Reader",
    temporal: "retrospective",
    visibility: "private",
    tags: unique([
      "document-assembler",
      mode,
      normalizedBlocks.length > 0 ? "lineage" : null,
    ]),
    metadata: {
      source_app: "document_assembler",
      source_flow: "document_assembler_workspace_v1",
      document_assembler: {
        mode,
        document_key: document?.documentKey || "",
        document_title: document?.title || "Untitled document",
        document_type: document?.documentType || "source",
        block_count: normalizedBlocks.length,
        source_document_keys: sourceDocumentKeys,
        source_titles: sourceTitles,
        block_lineage: blockLineage,
        log_entry_ids: normalizedLogEntries.map((entry) => entry.id),
        log_action_counts: actionCounts,
      },
    },
  };
}

export function buildWorkspaceReceiptDraftInput({
  document,
  blocks = [],
  logEntries = [],
  remoteReceiptId = null,
  status = "LOCAL_DRAFT",
  mode = "assembly",
}) {
  const normalizedBlocks = Array.isArray(blocks) ? blocks : [];
  const normalizedLogEntries = Array.isArray(logEntries) ? logEntries : [];
  const sourceSections = unique(
    normalizedBlocks.map((block) => block.sourceDocumentKey || block.documentKey),
  );

  return {
    documentKey: document?.documentKey || "",
    getReceiptsReceiptId: remoteReceiptId || null,
    status,
    title: `${document?.title || "Untitled document"} receipt`,
    interpretation:
      mode === "assembly"
        ? "This receipt captures how a new document was assembled from ordered source blocks."
        : "This receipt captures the visible operations that shaped the current document.",
    implications:
      mode === "assembly"
        ? "The assembled draft can be reopened, refined, exported, and verified against its block lineage."
        : "The workspace state can be reviewed, exported, and continued later with its operation history intact.",
    stance: "WORKING",
    linkedEvidenceItemIds: [],
    linkedMessageIds: [],
    sourceSections,
    sourceMarkIds: normalizedBlocks.map((block) => block.id),
    payload: {
      mode,
      blockLineage: buildWorkspaceBlockLineage(normalizedBlocks),
      logEntries: normalizedLogEntries,
    },
  };
}
