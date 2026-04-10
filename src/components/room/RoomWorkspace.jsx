"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Play,
  Plus,
  ReceiptText,
  SendHorizontal,
  Upload,
  X,
} from "lucide-react";
import styles from "@/components/room/RoomWorkspace.module.css";

const DEFAULT_PROJECT_KEY = "default-project";

const RECEIPT_RESULT_OPTIONS = [
  { value: "matched", label: "Matched" },
  { value: "surprised", label: "Surprised" },
  { value: "contradicted", label: "Contradicted" },
];

const SEGMENT_TONES = {
  aim: { glyph: "△", toneClass: styles.segmentToneAim },
  witness: { glyph: "◻", toneClass: styles.segmentToneEvidence },
  evidence: { glyph: "◻", toneClass: styles.segmentToneEvidence },
  story: { glyph: "○", toneClass: styles.segmentToneStory },
  move: { glyph: "->", toneClass: styles.segmentToneMoves },
  test: { glyph: "?", toneClass: styles.segmentToneMoves },
  return: { glyph: "<-", toneClass: styles.segmentToneReturns },
  receipt: { glyph: "<-", toneClass: styles.segmentToneReturns },
  other: { glyph: "", toneClass: styles.segmentToneOther },
};

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongForm(value = "") {
  return String(value || "").trim();
}

function buildWorkspaceHref(projectKey = "") {
  const normalizedProjectKey = normalizeText(projectKey);
  if (!normalizedProjectKey || normalizedProjectKey === DEFAULT_PROJECT_KEY) {
    return "/workspace";
  }
  return `/workspace?project=${encodeURIComponent(normalizedProjectKey)}`;
}

function buildReaderDocumentHref(projectKey = "", documentKey = "") {
  const normalizedProjectKey = normalizeText(projectKey);
  const normalizedDocumentKey = normalizeText(documentKey);
  const params = new URLSearchParams();
  if (normalizedProjectKey) params.set("project", normalizedProjectKey);
  if (normalizedDocumentKey) params.set("document", normalizedDocumentKey);
  params.set("mode", "listen");
  params.set("phase", "think");
  return `/workspace/phase1?${params.toString()}`;
}

