import { DOCUMENT_VERSION, CHANGELOG } from "../../constants";

export default function VersionPulseBar({ versionPulse, reader, onDismiss }) {
  const lastSeen = versionPulse?.lastSeen?.[reader];
  if (lastSeen === DOCUMENT_VERSION) return null;

  // Only show when there's actually a version change to announce (not on first visit)
  if (!lastSeen) return null;

  const latestChange = CHANGELOG[CHANGELOG.length - 1];
  if (!latestChange) return null;

  return (
    <div className="max-w-[640px] mx-auto px-5">
      <div className="mt-1.5 px-3 py-1.5 bg-surface-raised border border-border rounded-[3px] flex items-center justify-between text-base text-ink-tertiary">
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm text-ink font-medium">
            v{DOCUMENT_VERSION}
          </code>
          <span>{latestChange.summary}</span>
        </div>
        <button
          onClick={() => onDismiss(DOCUMENT_VERSION)}
          className="bg-transparent border-none text-ink-muted p-1 px-2 rounded-[3px] cursor-pointer text-base min-h-7 min-w-7"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
