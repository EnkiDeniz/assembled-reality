import { SECTIONS } from "../../constants";
import { isConnected } from "../../api/getreceipts";
import { composeReceipt, downloadMarkdownEvidence } from "../../utils/receiptComposer";
import useMediaQuery from "../../hooks/useMediaQuery";

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function getSectionMeta(id) {
  return SECTIONS.find(s => s.id === id) || { num: "?", title: id };
}

export default function ReceiptPanel({ session, duration, actionCounts, uniqueSections, onClose, onSave }) {
  const isDesktop = useMediaQuery("(min-width: 769px)");
  const connected = isConnected();
  const receipt = session ? composeReceipt(session) : null;

  // Section dwell times
  const sectionDurations = {};
  if (session) {
    for (const s of session.sections) {
      const end = s.leftAt || Date.now();
      const dur = (end - s.enteredAt) / 1000;
      sectionDurations[s.id] = (sectionDurations[s.id] || 0) + dur;
    }
  }

  const uniqueSectionIds = uniqueSections.map(s => s.id);
  const totalActions = Object.values(actionCounts).reduce((s, n) => s + n, 0);

  return (
    <>
      {!isDesktop && <div onClick={onClose} className="fixed inset-0 z-85 bg-black/8" />}
      <div
        className={`fixed top-10 right-0 bottom-0 bg-surface overflow-y-auto overscroll-contain
          w-full md:w-[300px] z-90 md:z-50
          border-l-0 md:border-l md:border-border
          p-3 px-4 md:px-3.5
          ${!isDesktop ? "animate-slide-right" : ""}`}
      >
        {!isDesktop && (
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="bg-transparent border border-border rounded-[3px] px-3.5 py-1.5 text-base font-medium text-ink-tertiary cursor-pointer">
              Close
            </button>
          </div>
        )}

        {/* Session timer */}
        <div className="mb-3 pb-3 border-b border-border">
          <div className="text-xs font-semibold tracking-[0.06em] uppercase text-ink-muted mb-1">Current Session</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-ink">{formatDuration(duration)}</span>
            <span className="text-sm text-ink-muted">active reading</span>
          </div>
        </div>

        {/* Sections visited */}
        <div className="mb-3 pb-3 border-b border-border">
          <div className="text-xs font-semibold tracking-[0.06em] uppercase text-ink-muted mb-1.5">
            Sections Visited <span className="font-normal text-ink-faint">({uniqueSectionIds.length}/{SECTIONS.length})</span>
          </div>
          {uniqueSectionIds.length === 0 ? (
            <div className="text-sm text-ink-faint">No sections visited yet</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {uniqueSectionIds.map(id => {
                const meta = getSectionMeta(id);
                const dur = sectionDurations[id] || 0;
                return (
                  <div key={id} className="flex justify-between items-center text-sm py-0.5">
                    <span className="text-ink-secondary">
                      <span className="font-mono text-xs text-ink-faint mr-1">{meta.num}</span>
                      {meta.title}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">{formatDuration(Math.round(dur))}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action counts */}
        <div className="mb-3 pb-3 border-b border-border">
          <div className="text-xs font-semibold tracking-[0.06em] uppercase text-ink-muted mb-1.5">
            Actions <span className="font-normal text-ink-faint">({totalActions})</span>
          </div>
          {totalActions === 0 ? (
            <div className="text-sm text-ink-faint">No actions yet — try selecting text or signaling a section</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
              {actionCounts.signals > 0 && <ActionRow label="Signals" count={actionCounts.signals} icon="△" />}
              {actionCounts.highlights > 0 && <ActionRow label="Highlights" count={actionCounts.highlights} icon="✦" />}
              {actionCounts.annotations > 0 && <ActionRow label="Annotations" count={actionCounts.annotations} icon="💬" />}
              {actionCounts.carries > 0 && <ActionRow label="Carried" count={actionCounts.carries} icon="≡" />}
              {actionCounts.comments > 0 && <ActionRow label="Comments" count={actionCounts.comments} icon="◇" />}
              {actionCounts.statusTags > 0 && <ActionRow label="Tags" count={actionCounts.statusTags} icon="▪" />}
              {actionCounts.reactions > 0 && <ActionRow label="Reactions" count={actionCounts.reactions} icon="🎯" />}
            </div>
          )}
        </div>

        {/* Receipt preview */}
        {receipt && totalActions > 0 && (
          <div className="mb-3 pb-3 border-b border-border">
            <div className="text-xs font-semibold tracking-[0.06em] uppercase text-ink-muted mb-1.5">Receipt Preview</div>
            <div className="p-2.5 bg-surface-raised border border-border rounded-[3px] text-sm">
              <div className="text-ink-secondary mb-1"><strong>Aim:</strong> {receipt.aim}</div>
              <div className="text-ink-secondary mb-1"><strong>Tried:</strong> {receipt.tried}</div>
              <div className="text-ink-secondary"><strong>Outcome:</strong> {receipt.outcome}</div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => session && downloadMarkdownEvidence(session)}
            disabled={!session || totalActions === 0}
            className="w-full px-3 py-2 text-sm font-medium border border-border rounded-[3px] cursor-pointer bg-transparent text-ink-secondary hover:bg-surface-raised disabled:opacity-40 disabled:cursor-default transition-all duration-100"
          >
            Export as Markdown
          </button>
          <button
            onClick={() => connected && onSave && onSave(receipt)}
            disabled={!connected}
            className="w-full px-3 py-2 text-sm font-medium rounded-[3px] cursor-pointer transition-all duration-100 bg-ink text-white border border-ink disabled:opacity-30 disabled:cursor-default"
          >
            Save to GetReceipts
          </button>
          {!connected && (
            <div className="text-xs text-ink-faint text-center mt-0.5">
              Connect GetReceipts to save receipts
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ActionRow({ label, count, icon }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-tertiary">
        <span className="mr-1">{icon}</span>{label}
      </span>
      <span className="font-mono text-ink font-medium">{count}</span>
    </div>
  );
}