function splitParagraphs(text = "") {
  return String(text || "")
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function hasProposalContent(roomPayload = null) {
  return Boolean(
    (Array.isArray(roomPayload?.segments) && roomPayload.segments.length > 0) ||
      roomPayload?.receiptKit,
  );
}

function getArtifactLabel(type = "") {
  const normalized = normalizeText(type).toLowerCase();
  if (normalized === "upload") return "Upload";
  if (normalized === "paste") return "Paste";
  if (normalized === "link") return "Link";
  if (normalized === "draft_message") return "Draft Message";
  if (normalized === "checklist") return "Checklist";
  if (normalized === "compare") return "Compare";
  return "Receipt Kit";
}

function findReturnForReceipt(view = null, receiptKitId = "") {
  const normalizedReceiptKitId = normalizeText(receiptKitId);
  const items = Array.isArray(view?.recentReturns) ? view.recentReturns : [];
  return items.find((item) => normalizeText(item?.receiptKitId) === normalizedReceiptKitId) || null;
}

function getSegmentTone(domain = "") {
  return SEGMENT_TONES[normalizeText(domain).toLowerCase()] || SEGMENT_TONES.other;
}

function shouldShowMessageLead(content = "", segments = []) {
  const normalizedContent = normalizeText(content);
  if (!normalizedContent) return false;
  return !segments.some((segment) => normalizeText(segment?.text) === normalizedContent);
}

function FieldStateChip({ fieldState }) {
  const toneClass =
    styles[`stateTone${String(fieldState?.tone || "new").replace(/^\w/, (char) => char.toUpperCase())}`] ||
    styles.stateToneNew;
  return (
    <span className={`${styles.fieldChip} ${toneClass}`}>
      <span className={styles.fieldDot} />
      {fieldState?.label || "Open"}
    </span>
  );
}

function FogPlaceholder({ children = "Not enough signal yet." }) {
  return (
    <div className={styles.fog}>
      <div className={styles.fogLine} />
      <div className={styles.fogLineShort} />
      <p>{children}</p>
    </div>
  );
}

function MirrorSection({
  title,
  caption = "",
  children,
  emptyCopy = "",
  highlighted = false,
}) {
  return (
    <section className={`${styles.mirrorSection} ${highlighted ? styles.mirrorSectionActive : ""}`}>
      <div className={styles.mirrorSectionHead}>
        <h3>{title}</h3>
        {caption ? <span>{caption}</span> : null}
      </div>
      {children || <FogPlaceholder>{emptyCopy}</FogPlaceholder>}
    </section>
  );
}

function MirrorPanel({ view, highlightedRegion, collapsed, onToggle }) {
  const mirror = view?.mirror || {};
  const projectKey = view?.project?.projectKey || "";

  if (!view?.hasStructure) return null;

  return (
    <section className={styles.mirrorStrip}>
      <button type="button" className={styles.mirrorToggle} onClick={onToggle}>
        <div className={styles.mirrorToggleCopy}>
          <span className={styles.eyebrow}>Box Mirror</span>
          <strong>{normalizeText(mirror?.aim?.text) || "Structure forming..."}</strong>
        </div>
        <div className={styles.mirrorToggleState}>
          <FieldStateChip fieldState={view?.fieldState} />
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {!collapsed ? (
        <div className={styles.mirrorGrid}>
          <MirrorSection
            title="Aim"
            highlighted={highlightedRegion === "aim"}
            emptyCopy="The line is still forming. Keep talking until it gets precise."
          >
            {normalizeText(mirror?.aim?.text) ? (
              <div className={styles.mirrorPrimary}>
                <p>{mirror.aim.text}</p>
                {normalizeText(mirror?.aim?.gloss) ? <span>{mirror.aim.gloss}</span> : null}
              </div>
            ) : null}
          </MirrorSection>

          {Array.isArray(mirror?.evidence) && mirror.evidence.length ? (
            <MirrorSection
              title="Witness / Evidence"
              caption={String(mirror.evidence.length)}
              highlighted={highlightedRegion === "evidence"}
              emptyCopy="Witness lands here after apply."
            >
              <div className={styles.mirrorList}>
                {mirror.evidence.map((item) => (
                  <div key={item.id} className={styles.mirrorItem}>
                    <div>
                      <strong>{item.title}</strong>
                      {item.detail ? <span>{item.detail}</span> : null}
                    </div>
                    {item.documentKey ? (
                      <Link
                        href={buildReaderDocumentHref(projectKey, item.documentKey)}
                        className={styles.inlineLink}
                      >
                        Read
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </MirrorSection>
          ) : null}

          {Array.isArray(mirror?.story) && mirror.story.length ? (
            <MirrorSection
              title="Story"
              caption={String(mirror.story.length)}
              highlighted={highlightedRegion === "story"}
              emptyCopy="Interpretation shows up only when it has a place."
            >
              <div className={styles.mirrorList}>
                {mirror.story.map((item) => (
                  <div key={item.id} className={styles.mirrorItem}>
                    <div>
                      <strong>{item.text}</strong>
                      {item.detail ? <span>{item.detail}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </MirrorSection>
          ) : null}

          {Array.isArray(mirror?.moves) && mirror.moves.length ? (
            <MirrorSection
              title="Pings / Moves"
              caption={String(mirror.moves.length)}
              highlighted={highlightedRegion === "moves"}
              emptyCopy="A lawful ping appears here after apply."
            >
              <div className={styles.mirrorList}>
                {mirror.moves.map((item) => (
                  <div key={item.id} className={styles.mirrorItem}>
                    <div>
                      <strong>{item.text}</strong>
                      {item.detail ? <span>{item.detail}</span> : null}
                    </div>
                    <span className={styles.moveStatus}>{item.status || "suggested"}</span>
                  </div>
                ))}
              </div>
            </MirrorSection>
          ) : null}

          {Array.isArray(mirror?.returns) && mirror.returns.length ? (
            <MirrorSection
              title="Returns / Receipts"
              caption={String(mirror.returns.length)}
              highlighted={highlightedRegion === "returns"}
              emptyCopy="Returns change the room here."
            >
              <div className={styles.mirrorList}>
                {mirror.returns.map((item) => (
                  <div key={item.id} className={styles.mirrorItem}>
                    <div>
                      <strong>{item.label || item.actual || "Return"}</strong>
                      {item.actual ? <span>{item.actual}</span> : null}
                      {item.provenanceLabel ? <span>{item.provenanceLabel}</span> : null}
                    </div>
                    <span className={styles.returnResult}>{item.result || "draft"}</span>
                  </div>
                ))}
              </div>
            </MirrorSection>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ProposalWakeCard({ title, region, items = [], highlighted = false, onHighlight }) {
  if (!items.length) return null;

  return (
    <button
      type="button"
      className={`${styles.wakeCard} ${highlighted ? styles.wakeCardActive : ""}`}
      onClick={() => onHighlight?.(region)}
    >
      <span className={styles.wakeLabel}>{title}</span>
      <strong>{items[0]?.text}</strong>
      {items.slice(1, 3).map((item) => (
        <span key={item.id}>{item.text}</span>
      ))}
    </button>
  );
}

function ProposalWake({ wake, highlightedRegion, onHighlight }) {
  if (!wake) return null;

  const aimItems = wake?.sections?.aim ? [wake.sections.aim] : [];

  return (
    <section className={styles.proposalWake}>
      <div className={styles.wakeHeader}>
        <div>
          <span className={styles.eyebrow}>Structure Waking</span>
          <strong>{wake?.assistantText || "Preview only until you apply it."}</strong>
        </div>
        <span className={styles.wakeMeta}>Preview only</span>
      </div>

      <div className={styles.wakeGrid}>
        <ProposalWakeCard
          title="Aim"
          region="aim"
          items={aimItems}
          highlighted={highlightedRegion === "aim"}
          onHighlight={onHighlight}
        />
        <ProposalWakeCard
          title="Witness / Evidence"
          region="evidence"
          items={wake?.sections?.evidence}
          highlighted={highlightedRegion === "evidence"}
          onHighlight={onHighlight}
        />
        <ProposalWakeCard
          title="Story"
          region="story"
          items={wake?.sections?.story}
          highlighted={highlightedRegion === "story"}
          onHighlight={onHighlight}
        />
        <ProposalWakeCard
          title="Pings / Moves"
          region="moves"
          items={wake?.sections?.moves}
          highlighted={highlightedRegion === "moves"}
          onHighlight={onHighlight}
        />
        <ProposalWakeCard
          title="Returns / Receipts"
          region="returns"
          items={wake?.sections?.returns}
          highlighted={highlightedRegion === "returns"}
          onHighlight={onHighlight}
        />
      </div>

      {normalizeText(wake?.nextBestAction) ? (
        <p className={styles.wakeCopy}>{wake.nextBestAction}</p>
      ) : null}
    </section>
  );
}

function StarterView({ starter = null }) {
  return (
    <section className={styles.starter}>
      <span className={styles.eyebrow}>Room</span>
      <h1>{starter?.firstLine || "What's on your mind?"}</h1>
      <p>{starter?.secondLine || "A decision. A question. Something you're carrying. Just start talking."}</p>
    </section>
  );
}

function ProjectPicker({ projects, activeProjectKey, onSelect, onCreate }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.eyebrow}>Boxes</span>
          <strong>Open another room</strong>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={onCreate}>
          <Plus size={14} />
          New Box
        </button>
      </div>

      <div className={styles.projectList}>
        {(Array.isArray(projects) ? projects : []).map((project) => (
          <button
            key={project.projectKey}
            type="button"
            className={`${styles.projectRow} ${project.projectKey === activeProjectKey ? styles.projectRowActive : ""}`}
            onClick={() => onSelect(project.projectKey)}
          >
            <div>
              <strong>{project.title}</strong>
              <span>
                {project.sourceCount || 0} source{project.sourceCount === 1 ? "" : "s"}
                {project.receiptDraftCount ? ` • ${project.receiptDraftCount} receipt drafts` : ""}
              </span>
            </div>
            {project.projectKey === activeProjectKey ? <span className={styles.projectBadge}>Open</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function CreateBoxForm({ onCreate, busy }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!normalizeText(title)) {
      setError("Give the box a name.");
      return;
    }
    setError("");
    try {
      await onCreate({ title: normalizeText(title), subtitle: normalizeText(subtitle) });
      setTitle("");
      setSubtitle("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not create the box.");
    }
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.eyebrow}>New Box</span>
          <strong>Open a fresh room</strong>
        </div>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Name</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Box title" />
        </label>
        <label className={styles.field}>
          <span>Note</span>
          <input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Optional subtitle"
          />
        </label>
      </div>
      {error ? <p className={styles.errorText}>{error}</p> : null}
      <div className={styles.inlineActions}>
        <button type="submit" className={styles.primaryButton} disabled={busy}>
          {busy ? "Creating..." : "Create Box"}
        </button>
      </div>
    </form>
  );
}

function SourceTray({ projectKey, onComplete }) {
  const [mode, setMode] = useState("upload");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose a file to bring into the box.");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("projectKey", projectKey);
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not upload that source.");
      }
      setNotice("Source added to the box.");
      setFile(null);
      await onComplete(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not upload that source.");
    } finally {
      setPending(false);
    }
  }

  async function handlePaste(event) {
    event.preventDefault();
    if (!normalizeLongForm(text)) {
      setError("Paste something the room can work with.");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/workspace/paste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          mode: "source",
          text,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not add the pasted source.");
      }
      setNotice("Pasted source added.");
      setText("");
      await onComplete(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not add the pasted source.");
    } finally {
      setPending(false);
    }
  }

  async function handleLink(event) {
    event.preventDefault();
    if (!normalizeText(url)) {
      setError("Paste a link the box can fetch.");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/workspace/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          url: normalizeText(url),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not import that link.");
      }
      setNotice("Linked source captured.");
      setUrl("");
      await onComplete(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not import that link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.eyebrow}>Source</span>
          <strong>Bring witness into the room</strong>
        </div>
      </div>

      <div className={styles.tabRow}>
        {[
          { key: "upload", label: "Upload" },
          { key: "paste", label: "Paste" },
          { key: "link", label: "Link" },
        ].map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={`${styles.tabButton} ${mode === entry.key ? styles.tabButtonActive : ""}`}
            onClick={() => {
              setMode(entry.key);
              setError("");
              setNotice("");
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <form className={styles.stack} onSubmit={handleUpload}>
          <label className={styles.field}>
            <span>File</span>
            <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Uploading..." : "Add Source"}
          </button>
        </form>
      ) : null}

      {mode === "paste" ? (
        <form className={styles.stack} onSubmit={handlePaste}>
          <label className={styles.field}>
            <span>Source text</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste text, notes, or witness."
              rows={6}
            />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Adding..." : "Add Source"}
          </button>
        </form>
      ) : null}

      {mode === "link" ? (
        <form className={styles.stack} onSubmit={handleLink}>
          <label className={styles.field}>
            <span>URL</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
              type="url"
            />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Capturing..." : "Capture Link"}
          </button>
        </form>
      ) : null}

      {error ? <p className={styles.errorText}>{error}</p> : null}
      {notice ? <p className={styles.noticeText}>{notice}</p> : null}
    </div>
  );
}

function ReturnCard({ item }) {
  if (!item) return null;

  return (
    <div className={styles.returnCard}>
      <div className={styles.returnHead}>
        <strong>{item.label || "Return"}</strong>
        <span className={styles.returnBadge}>{item.result || "matched"}</span>
      </div>
      <div className={styles.compareGrid}>
        <div>
          <span>Predicted</span>
          <p>{item.predicted || "No prediction recorded."}</p>
        </div>
        <div>
          <span>Actual</span>
          <p>{item.actual || "No actual recorded."}</p>
        </div>
      </div>
      {item.provenanceLabel ? <p className={styles.noticeText}>{item.provenanceLabel}</p> : null}
    </div>
  );
}

function ReceiptKitCard({ receiptKit, view, onComplete, busy }) {
  const artifactType = normalizeText(receiptKit?.artifact?.type).toLowerCase();
  const config =
    receiptKit?.artifact?.config && typeof receiptKit.artifact.config === "object"
      ? receiptKit.artifact.config
      : {};
  const checklistItems =
    Array.isArray(config.items) && config.items.length
      ? config.items.map((item) => normalizeText(item)).filter(Boolean)
      : normalizeText(receiptKit?.need)
        ? [normalizeText(receiptKit.need)]
        : [];
  const [expanded, setExpanded] = useState(false);
  const [actual, setActual] = useState("");
  const [result, setResult] = useState("matched");
  const [messageDraft, setMessageDraft] = useState(
    normalizeLongForm(config.draft || config.message || receiptKit?.fastestPath || ""),
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [checkedMap, setCheckedMap] = useState(() =>
    Object.fromEntries(checklistItems.map((item) => [item, false])),
  );
  const [error, setError] = useState("");

  const checkedItems = useMemo(
    () => Object.entries(checkedMap).filter(([, value]) => value).map(([key]) => key),
    [checkedMap],
  );
  const returnItem = receiptKit ? findReturnForReceipt(view, receiptKit.id) : null;
  const waiting = view?.fieldState?.key === "awaiting" && !returnItem;

  useEffect(() => {
    if (!returnItem) return undefined;
    const frame = window.requestAnimationFrame(() => {
      setExpanded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [returnItem]);

  function validateReturnInput() {
    if (artifactType === "upload" && !uploadFile && !normalizeText(actual)) {
      return "Attach the return or describe what came back.";
    }
    if (artifactType === "link" && !normalizeText(linkUrl) && !normalizeText(actual)) {
      return "Paste the return link or note what came back.";
    }
    if (artifactType === "checklist" && checkedItems.length === 0 && !normalizeText(actual)) {
      return "Check what landed or note what changed.";
    }
    if (
      artifactType !== "upload" &&
      artifactType !== "link" &&
      artifactType !== "checklist" &&
      !normalizeText(actual)
    ) {
      return "Record what came back.";
    }
    return "";
  }

  async function handleMarkSent() {
    setError("");
    try {
      await onComplete({
        receiptKit,
        completion: {
          mode: "move",
          moveText:
            normalizeText(messageDraft) ||
            normalizeText(receiptKit?.fastestPath) ||
            normalizeText(receiptKit?.need),
          messageDraft: normalizeLongForm(messageDraft),
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not mark the ping sent.");
    }
  }

  async function handleRecordReturn() {
    const nextError = validateReturnInput();
    if (nextError) {
      setError(nextError);
      setExpanded(true);
      return;
    }
    setError("");
    try {
      await onComplete({
        receiptKit,
        completion: {
          mode: "return",
          actual: normalizeLongForm(actual),
          result,
          messageDraft: normalizeLongForm(messageDraft),
          linkUrl: normalizeText(linkUrl),
          checkedItems,
          uploadFile,
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not record the return.");
    }
  }

  return (
    <div className={styles.receiptKit}>
      <div className={styles.receiptHead}>
        <div>
          <span className={styles.eyebrow}>Receipt Kit</span>
          <strong>{receiptKit?.need || "Capture the return"}</strong>
        </div>
        <div className={styles.inlineActions}>
          <span className={styles.receiptType}>{getArtifactLabel(artifactType)}</span>
          <button
            type="button"
            className={styles.inlineLinkButton}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Hide kit" : "Open kit"}
          </button>
        </div>
      </div>

      {receiptKit?.why ? <p className={styles.receiptCopy}>{receiptKit.why}</p> : null}

      <div className={styles.compareGrid}>
        <div>
          <span>Predicted</span>
          <p>{receiptKit?.prediction?.expected || "No prediction recorded."}</p>
        </div>
        <div>
          <span>Enough</span>
          <p>{receiptKit?.enough || "One return is enough to change the next move."}</p>
        </div>
      </div>

      {!expanded ? (
        <div className={styles.receiptSummary}>
          {normalizeText(receiptKit?.fastestPath) ? <p>{receiptKit.fastestPath}</p> : null}
          <div className={styles.inlineActions}>
            {!returnItem ? (
              <button type="button" className={styles.secondaryButton} onClick={handleMarkSent} disabled={busy}>
                {busy ? "Holding..." : "Mark Ping Sent"}
              </button>
            ) : null}
            <button type="button" className={styles.primaryButton} onClick={() => setExpanded(true)}>
              {returnItem ? "Review Return" : "Record Return"}
            </button>
          </div>
          {waiting ? <p className={styles.awaitingText}>The room is listening for the return.</p> : null}
          {returnItem ? <ReturnCard item={returnItem} /> : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>
      ) : (
        <>
          {artifactType === "draft_message" ? (
            <label className={styles.field}>
              <span>Draft</span>
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                rows={4}
                placeholder="Write the smallest clear ping."
              />
            </label>
          ) : null}

          {artifactType === "link" ? (
            <label className={styles.field}>
              <span>Return link</span>
              <input
                type="url"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://"
              />
            </label>
          ) : null}

          {artifactType === "upload" ? (
            <label className={styles.field}>
              <span>Attach return</span>
              <input type="file" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
            </label>
          ) : null}

          {artifactType === "checklist" ? (
            <div className={styles.checklist}>
              {checklistItems.map((item) => (
                <label key={item} className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={Boolean(checkedMap[item])}
                    onChange={(event) =>
                      setCheckedMap((current) => ({
                        ...current,
                        [item]: event.target.checked,
                      }))
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          ) : null}

          <label className={styles.field}>
            <span>{artifactType === "compare" ? "Actual" : "What came back"}</span>
            <textarea
              value={actual}
              onChange={(event) => setActual(event.target.value)}
              rows={artifactType === "compare" ? 4 : 3}
              placeholder={
                artifactType === "compare"
                  ? "Write the actual outcome."
                  : "Paste the return, note the reaction, or describe what changed."
              }
            />
          </label>

          <div className={styles.inlineActions}>
            <label className={styles.selectField}>
              <span>Result</span>
              <select value={result} onChange={(event) => setResult(event.target.value)}>
                {RECEIPT_RESULT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {!returnItem ? (
              <button type="button" className={styles.secondaryButton} onClick={handleMarkSent} disabled={busy}>
                {busy ? "Holding..." : "Mark Ping Sent"}
              </button>
            ) : null}
            <button type="button" className={styles.primaryButton} onClick={handleRecordReturn} disabled={busy}>
              {busy ? "Saving..." : "Record Return"}
            </button>
          </div>

          {waiting ? <p className={styles.awaitingText}>The room is listening for the return.</p> : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}
          {returnItem ? <ReturnCard item={returnItem} /> : null}
        </>
      )}
    </div>
  );
}

function ProposalSegments({ segments, onHighlight }) {
  const [openId, setOpenId] = useState("");

  return (
    <div className={styles.segmentFlow}>
      {segments.map((segment) => {
        const tone = getSegmentTone(segment?.domain);
        const isOpen = openId === segment.id;
        const hasClause = normalizeText(segment?.suggestedClause);

        return (
          <span key={segment.id} className={styles.segmentInline}>
            <button
              type="button"
              className={`${styles.segmentButton} ${tone.toneClass}`}
              onClick={() => {
                setOpenId((current) => (current === segment.id ? "" : segment.id));
                if (segment?.mirrorRegion) {
                  onHighlight?.(segment.mirrorRegion);
                }
              }}
            >
              {segment.text}
            </button>
            {isOpen && hasClause ? (
              <span className={`${styles.segmentClause} ${tone.toneClass}`}>
                {tone.glyph ? <span className={styles.segmentGlyph}>{tone.glyph}</span> : null}
                {segment.suggestedClause}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function ProposalFooter({ roomPayload, onApply, busy }) {
  const gatePreview = roomPayload?.gatePreview || null;
  const diagnostics = Array.isArray(gatePreview?.diagnostics) ? gatePreview.diagnostics : [];
  const accepted = gatePreview?.accepted !== false;

  if (!gatePreview && !hasProposalContent(roomPayload)) return null;

  return (
    <div className={styles.proposalFooter}>
      <div
        className={`${styles.proposalStatus} ${accepted ? styles.proposalStatusAccepted : styles.proposalStatusRejected}`}
      >
        <span>{accepted ? "Ready" : "Blocked"}</span>
        <p>
          {accepted
            ? gatePreview?.nextBestAction || "Apply this proposal to make it canonical."
            : gatePreview?.reason || "This proposal is not lawful yet."}
        </p>
        {diagnostics.length ? (
          <small>{diagnostics.map((item) => item.message).join(" • ")}</small>
        ) : null}
      </div>

      {accepted && Array.isArray(roomPayload?.segments) && roomPayload.segments.length ? (
        <button type="button" className={styles.primaryButton} onClick={onApply} disabled={busy}>
          {busy ? "Applying..." : "Apply to Room"}
        </button>
      ) : null}
    </div>
  );
}

function ThreadMessage({
  message,
  view,
  onApplyProposal,
  onCompleteReceiptKit,
  applying,
  busyReceiptKitId,
  onHighlight,
}) {
  const roomPayload = message?.roomPayload || null;
  const receiptKit = roomPayload?.receiptKit || null;
  const segments = Array.isArray(roomPayload?.segments) ? roomPayload.segments : [];
  const paragraphs = splitParagraphs(message?.content || "");
  const isAssistant = message?.role === "assistant";

  return (
    <article className={`${styles.messageRow} ${isAssistant ? styles.messageRowAssistant : styles.messageRowUser}`}>
      <div className={`${styles.messageCard} ${isAssistant ? styles.messageAssistant : styles.messageUser}`}>
        <div className={styles.messageMeta}>
          <span>{isAssistant ? "Seven" : "You"}</span>
          {message?.createdAt ? <small>{String(message.createdAt).slice(0, 16).replace("T", " ")}</small> : null}
        </div>

        <div className={styles.messageBody}>
          {isAssistant && segments.length ? (
            <>
              {shouldShowMessageLead(message?.content, segments) ? (
                <p className={styles.messageLead}>{message.content}</p>
              ) : null}
              <ProposalSegments segments={segments} onHighlight={onHighlight} />
            </>
          ) : paragraphs.length ? (
            paragraphs.map((paragraph, index) => <p key={`${message.id}-${index}`}>{paragraph}</p>)
          ) : (
            <p>{message?.content}</p>
          )}
        </div>

        {isAssistant && roomPayload ? (
          <ProposalFooter roomPayload={roomPayload} onApply={() => onApplyProposal(message)} busy={applying} />
        ) : null}

        {receiptKit ? (
          <ReceiptKitCard
            receiptKit={receiptKit}
            view={view}
            onComplete={onCompleteReceiptKit}
            busy={busyReceiptKitId === receiptKit.id}
          />
        ) : null}
      </div>
    </article>
  );
}

function ToolLinks({ deepLinks }) {
  return (
    <div className={styles.toolRow}>
      <Link href={deepLinks?.reader || "/workspace/phase1"} className={styles.toolLink}>
        <FileText size={14} />
        Reader
      </Link>
      <Link href={deepLinks?.compare || "/workspace/phase1"} className={styles.toolLink}>
        <ArrowUpRight size={14} />
        Compare
      </Link>
      <Link href={deepLinks?.operate || "/workspace/phase1"} className={styles.toolLink}>
        <MessageSquareText size={14} />
        Operate
      </Link>
      <Link href={deepLinks?.receipts || "/workspace/phase1"} className={styles.toolLink}>
        <ReceiptText size={14} />
        Receipts
      </Link>
      <Link href={deepLinks?.legacy || "/workspace/phase1"} className={styles.toolLinkSubtle}>
        <ExternalLink size={14} />
        Workbench
      </Link>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  pending,
  placeholder = "Start talking...",
  onOpenAttach,
  listenHref,
}) {
  return (
    <form className={styles.composer} onSubmit={onSubmit}>
      <div className={styles.composerShell}>
        <div className={styles.composerRow}>
          <button
            type="button"
            className={styles.composerTool}
            onClick={onOpenAttach}
            aria-label="Add source"
          >
            <Paperclip size={16} />
          </button>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={1}
          />
          <button type="submit" className={styles.primaryButton} disabled={pending || !normalizeText(value)}>
            <SendHorizontal size={14} />
            {pending ? "Listening..." : "Send"}
          </button>
        </div>
        <div className={styles.composerActions}>
          <Link href={listenHref || "/workspace/phase1"} className={styles.composerListen}>
            <Play size={14} />
            Listen
          </Link>
          <p>Plain language first. Structure wakes up only when it earns it.</p>
        </div>
      </div>
    </form>
  );
}

function LoadingMessage() {
  return (
    <article className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
      <div className={`${styles.messageCard} ${styles.messageAssistant}`}>
        <div className={styles.messageMeta}>
          <span>Seven</span>
          <small>Thinking</small>
        </div>
        <div className={styles.loadingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </article>
  );
}

function OverlaySurface({
  mode,
  view,
  projectKey,
  onClose,
  onOpenMode,
  onProjectSelect,
  onCreateBox,
  onSourceComplete,
  busy,
}) {
  if (!mode) return null;

  const title =
    mode === "source"
      ? "Bring witness into the room"
      : mode === "boxes"
        ? "Open another room"
        : mode === "create"
          ? "Open a fresh room"
          : "Room controls";

  return (
    <div className={styles.overlayBackdrop} onClick={onClose}>
      <aside className={styles.overlayPanel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.overlayHeader}>
          <div className={styles.overlayHeaderCopy}>
            <span className={styles.eyebrow}>Room</span>
            <strong>{view?.project?.title || "Room"}</strong>
            <p>{title}</p>
          </div>
          <div className={styles.inlineActions}>
            {mode !== "instrument" ? (
              <button type="button" className={styles.secondaryButton} onClick={() => onOpenMode("instrument")}>
                <ChevronRight size={14} />
                Back
              </button>
            ) : null}
            <button type="button" className={styles.secondaryButton} onClick={onClose} aria-label="Close controls">
              <X size={14} />
            </button>
          </div>
        </div>

        {mode === "instrument" ? (
          <div className={styles.overlayContent}>
            <div className={styles.overlayActions}>
              <button type="button" className={styles.primaryButton} onClick={() => onOpenMode("source")}>
                <Upload size={14} />
                Add Source
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => onOpenMode("boxes")}>
                <Boxes size={14} />
                Boxes
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => onOpenMode("create")}>
                <Plus size={14} />
                New Box
              </button>
            </div>

            {view?.hasStructure ? <ToolLinks deepLinks={view?.deepLinks} /> : null}

            <div className={styles.overlayMeta}>
              <span>{Number(view?.project?.sourceCount) || 0} source{Number(view?.project?.sourceCount) === 1 ? "" : "s"}</span>
              <span>
                {Number(view?.project?.receiptDraftCount) || 0} receipt draft
                {Number(view?.project?.receiptDraftCount) === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        ) : null}

        {mode === "source" ? <SourceTray projectKey={projectKey} onComplete={onSourceComplete} /> : null}
        {mode === "boxes" ? (
          <ProjectPicker
            projects={view?.projects}
            activeProjectKey={projectKey}
            onSelect={onProjectSelect}
            onCreate={() => onOpenMode("create")}
          />
        ) : null}
        {mode === "create" ? <CreateBoxForm onCreate={onCreateBox} busy={busy} /> : null}
      </aside>
    </div>
  );
}

export default function RoomWorkspace({ initialView }) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [composerText, setComposerText] = useState("");
  const [turnPending, setTurnPending] = useState(false);
  const [actionPending, startActionTransition] = useTransition();
  const [messageError, setMessageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [mirrorCollapsed, setMirrorCollapsed] = useState(false);
  const [overlayMode, setOverlayMode] = useState("");
  const [applyingMessageId, setApplyingMessageId] = useState("");
  const [busyReceiptKitId, setBusyReceiptKitId] = useState("");
  const [highlightedRegion, setHighlightedRegion] = useState("");
  const threadRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [view, turnPending]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const projectKey = view?.project?.projectKey || "";
  const messages = Array.isArray(view?.messages) ? view.messages : [];
  const showStarter = Boolean(view?.starter?.show) && messages.length === 0;

  function highlightRegion(region = "") {
    const normalizedRegion = normalizeText(region).toLowerCase();
    if (!normalizedRegion) return;
    setHighlightedRegion(normalizedRegion);
    setMirrorCollapsed(false);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedRegion("");
    }, 1400);
  }

  async function refreshRoom(nextProjectKey = projectKey) {
    const params = new URLSearchParams();
    if (normalizeText(nextProjectKey)) {
      params.set("projectKey", normalizeText(nextProjectKey));
    }
    const response = await fetch(`/api/workspace/room${params.toString() ? `?${params.toString()}` : ""}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "Could not refresh the room.");
    }
    setView(payload.view);
    return payload.view;
  }

  async function handleProjectSelect(nextProjectKey) {
    setActionError("");
    try {
      await refreshRoom(nextProjectKey);
      startActionTransition(() => {
        router.replace(buildWorkspaceHref(nextProjectKey), { scroll: false });
      });
      setOverlayMode("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not open that box.");
    }
  }

  async function handleCreateBox({ title, subtitle }) {
    const response = await fetch("/api/workspace/project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, subtitle }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "Could not create the box.");
    }
    await handleProjectSelect(payload?.project?.projectKey || "");
  }

  async function handleSourceComplete() {
    setActionError("");
    await refreshRoom(projectKey);
    setOverlayMode("");
  }

  async function handleTurnSubmit(event) {
    event.preventDefault();
    const message = normalizeLongForm(composerText);
    if (!message) return;
    setTurnPending(true);
    setMessageError("");
    try {
      const response = await fetch("/api/workspace/room/turn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          message,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "The room did not answer.");
      }
      setView(payload.view);
      setComposerText("");
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "The room did not answer.");
    } finally {
      setTurnPending(false);
    }
  }

  async function handleApplyProposal(message) {
    const roomPayload = message?.roomPayload;
    if (!hasProposalContent(roomPayload)) return;
    setApplyingMessageId(message.id);
    setActionError("");
    try {
      const response = await fetch("/api/workspace/room/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          action: "apply_proposal_preview",
          assistantMessageId: message.id,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not apply the proposal.");
      }
      setView(payload.view);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not apply the proposal.");
    } finally {
      setApplyingMessageId("");
    }
  }

  async function handleCompleteReceiptKit({ receiptKit, completion }) {
    setBusyReceiptKitId(receiptKit?.id || "");
    setActionError("");
    try {
      const nextCompletion = { ...(completion || {}) };
      if (nextCompletion.uploadFile instanceof File) {
        const formData = new FormData();
        formData.set("file", nextCompletion.uploadFile);
        formData.set("projectKey", projectKey);
        const uploadResponse = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });
        const uploadPayload = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok) {
          throw new Error(uploadPayload?.error || "Could not upload the return.");
        }
        nextCompletion.uploadedDocument = uploadPayload?.document || null;
        delete nextCompletion.uploadFile;
      }
      if (normalizeText(nextCompletion.linkUrl)) {
        const linkResponse = await fetch("/api/workspace/link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectKey,
            url: normalizeText(nextCompletion.linkUrl),
          }),
        });
        const linkPayload = await linkResponse.json().catch(() => null);
        if (!linkResponse.ok) {
          throw new Error(linkPayload?.error || "Could not capture the return link.");
        }
        nextCompletion.uploadedDocument = linkPayload?.document || nextCompletion.uploadedDocument || null;
      }

      const response = await fetch("/api/workspace/room/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          action: "complete_receipt_kit",
          receiptKit,
          completion: nextCompletion,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not record the return.");
      }
      setView(payload.view);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not record the return.");
    } finally {
      setBusyReceiptKitId("");
    }
  }

  return (
    <main className={styles.page}>
      <button
        type="button"
        className={styles.instrumentTrigger}
        onClick={() => setOverlayMode("instrument")}
        aria-label="Open room controls"
      >
        <MoreHorizontal size={18} />
      </button>

      <OverlaySurface
        mode={overlayMode}
        view={view}
        projectKey={projectKey}
        onClose={() => setOverlayMode("")}
        onOpenMode={setOverlayMode}
        onProjectSelect={handleProjectSelect}
        onCreateBox={handleCreateBox}
        onSourceComplete={handleSourceComplete}
        busy={actionPending}
      />

      <div className={styles.shell}>
        {actionError || messageError ? (
          <div className={styles.bannerStack}>
            {actionError ? <p className={styles.errorBanner}>{actionError}</p> : null}
            {messageError ? <p className={styles.errorBanner}>{messageError}</p> : null}
          </div>
        ) : null}

        <section className={styles.roomCanvas}>
          {view?.proposalWake || view?.hasStructure ? (
            <div className={styles.surfaceStack}>
              <ProposalWake
                wake={view?.proposalWake}
                highlightedRegion={highlightedRegion}
                onHighlight={highlightRegion}
              />
              <MirrorPanel
                view={view}
                highlightedRegion={highlightedRegion}
                collapsed={mirrorCollapsed}
                onToggle={() => setMirrorCollapsed((current) => !current)}
              />
            </div>
          ) : null}

          <div
            ref={threadRef}
            className={`${styles.threadViewport} ${showStarter ? styles.threadViewportCentered : ""}`}
          >
            {showStarter ? <StarterView starter={view?.starter} /> : null}

            <div className={styles.thread}>
              {messages.map((message) => (
                <ThreadMessage
                  key={message.id}
                  message={message}
                  view={view}
                  onApplyProposal={handleApplyProposal}
                  onCompleteReceiptKit={handleCompleteReceiptKit}
                  applying={applyingMessageId === message.id}
                  busyReceiptKitId={busyReceiptKitId}
                  onHighlight={highlightRegion}
                />
              ))}

              {turnPending ? <LoadingMessage /> : null}

              {!messages.length && !showStarter && !view?.hasStructure ? (
                <div className={styles.emptyThread}>
                  <FogPlaceholder>Unresolved regions belong here until witness arrives.</FogPlaceholder>
                </div>
              ) : null}
            </div>
          </div>

          <Composer
            value={composerText}
            onChange={setComposerText}
            onSubmit={handleTurnSubmit}
            pending={turnPending}
            placeholder={!view?.hasStructure ? "Start talking..." : "Say more..."}
            onOpenAttach={() => setOverlayMode("source")}
            listenHref={view?.deepLinks?.reader || "/workspace/phase1"}
          />
        </section>
      </div>
    </main>
  );
}
