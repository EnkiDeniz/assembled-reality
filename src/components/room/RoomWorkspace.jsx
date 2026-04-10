"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  Plus,
  ReceiptText,
  SendHorizontal,
  Upload,
} from "lucide-react";
import styles from "@/components/room/RoomWorkspace.module.css";

const DEFAULT_PROJECT_KEY = "default-project";

const RECEIPT_RESULT_OPTIONS = [
  { value: "matched", label: "Matched" },
  { value: "surprised", label: "Surprised" },
  { value: "contradicted", label: "Contradicted" },
];

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function hasMirrorDraftContent(mirrorDraft = null) {
  const draft = mirrorDraft && typeof mirrorDraft === "object" ? mirrorDraft : null;
  if (!draft) return false;
  return Boolean(
    normalizeText(draft.aimText) ||
      normalizeText(draft.aimGloss) ||
      (Array.isArray(draft.evidenceItems) && draft.evidenceItems.length) ||
      (Array.isArray(draft.storyItems) && draft.storyItems.length) ||
      (Array.isArray(draft.moveItems) && draft.moveItems.length),
  );
}

function buildFormalLines(roomPayload = null) {
  const payload = roomPayload && typeof roomPayload === "object" ? roomPayload : {};
  const draft = payload.mirrorDraft && typeof payload.mirrorDraft === "object" ? payload.mirrorDraft : {};
  const lines = [];

  if (normalizeText(draft.aimText)) {
    lines.push(`AIM "${normalizeText(draft.aimText)}"`);
  }
  if (normalizeText(draft.aimGloss)) {
    lines.push(`GLOSS "${normalizeText(draft.aimGloss)}"`);
  }
  (Array.isArray(draft.evidenceItems) ? draft.evidenceItems : []).forEach((item) => {
    if (normalizeText(item?.text)) {
      lines.push(`WIT "${normalizeText(item.text)}"`);
    }
  });
  (Array.isArray(draft.storyItems) ? draft.storyItems : []).forEach((item) => {
    if (normalizeText(item?.text)) {
      lines.push(`STORY "${normalizeText(item.text)}"`);
    }
  });
  (Array.isArray(draft.moveItems) ? draft.moveItems : []).forEach((item) => {
    if (normalizeText(item?.text)) {
      lines.push(`MOVE "${normalizeText(item.text)}"`);
    }
    if (normalizeText(item?.expected)) {
      lines.push(`EXPECT "${normalizeText(item.expected)}"`);
    }
  });
  if (payload.receiptKit?.artifact?.type) {
    lines.push(`KIT ${String(payload.receiptKit.artifact.type).toUpperCase()}`);
  }

  return lines;
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

function findReturnForReceipt(roomState = null, receiptKitId = "") {
  const normalizedReceiptKitId = normalizeText(receiptKitId);
  const items = Array.isArray(roomState?.returnItems) ? roomState.returnItems : [];
  return items.find((item) => normalizeText(item?.receiptKitId) === normalizedReceiptKitId) || null;
}

function findMoveForReceipt(roomState = null, receiptKitId = "") {
  const normalizedReceiptKitId = normalizeText(receiptKitId);
  const items = Array.isArray(roomState?.moveItems) ? roomState.moveItems : [];
  return items.find((item) => normalizeText(item?.receiptKitId) === normalizedReceiptKitId) || null;
}

function FieldStateChip({ fieldState }) {
  const toneClass = styles[`stateTone${String(fieldState?.tone || "new").replace(/^\w/, (char) => char.toUpperCase())}`] || styles.stateToneNew;
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

function MirrorSection({ title, caption = "", children, emptyCopy = "" }) {
  return (
    <section className={styles.mirrorSection}>
      <div className={styles.mirrorSectionHead}>
        <h3>{title}</h3>
        {caption ? <span>{caption}</span> : null}
      </div>
      {children || <FogPlaceholder>{emptyCopy}</FogPlaceholder>}
    </section>
  );
}

function MirrorPanel({ view, collapsed, onToggle }) {
  const mirror = view?.mirror || {};
  const projectKey = view?.project?.projectKey || "";

  return (
    <aside className={styles.mirror}>
      <button type="button" className={styles.mirrorHeader} onClick={onToggle}>
        <div>
          <span className={styles.eyebrow}>Box Mirror</span>
          <strong>{normalizeText(mirror?.aim?.text) || "Structure forming…"}</strong>
        </div>
        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
      </button>

      {!collapsed ? (
        <div className={styles.mirrorBody}>
          <FieldStateChip fieldState={view?.fieldState} />

          <MirrorSection title="Aim" emptyCopy="The line is still foggy. Keep it small enough for reality to answer.">
            {normalizeText(mirror?.aim?.text) ? (
              <div className={styles.mirrorPrimary}>
                <p>{mirror.aim.text}</p>
                {normalizeText(mirror?.aim?.gloss) ? <span>{mirror.aim.gloss}</span> : null}
              </div>
            ) : null}
          </MirrorSection>

          <MirrorSection
            title="Witness / Evidence"
            caption={String(Array.isArray(mirror?.evidence) ? mirror.evidence.length : 0)}
            emptyCopy="Let a source land before this hardens."
          >
            {Array.isArray(mirror?.evidence) && mirror.evidence.length ? (
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
            ) : null}
          </MirrorSection>

          <MirrorSection
            title="Story"
            caption={String(Array.isArray(mirror?.story) ? mirror.story.length : 0)}
            emptyCopy="Interpretation can wait until witness has shape."
          >
            {Array.isArray(mirror?.story) && mirror.story.length ? (
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
            ) : null}
          </MirrorSection>

          <MirrorSection
            title="Pings / Moves"
            caption={String(Array.isArray(mirror?.moves) ? mirror.moves.length : 0)}
            emptyCopy="Moves appear here once the room knows what to ask."
          >
            {Array.isArray(mirror?.moves) && mirror.moves.length ? (
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
            ) : null}
          </MirrorSection>

          <MirrorSection
            title="Returns / Receipts"
            caption={String(Array.isArray(mirror?.returns) ? mirror.returns.length : 0)}
            emptyCopy="Returns will change the room state here."
          >
            {Array.isArray(mirror?.returns) && mirror.returns.length ? (
              <div className={styles.mirrorList}>
                {mirror.returns.map((item) => (
                  <div key={item.id} className={styles.mirrorItem}>
                    <div>
                      <strong>{item.label || item.actual || "Return"}</strong>
                      {item.actual ? <span>{item.actual}</span> : null}
                    </div>
                    <span className={styles.returnResult}>{item.result || "draft"}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </MirrorSection>
        </div>
      ) : null}
    </aside>
  );
}

function StarterView({ onOpenBoxes, onOpenSource, onOpenCreateBox, projectCount = 0 }) {
  return (
    <section className={styles.starter}>
      <span className={styles.eyebrow}>Room</span>
      <h2>What are you trying to make real?</h2>
      <p>Start with a source, or say the line plainly enough that reality can answer it.</p>
      <div className={styles.inlineActions}>
        <button type="button" className={styles.primaryButton} onClick={onOpenSource}>
          Add Source
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onOpenCreateBox}>
          Create Box
        </button>
        {projectCount > 1 ? (
          <button type="button" className={styles.secondaryButton} onClick={onOpenBoxes}>
            Open Box
          </button>
        ) : null}
      </div>
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
          {busy ? "Creating…" : "Create Box"}
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
            {pending ? "Uploading…" : "Add Source"}
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
            {pending ? "Adding…" : "Add Source"}
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
            {pending ? "Capturing…" : "Capture Link"}
          </button>
        </form>
      ) : null}

      {error ? <p className={styles.errorText}>{error}</p> : null}
      {notice ? <p className={styles.noticeText}>{notice}</p> : null}
    </div>
  );
}

function normalizeLongForm(value = "") {
  return String(value || "").trim();
}

function ReturnCard({ item }) {
  if (!item) return null;

  return (
    <div className={styles.returnCard}>
      <div className={styles.returnHead}>
        <strong>Return</strong>
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
    </div>
  );
}

function ReceiptKitCard({ receiptKit, moveItem, returnItem, onComplete, busy }) {
  const artifactType = normalizeText(receiptKit?.artifact?.type).toLowerCase();
  const config = receiptKit?.artifact?.config && typeof receiptKit.artifact.config === "object"
    ? receiptKit.artifact.config
    : {};
  const checklistItems = Array.isArray(config.items) && config.items.length
    ? config.items.map((item) => normalizeText(item)).filter(Boolean)
    : normalizeText(receiptKit?.need)
      ? [normalizeText(receiptKit.need)]
      : [];
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
  const canMarkSent = artifactType !== "compare" && !moveItem && !returnItem;

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
    if (artifactType !== "upload" && artifactType !== "link" && artifactType !== "checklist" && !normalizeText(actual)) {
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
          moveText: normalizeText(messageDraft) || normalizeText(receiptKit?.fastestPath) || normalizeText(receiptKit?.need),
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
        <span className={styles.receiptType}>{getArtifactLabel(artifactType)}</span>
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
          <input
            type="file"
            onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
          />
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
        {canMarkSent ? (
          <button type="button" className={styles.secondaryButton} onClick={handleMarkSent} disabled={busy}>
            {busy ? "Holding…" : "Mark Ping Sent"}
          </button>
        ) : null}
        <button type="button" className={styles.primaryButton} onClick={handleRecordReturn} disabled={busy}>
          {busy ? "Saving…" : "Record Return"}
        </button>
      </div>

      {moveItem && !returnItem ? (
        <p className={styles.awaitingText}>The room is listening for the return.</p>
      ) : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
      {returnItem ? <ReturnCard item={returnItem} /> : null}
    </div>
  );
}

function MirrorDraftInspector({ roomPayload, onApply, busy }) {
  const draft = roomPayload?.mirrorDraft || null;
  const formalLines = buildFormalLines(roomPayload);
  const hasContent = hasMirrorDraftContent(draft);

  if (!hasContent && !roomPayload?.receiptKit) return null;

  return (
    <div className={styles.inspectPanel}>
      {hasContent ? (
        <div className={styles.inspectGrid}>
          {normalizeText(draft?.aimText) ? (
            <div className={styles.inspectBlock}>
              <span>Aim</span>
              <p>{draft.aimText}</p>
              {normalizeText(draft?.aimGloss) ? <small>{draft.aimGloss}</small> : null}
            </div>
          ) : null}

          {Array.isArray(draft?.evidenceItems) && draft.evidenceItems.length ? (
            <div className={styles.inspectBlock}>
              <span>Witness</span>
              <ul>
                {draft.evidenceItems.map((item) => (
                  <li key={item.id || item.text}>{item.text}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(draft?.storyItems) && draft.storyItems.length ? (
            <div className={styles.inspectBlock}>
              <span>Story</span>
              <ul>
                {draft.storyItems.map((item) => (
                  <li key={item.id || item.text}>{item.text}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(draft?.moveItems) && draft.moveItems.length ? (
            <div className={styles.inspectBlock}>
              <span>Move</span>
              <ul>
                {draft.moveItems.map((item) => (
                  <li key={item.id || item.text}>
                    {item.text}
                    {item.expected ? <small>{item.expected}</small> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {formalLines.length ? (
        <div className={styles.formalBlock}>
          <span className={styles.eyebrow}>Inspect</span>
          <pre>{formalLines.join("\n")}</pre>
        </div>
      ) : null}

      {hasContent ? (
        <div className={styles.inlineActions}>
          <button type="button" className={styles.primaryButton} onClick={onApply} disabled={busy}>
            {busy ? "Applying…" : "Apply to Box"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ThreadMessage({
  message,
  roomState,
  onApplyDraft,
  onCompleteReceiptKit,
  applying,
  busyReceiptKitId,
}) {
  const [inspectOpen, setInspectOpen] = useState(false);
  const roomPayload = message?.roomPayload || null;
  const receiptKit = roomPayload?.receiptKit || null;
  const moveItem = receiptKit ? findMoveForReceipt(roomState, receiptKit.id) : null;
  const returnItem = receiptKit ? findReturnForReceipt(roomState, receiptKit.id) : null;
  const paragraphs = splitParagraphs(message?.content || "");
  const isAssistant = message?.role === "assistant";

  return (
    <article className={`${styles.messageCard} ${isAssistant ? styles.messageAssistant : styles.messageUser}`}>
      <div className={styles.messageMeta}>
        <span>{isAssistant ? "Seven" : "You"}</span>
        {message?.createdAt ? <small>{String(message.createdAt).slice(0, 16).replace("T", " ")}</small> : null}
      </div>

      <div className={styles.messageBody}>
        {paragraphs.length ? paragraphs.map((paragraph, index) => <p key={`${message.id}-${index}`}>{paragraph}</p>) : <p>{message?.content}</p>}
      </div>

      {roomPayload ? (
        <div className={styles.messageActions}>
          {(hasMirrorDraftContent(roomPayload?.mirrorDraft) || receiptKit) ? (
            <button
              type="button"
              className={styles.inlineLinkButton}
              onClick={() => setInspectOpen((current) => !current)}
            >
              {inspectOpen ? "Hide draft" : "Inspect draft"}
            </button>
          ) : null}
        </div>
      ) : null}

      {inspectOpen && roomPayload ? (
        <MirrorDraftInspector
          roomPayload={roomPayload}
          onApply={() => onApplyDraft(message)}
          busy={applying}
        />
      ) : null}

      {receiptKit ? (
        <ReceiptKitCard
          receiptKit={receiptKit}
          moveItem={moveItem}
          returnItem={returnItem}
          onComplete={onCompleteReceiptKit}
          busy={busyReceiptKitId === receiptKit.id}
        />
      ) : null}
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

function Composer({ value, onChange, onSubmit, pending }) {
  return (
    <form className={styles.composer} onSubmit={onSubmit}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Say the line plainly, or ask what the room should check next."
        rows={4}
      />
      <div className={styles.composerActions}>
        <p>Plain language first. Structure only if it helps.</p>
        <button type="submit" className={styles.primaryButton} disabled={pending || !normalizeText(value)}>
          <SendHorizontal size={14} />
          {pending ? "Listening…" : "Send"}
        </button>
      </div>
    </form>
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
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [showSourceTray, setShowSourceTray] = useState(false);
  const [applyingMessageId, setApplyingMessageId] = useState("");
  const [busyReceiptKitId, setBusyReceiptKitId] = useState("");

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const projectKey = view?.project?.projectKey || "";
  const messages = Array.isArray(view?.messages) ? view.messages : [];

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
      setShowProjectPicker(false);
      setShowCreateBox(false);
      setShowSourceTray(false);
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

  async function handleApplyDraft(message) {
    const mirrorDraft = message?.roomPayload?.mirrorDraft;
    if (!hasMirrorDraftContent(mirrorDraft)) return;
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
          action: "apply_mirror_draft",
          assistantMessageId: message.id,
          mirrorDraft,
          receiptKit: message?.roomPayload?.receiptKit || null,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not apply the draft.");
      }
      setView(payload.view);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not apply the draft.");
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
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>Workspace</span>
            <h1>{view?.project?.title || "Room"}</h1>
            <p>{view?.project?.subtitle || "Calm conversation first. Structure only when it helps."}</p>
          </div>
          <div className={styles.headerActions}>
            <FieldStateChip fieldState={view?.fieldState} />
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setShowProjectPicker((current) => !current);
                setShowCreateBox(false);
              }}
            >
              <Boxes size={14} />
              Boxes
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                setShowSourceTray((current) => !current);
                setShowProjectPicker(false);
              }}
            >
              <Upload size={14} />
              Add Source
            </button>
          </div>
        </header>

        {(showProjectPicker || showCreateBox || showSourceTray) ? (
          <section className={styles.topPanels}>
            {showProjectPicker ? (
              <ProjectPicker
                projects={view?.projects}
                activeProjectKey={projectKey}
                onSelect={handleProjectSelect}
                onCreate={() => {
                  setShowCreateBox(true);
                  setShowProjectPicker(false);
                }}
              />
            ) : null}
            {showCreateBox ? (
              <CreateBoxForm onCreate={handleCreateBox} busy={actionPending} />
            ) : null}
            {showSourceTray ? (
              <SourceTray projectKey={projectKey} onComplete={handleSourceComplete} />
            ) : null}
          </section>
        ) : null}

        <ToolLinks deepLinks={view?.deepLinks} />

        {actionError ? <p className={styles.errorBanner}>{actionError}</p> : null}
        {messageError ? <p className={styles.errorBanner}>{messageError}</p> : null}

        <div className={styles.layout}>
          <div className={styles.threadColumn}>
            {view?.starter?.show ? (
              <StarterView
                projectCount={Array.isArray(view?.projects) ? view.projects.length : 0}
                onOpenBoxes={() => {
                  setShowProjectPicker(true);
                  setShowSourceTray(false);
                }}
                onOpenSource={() => {
                  setShowSourceTray(true);
                  setShowProjectPicker(false);
                }}
                onOpenCreateBox={() => {
                  setShowCreateBox(true);
                  setShowProjectPicker(false);
                }}
              />
            ) : null}

            <div className={styles.thread}>
              {messages.map((message) => (
                <ThreadMessage
                  key={message.id}
                  message={message}
                  roomState={view?.roomState}
                  onApplyDraft={handleApplyDraft}
                  onCompleteReceiptKit={handleCompleteReceiptKit}
                  applying={applyingMessageId === message.id}
                  busyReceiptKitId={busyReceiptKitId}
                />
              ))}
              {!messages.length ? (
                <div className={styles.emptyThread}>
                  <FogPlaceholder>Unresolved regions belong here until witness arrives.</FogPlaceholder>
                </div>
              ) : null}
            </div>

            <Composer
              value={composerText}
              onChange={setComposerText}
              onSubmit={handleTurnSubmit}
              pending={turnPending}
            />
          </div>

          <div className={styles.mirrorColumn}>
            <MirrorPanel
              view={view}
              collapsed={mirrorCollapsed}
              onToggle={() => setMirrorCollapsed((current) => !current)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
