"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import LoegosExplainPanel from "@/components/founder/LoegosExplainPanel";
import LoegosRenderer from "@/components/founder/LoegosRenderer";

export default function FounderShell({
  testId = "founder-shell",
  artifactKind = "Source",
  artifactTitle = "",
  artifactSubtitle = "",
  projectTitle = "",
  intro = "",
  blocks = [],
  selectedBlockId = "",
  currentBlockId = "",
  nextBlockId = "",
  onSelectBlock,
  systemTitle = "",
  systemCopy = "",
  systemExcerptLabel = "",
  systemExcerpt = "",
  primaryAction = null,
  secondaryAction = null,
  onOpenFullWorkspace,
  assistantOpen = false,
  onToggleAssistant,
  assistant = null,
  player = null,
  findingMap = null,
  seedState = [],
  overridePending = false,
  onCreateOverride,
  onDeleteOverride,
}) {
  const [learnerMode, setLearnerMode] = useState(false);
  const [mobileExplainOpen, setMobileExplainOpen] = useState(false);
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
  const selectedBlock = useMemo(
    () =>
      (Array.isArray(blocks) ? blocks : []).find((block) => block.id === selectedBlockId) ||
      blocks[0] ||
      null,
    [blocks, selectedBlockId],
  );
  const selectedFinding = selectedBlock ? findingMap?.get?.(selectedBlock.id) || null : null;

  return (
    <section className="founder-shell" data-testid={testId}>
      <div className="founder-shell__frame" data-testid="founder-shell">
        <header className="founder-shell__header">
          <div className="founder-shell__copy">
            <span className="founder-shell__eyebrow">{artifactKind}</span>
            <h1 className="founder-shell__title">{artifactTitle || "Untitled artifact"}</h1>
            {intro ? <p className="founder-shell__intro">{intro}</p> : null}
            <div className="founder-shell__meta">
              {projectTitle ? <span>{projectTitle}</span> : null}
              {artifactSubtitle ? <span>{artifactSubtitle}</span> : null}
            </div>
          </div>

          <div className="founder-shell__header-side">
            <div className="founder-shell__next-step" data-testid="founder-shell-next-step">
              <span className="founder-shell__panel-eyebrow">Next step</span>
              <strong className="founder-shell__panel-title">
                {primaryAction?.title || "Keep one honest next move visible."}
              </strong>
              {primaryAction?.detail ? (
                <p className="founder-shell__panel-copy founder-shell__next-copy">
                  {primaryAction.detail}
                </p>
              ) : null}
              <div className="founder-shell__panel-actions">
                {primaryAction?.onClick ? (
                  <button
                    type="button"
                    className="terminal-button is-primary"
                    data-testid={primaryAction.testId || undefined}
                    onClick={primaryAction.onClick}
                  >
                    {primaryAction.label || "Continue"}
                  </button>
                ) : null}
                {secondaryAction?.onClick ? (
                  <button
                    type="button"
                    className="terminal-button"
                    data-testid={secondaryAction.testId || undefined}
                    onClick={secondaryAction.onClick}
                  >
                    {secondaryAction.label}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="founder-shell__session" aria-label="Account and session">
              <button
                type="button"
                className="founder-shell__quiet-action"
                data-testid="founder-shell-open-full-workspace"
                onClick={onOpenFullWorkspace}
              >
                Open full workspace
              </button>
              <Link
                href="/account"
                className="founder-shell__session-link"
                data-testid="workspace-account-link"
              >
                Account
              </Link>
              <SignOutButton className="founder-shell__session-signout">
                Sign out
              </SignOutButton>
            </div>
          </div>
        </header>

        <div className="founder-shell__body">
          <main className="founder-shell__artifact" data-testid="founder-shell-artifact">
            <div className="founder-shell__artifact-scroll">
              <LoegosRenderer
                blocks={hasBlocks ? blocks : []}
                findingMap={findingMap}
                selectedBlockId={selectedBlock?.id || ""}
                currentBlockId={currentBlockId}
                nextBlockId={nextBlockId}
                learnerMode={learnerMode}
                onToggleLearnerMode={() => setLearnerMode((value) => !value)}
                onSelectBlock={(blockId) => {
                  onSelectBlock?.(blockId);
                  setMobileExplainOpen(true);
                }}
                seedState={seedState}
              />
            </div>
          </main>

          <LoegosExplainPanel
            block={selectedBlock}
            finding={selectedFinding}
            contextTitle={systemTitle}
            contextCopy={systemCopy}
            contextExcerptLabel={systemExcerptLabel}
            contextExcerpt={systemExcerpt}
            mobileOpen={mobileExplainOpen}
            onCloseMobile={() => setMobileExplainOpen(false)}
            overridePending={overridePending}
            onCreateOverride={onCreateOverride}
            onDeleteOverride={onDeleteOverride}
          />
        </div>

        {player ? <div className="founder-shell__player">{player}</div> : null}

        {onToggleAssistant ? (
          <div className="founder-shell__assistant-anchor">
            {!assistantOpen ? (
              <button
                type="button"
                className="founder-shell__assistant-toggle"
                data-testid="founder-shell-assistant-toggle"
                onClick={onToggleAssistant}
              >
                Ask Seven
              </button>
            ) : null}
            {assistantOpen && assistant ? (
              <div className="founder-shell__assistant-panel">{assistant}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
