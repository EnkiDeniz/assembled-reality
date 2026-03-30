import { SECTIONS, DOCUMENT_VERSION, SHAPES } from "../constants";

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function getSectionMeta(id) {
  return SECTIONS.find(s => s.id === id) || { num: "?", title: id };
}

function collapseRanges(nums) {
  if (nums.length === 0) return "";
  const sorted = [...new Set(nums)].map(Number).sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0], end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `§${start}` : `§${start}–${end}`);
      start = end = sorted[i];
    }
  }
  ranges.push(start === end ? `§${start}` : `§${start}–${end}`);
  return ranges.join(", ");
}

export function composeReceipt(session) {
  if (!session) return null;

  const durationSec = Math.floor((session.lastActivityAt - session.startedAt) / 1000);
  const uniqueSections = [];
  const seen = new Set();
  for (const s of session.sections) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      uniqueSections.push(s);
    }
  }

  const sectionNums = uniqueSections.map(s => getSectionMeta(s.id).num);
  const rangeStr = collapseRanges(sectionNums);

  const counts = { signals: 0, highlights: 0, annotations: 0, carries: 0, comments: 0, statusTags: 0, reactions: 0 };
  for (const a of session.actions) {
    if (counts[a.type] !== undefined) counts[a.type]++;
    else if (a.type === "signal") counts.signals++;
    else if (a.type === "status_tag") counts.statusTags++;
  }

  // Build tried string
  const tried = uniqueSections.length > 0
    ? `Read ${rangeStr} (${uniqueSections.length} of ${SECTIONS.length} sections).`
    : "Opened the document.";

  // Build outcome string
  const parts = [];
  if (counts.signals > 0) parts.push(`${counts.signals} signal${counts.signals > 1 ? "s" : ""}`);
  if (counts.highlights > 0) parts.push(`${counts.highlights} highlight${counts.highlights > 1 ? "s" : ""}`);
  if (counts.annotations > 0) parts.push(`${counts.annotations} annotation${counts.annotations > 1 ? "s" : ""}`);
  if (counts.carries > 0) parts.push(`${counts.carries} passage${counts.carries > 1 ? "s" : ""} carried`);
  if (counts.comments > 0) parts.push(`${counts.comments} comment${counts.comments > 1 ? "s" : ""}`);
  if (counts.reactions > 0) parts.push(`${counts.reactions} reaction${counts.reactions > 1 ? "s" : ""}`);

  const outcome = parts.length > 0
    ? `${parts.join(", ")}. ${formatDuration(durationSec)} active reading.`
    : `${formatDuration(durationSec)} reading. No interactions yet.`;

  return {
    aim: `Review Assembled Reality v${DOCUMENT_VERSION}`,
    tried,
    outcome,
    learned: "",
    decision: "",
    owner: session.reader,
    temporal: "retrospective",
    status: "draft",
    visibility: "private",
    tags: ["assembled-reality", "document-review", `v${DOCUMENT_VERSION}`],
    metadata: {
      source_app: "assembled-reality",
      source_flow: "ar_session_receipt_v1",
      assembled_reality: {
        sessionId: session.id,
        duration: durationSec,
        sectionsVisited: uniqueSections.length,
        totalSections: SECTIONS.length,
        actions: counts,
      },
    },
  };
}

export function composeMarkdownEvidence(session) {
  if (!session) return "";

  const durationSec = Math.floor((session.lastActivityAt - session.startedAt) / 1000);
  const date = new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Section visit durations
  const sectionDurations = {};
  for (const s of session.sections) {
    const end = s.leftAt || Date.now();
    const dur = (end - s.enteredAt) / 1000;
    sectionDurations[s.id] = (sectionDurations[s.id] || 0) + dur;
  }

  const uniqueSectionIds = [...new Set(session.sections.map(s => s.id))];

  // Action counts
  const counts = { signals: 0, highlights: 0, annotations: 0, carries: 0, comments: 0, statusTags: 0, reactions: 0 };
  for (const a of session.actions) {
    if (a.type === "signal") counts.signals++;
    else if (a.type === "highlight") counts.highlights++;
    else if (a.type === "annotation") counts.annotations++;
    else if (a.type === "carry") counts.carries++;
    else if (a.type === "comment") counts.comments++;
    else if (a.type === "status_tag") counts.statusTags++;
    else if (a.type === "reaction") counts.reactions++;
  }

  let md = `# Session Receipt — ${session.reader}\n`;
  md += `**Assembled Reality v${DOCUMENT_VERSION}** · ${date} · ${formatDuration(durationSec)}\n\n`;

  // Sections visited
  if (uniqueSectionIds.length > 0) {
    md += `## Sections Visited\n`;
    md += `| § | Section | Time |\n|---|---------|------|\n`;
    for (const id of uniqueSectionIds) {
      const meta = getSectionMeta(id);
      const dur = sectionDurations[id] || 0;
      md += `| ${meta.num} | ${meta.title} | ${formatDuration(Math.round(dur))} |\n`;
    }
    md += `\n`;
  }

  // Actions
  const actionLines = [];
  if (counts.signals > 0) {
    const signalDetails = session.actions.filter(a => a.type === "signal");
    const shapeCounts = {};
    for (const a of signalDetails) {
      const shape = SHAPES.find(s => s.key === a.shape);
      const label = shape ? `${shape.sym} ${shape.label}` : a.shape;
      shapeCounts[label] = (shapeCounts[label] || 0) + 1;
    }
    const detail = Object.entries(shapeCounts).map(([k, v]) => `${v}× ${k}`).join(", ");
    actionLines.push(`- ${counts.signals} signal${counts.signals > 1 ? "s" : ""} (${detail})`);
  }
  if (counts.highlights > 0) actionLines.push(`- ${counts.highlights} highlight${counts.highlights > 1 ? "s" : ""}`);
  if (counts.annotations > 0) actionLines.push(`- ${counts.annotations} annotation${counts.annotations > 1 ? "s" : ""}`);
  if (counts.carries > 0) actionLines.push(`- ${counts.carries} passage${counts.carries > 1 ? "s" : ""} carried`);
  if (counts.comments > 0) actionLines.push(`- ${counts.comments} comment${counts.comments > 1 ? "s" : ""}`);
  if (counts.statusTags > 0) actionLines.push(`- ${counts.statusTags} status tag${counts.statusTags > 1 ? "s" : ""}`);
  if (counts.reactions > 0) actionLines.push(`- ${counts.reactions} reaction${counts.reactions > 1 ? "s" : ""}`);

  if (actionLines.length > 0) {
    md += `## Actions\n${actionLines.join("\n")}\n\n`;
  }

  // Carried passages
  const carries = session.actions.filter(a => a.type === "carry" && a.text);
  if (carries.length > 0) {
    md += `## Carried Passages\n`;
    for (const c of carries) {
      const meta = c.sectionId ? getSectionMeta(c.sectionId) : null;
      const src = meta ? ` — §${meta.num} ${meta.title}` : "";
      md += `> "${c.text}"${src}\n\n`;
    }
  }

  return md;
}

export function downloadMarkdownEvidence(session) {
  const md = composeMarkdownEvidence(session);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.reader.toLowerCase()}-session-receipt.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
