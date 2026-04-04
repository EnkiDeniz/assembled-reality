import { buildExcerpt } from "@/lib/text";
import { PRODUCT_NAME } from "@/lib/product-language";

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function getOperateDocumentKeys(operateResult = null) {
  return unique(
    (Array.isArray(operateResult?.includedDocuments) ? operateResult.includedDocuments : []).map(
      (document) => document.documentKey,
    ),
  );
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
  project = null,
  operateResult = null,
}) {
  if (mode === "operate" && operateResult) {
    const operateDocumentKeys = getOperateDocumentKeys(operateResult);
    const boxTitle = project?.boxTitle || project?.title || "Untitled Box";

    return {
      aim: operateResult.aim.sentence,
      tried: `Operate read ${boxTitle} across ${operateResult.includedSourceCount} source(s)${
        operateResult.includesAssembly ? " and the current assembly" : ""
      } inside ${PRODUCT_NAME}.`,
      outcome: operateResult.ground.sentence,
      learned: operateResult.bridge.sentence,
      decision: operateResult.nextMove,
      owner: profile?.displayName || "Reader",
      temporal: "retrospective",
      visibility: "private",
      tags: unique([
        "loegos",
        "operate",
        project?.projectKey ? "box-scoped" : null,
        operateResult.trustFloor ? operateResult.trustFloor.toLowerCase() : null,
        operateResult.convergence || null,
      ]),
      metadata: {
        source_app: "loegos",
        source_flow: "loegos_operate_v1",
        loegos_operate: {
          box_id: project?.id || null,
          box_key: project?.projectKey || null,
          box_title: boxTitle,
          document_key: document?.documentKey || "",
          document_title: document?.title || "Untitled document",
          included_document_keys: operateDocumentKeys,
          included_documents: Array.isArray(operateResult?.includedDocuments)
            ? operateResult.includedDocuments
            : [],
          includes_assembly: Boolean(operateResult.includesAssembly),
          included_source_count: operateResult.includedSourceCount || 0,
          gradient: operateResult.gradient,
          convergence: operateResult.convergence,
          trust_floor: operateResult.trustFloor,
          trust_ceiling: operateResult.trustCeiling,
          levels: {
            aim: operateResult.aim.level,
            ground: operateResult.ground.level,
            bridge: operateResult.bridge.level,
          },
          level_rationales: {
            aim: operateResult.aim.rationale,
            ground: operateResult.ground.rationale,
            bridge: operateResult.bridge.rationale,
          },
          next_move: operateResult.nextMove,
          ran_at: operateResult.ranAt || new Date().toISOString(),
        },
      },
    };
  }

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
        ? `Assemble ${document?.title || "a new assembly"}`
        : `Capture a receipt for ${document?.title || "the current workspace state"}`,
    tried:
      mode === "assembly"
        ? `Curated, ordered, and assembled ${normalizedBlocks.length} block(s) from ${sourceDocumentKeys.length} source(s) inside ${PRODUCT_NAME}.`
        : `Worked through the current source or assembly inside ${PRODUCT_NAME} with listening, selection, AI, and editing operations recorded in a visible receipt log.`,
    outcome: excerpt
      ? `Produced "${document?.title || "Untitled document"}" with content including: "${excerpt}"`
      : `Produced "${document?.title || "Untitled document"}" inside ${PRODUCT_NAME}.`,
    learned:
      mode === "assembly"
        ? "The assembly preserves source lineage per block so the output can be traced back to the sources and operations that formed it."
        : "The receipt preserves the visible sequence of listening, selection, AI, editing, and assembly actions that shaped the current workspace state.",
    decision:
      mode === "assembly"
        ? "Keep the assembly as a working draft, continue refining it, and preserve its lineage as a receipt."
        : "Preserve the current workspace state as a draft receipt for later review and export.",
    owner: profile?.displayName || "Reader",
    temporal: "retrospective",
    visibility: "private",
    tags: unique([
      "document-assembler",
      mode,
      project?.projectKey ? "project-scoped" : null,
      normalizedBlocks.length > 0 ? "lineage" : null,
    ]),
    metadata: {
      source_app: "document_assembler",
      source_flow: "document_assembler_workspace_v1",
      document_assembler: {
        mode,
        project_id: project?.id || null,
        project_key: project?.projectKey || null,
        project_title: project?.title || null,
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
  project = null,
  operateResult = null,
}) {
  if (mode === "operate" && operateResult) {
    const boxTitle = project?.boxTitle || project?.title || document?.title || "Untitled Box";

    return {
      documentKey: document?.documentKey || "",
      getReceiptsReceiptId: remoteReceiptId || null,
      status,
      title: `${boxTitle} receipt`,
      interpretation: operateResult.bridge?.sentence || null,
      implications: operateResult.nextMove || null,
      stance: "WORKING",
      linkedEvidenceItemIds: [],
      linkedMessageIds: [],
      sourceSections: getOperateDocumentKeys(operateResult),
      sourceMarkIds: [],
      payload: {
        mode,
        operateResult,
      },
    };
  }

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
        ? "This receipt captures how a new assembly was built from ordered source blocks."
        : "This receipt captures the visible operations that shaped the current source or assembly.",
    implications:
      mode === "assembly"
        ? "The assembled draft can be reopened, refined, exported, and verified against its block lineage."
        : "The workspace state can be reviewed, exported, and continued later with its receipt history intact.",
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
