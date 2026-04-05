export const SUPPORTED_HISTORY_EXPORTS = Object.freeze([
  {
    historyKind: "git-log",
    platform: "github",
    label: "Git log export",
    status: "Live now",
    description:
      "Split exported Git history into commit entries with stable metadata, chronology, and change summaries.",
  },
  {
    historyKind: "email-thread-export",
    platform: "email",
    label: "Email thread export",
    status: "Planned",
    description:
      "Normalize exported email threads into dated messages, participants, and attachment-aware evidence entries.",
  },
  {
    historyKind: "chat-export",
    platform: "chat",
    label: "Chat export",
    status: "Planned",
    description:
      "Normalize conversation exports into message timelines with speaker identity, timestamps, and quoted context.",
  },
  {
    historyKind: "calendar-export",
    platform: "calendar",
    label: "Calendar export",
    status: "Planned",
    description:
      "Normalize event history into meetings, invites, attendees, and time-bound chronology anchors.",
  },
  {
    historyKind: "task-history-export",
    platform: "tasks",
    label: "Task history export",
    status: "Planned",
    description:
      "Normalize task-system history into created, moved, commented, completed, and reopened events.",
  },
  {
    historyKind: "docs-revision-export",
    platform: "docs",
    label: "Docs revision export",
    status: "Planned",
    description:
      "Normalize version history from writing tools into revisions, authors, timestamps, and document-state transitions.",
  },
]);

const GIT_COMMIT_RE = /^commit ([0-9a-f]{40})$/m;

function normalizeLineEndings(value = "") {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function stripOuterCodeFence(rawText = "") {
  const normalized = normalizeLineEndings(rawText).trim();
  const lines = normalized.split("\n");
  if (lines.length < 3) return normalized;
  if (!lines[0].startsWith("```") || lines[lines.length - 1].trim() !== "```") {
    return normalized;
  }

  return lines.slice(1, -1).join("\n").trim();
}

export function splitGitCommitChunks(rawText = "") {
  const normalized = stripOuterCodeFence(rawText);
  const lines = normalized.split("\n");
  const chunks = [];
  let current = [];

  lines.forEach((line) => {
    if (/^commit [0-9a-f]{40}$/.test(line.trim()) && current.length > 0) {
      chunks.push(current.join("\n").trim());
      current = [line];
      return;
    }

    current.push(line);
  });

  if (current.length > 0) {
    const chunk = current.join("\n").trim();
    if (chunk) chunks.push(chunk);
  }

  return chunks.filter((chunk) => GIT_COMMIT_RE.test(chunk));
}

export function parseGitCommitChunk(chunk = "", index = 0) {
  const lines = normalizeLineEndings(chunk)
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  const hash = lines[0]?.match(/^commit ([0-9a-f]{40})$/)?.[1] || "";
  const author =
    lines.find((line) => line.startsWith("Author:"))?.replace(/^Author:\s*/, "").trim() || "";
  const occurredAt =
    lines.find((line) => line.startsWith("Date:"))?.replace(/^Date:\s*/, "").trim() || "";
  const subject =
    lines.find((line) => line.startsWith("Subject:"))?.replace(/^Subject:\s*/, "").trim() ||
    `Commit ${index + 1}`;
  const changedFiles = lines.filter((line) => /^\s*[^|\n]+\|\s+\d+/.test(line));
  const aggregateLine =
    [...lines]
      .reverse()
      .find((line) => /files? changed|insertions?\(\+\)|deletions?\(-\)/i.test(line)) || "";
  const bodyLines = [];

  if (hash) bodyLines.push(`- Hash: \`${hash.slice(0, 7)}\``);
  if (occurredAt) bodyLines.push(`- Date: ${occurredAt}`);
  if (author) bodyLines.push(`- Author: ${author}`);
  if (aggregateLine) bodyLines.push(`- Diff summary: ${aggregateLine.trim()}`);

  const fileList = changedFiles
    .slice(0, 8)
    .map((line) => line.trim())
    .join("\n");

  return {
    entryId: hash || `commit-${index + 1}`,
    hash,
    author,
    occurredAt,
    title: subject,
    body: fileList,
    changeSummary: {
      aggregate: aggregateLine.trim(),
      files: changedFiles.slice(0, 8).map((line) => line.trim()),
      fileCount: changedFiles.length,
    },
    markdown: [
      bodyLines.join("\n"),
      fileList ? `Changed files:\n${fileList.split("\n").map((line) => `- ${line}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

export function normalizeGitHistoryEntries(rawText = "") {
  return splitGitCommitChunks(rawText).map((chunk, index) => parseGitCommitChunk(chunk, index));
}

export function getHistoryExportDefinition(historyKind = "") {
  return (
    SUPPORTED_HISTORY_EXPORTS.find(
      (entry) => entry.historyKind === String(historyKind || "").trim().toLowerCase(),
    ) || null
  );
}

export function detectHistoryWitnessKind({
  historyKind = "",
  title = "",
  originalFilename = "",
  relativePath = "",
  rawText = "",
} = {}) {
  const explicit = String(historyKind || "").trim().toLowerCase();
  if (explicit) return explicit;

  const fingerprint = [
    title,
    originalFilename,
    relativePath,
    String(rawText || "").slice(0, 400),
  ]
    .join("\n")
    .toLowerCase();

  if (
    /full-commit-history|git history|git-log|commit [0-9a-f]{7,40}|^commit [0-9a-f]{40}$/m.test(
      fingerprint,
    )
  ) {
    return "git-log";
  }
  if (/from:|to:|subject:|sent:/i.test(fingerprint)) return "email-thread-export";
  if (/slack|discord|message export|speaker:/i.test(fingerprint)) return "chat-export";
  if (/ical|calendar|event start|attendees/i.test(fingerprint)) return "calendar-export";
  if (/task history|status changed|reopened|completed/i.test(fingerprint)) return "task-history-export";
  if (/revision history|version history|edited by/i.test(fingerprint)) return "docs-revision-export";
  return "";
}

export function normalizeHistoryExportEntries({ historyKind = "", rawText = "" } = {}) {
  const normalizedKind = String(historyKind || "").trim().toLowerCase();
  const definition = getHistoryExportDefinition(normalizedKind);

  if (normalizedKind === "git-log") {
    return {
      historyKind: normalizedKind,
      platform: definition?.platform || "github",
      definition,
      entries: normalizeGitHistoryEntries(rawText),
    };
  }

  return {
    historyKind: normalizedKind,
    platform: definition?.platform || "",
    definition,
    entries: [],
  };
}
