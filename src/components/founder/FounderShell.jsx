"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import LoegosExplainPanel from "@/components/founder/LoegosExplainPanel";
import FounderWorkbenchTree from "@/components/founder/FounderWorkbenchTree";
import LoegosRenderer from "@/components/founder/LoegosRenderer";
import FounderWitnessPane from "@/components/founder/FounderWitnessPane";

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
  witnessTitle = "",
  witnessSubtitle = "",
  witnessBlocks = [],
  selectedWitnessBlockId = "",
  onSelectWitnessBlock,
  primaryAction = null,
  secondaryAction = null,
  onOpenStarter,
  onOpenFullWorkspace,
  treeSections = [],
  assistantOpen = false,
  onToggleAssistant,
  assistant = null,
  player = null,
  findingMap = null,
  seedState = [],
  stagedBlockIds = [],
  onStageBlock,
  onUnstageBlock,
  overridePending = false,
  onCreateOverride,
  onDeleteOverride,
}) {
  const [learnerMode, setLearnerMode] = useState(false);
  const [mobileExplainOpen, setMobileExplainOpen] = useState(false);
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
  const hasWitnessBlocks = Array.isArray(witnessBlocks) && witnessBlocks.length > 0;
  const selectedBlock = useMemo(
    () =>
      (Array.isArray(blocks) ? blocks : []).find((block) => block.id === selectedBlockId) ||
      blocks[0] ||
      null,
    [blocks, selectedBlockId],
  );
  const selectedWitnessBlock = useMemo(
    () => {
      if (!selectedWitnessBlockId) return null;
      return (
        (Array.isArray(witnessBlocks) ? witnessBlocks : []).find((block) => block.id === selectedWitnessBlockId) ||
        null
      );
    },
    [selectedWitnessBlockId, witnessBlocks],
  );
  const selectedFinding = selectedBlock ? findingMap?.get?.(selectedBlock.id) || null : null;

  return (
    <section className="founder-shell" data-testid={testId}>
      <div className="founder-shell__frame" data-testid="founder-shell">
        <header className="founder-shell__header">
          <div className="founder-shell__copy">
            <div className="founder-shell__title-row">
              <span className="founder-shell__eyebrow">{artifactKind}</span>
              <h1 className="founder-shell__title">{artifactTitle || "Untitled artifact"}</h1>
            </div>
            <div className="founder-shell__meta">
              {projectTitle ? <span>{projectTitle}</span> : null}
              {artifactSubtitle ? <span>{artifactSubtitle}</span> : null}
            </div>
            {intro ? <p className="founder-shell__intro">{intro}</p> : null}
          </div>

          <div className="founder-shell__header-side">
            <div className="founder-shell__session" aria-label="Account and session">
              {onOpenStarter ? (
                <button
                  type="button"
                  className="founder-shell__quiet-action"
                  data-testid="founder-shell-open-starter"
                  onClick={onOpenStarter}
                >
                  Start with source
                </button>
              ) : null}
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
          <FounderWorkbenchTree
            projectTitle={projectTitle}
            artifactKind={artifactKind}
            artifactTitle={artifactTitle}
            sections={treeSections}
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
          />

          <div className={`founder-shell__workspace ${hasWitnessBlocks ? "is-compare" : ""}`}>
            {hasWitnessBlocks ? (
              <FounderWitnessPane
                title={witnessTitle}
                subtitle={witnessSubtitle}
                blocks={witnessBlocks}
                selectedBlockId={selectedWitnessBlock?.id || ""}
                onSelectBlock={(blockId) => {
                  onSelectWitnessBlock?.(blockId);
                  setMobileExplainOpen(true);
                }}
              />
            ) : null}

            <main className="founder-shell__artifact" data-testid="founder-shell-artifact">
              <div className="founder-shell__artifact-scroll">
                <LoegosRenderer
                  artifactKind={artifactKind}
                  blocks={hasBlocks ? blocks : []}
                  findingMap={findingMap}
                  selectedBlockId={selectedBlock?.id || ""}
                  currentBlockId={currentBlockId}
                  nextBlockId={nextBlockId}
                  learnerMode={learnerMode}
                  onToggleLearnerMode={() => setLearnerMode((value) => !value)}
                  stagedBlockIds={stagedBlockIds}
                  onStageBlock={onStageBlock}
                  onUnstageBlock={onUnstageBlock}
                  onSelectBlock={(blockId) => {
                    onSelectBlock?.(blockId);
                    setMobileExplainOpen(true);
                  }}
                  seedState={seedState}
                />
              </div>
            </main>
          </div>

          <LoegosExplainPanel
            block={selectedBlock}
            finding={selectedFinding}
            contextTitle={systemTitle}
            contextCopy={systemCopy}
            contextExcerptLabel={systemExcerptLabel}
            contextExcerpt={systemExcerpt}
            witnessBlock={selectedWitnessBlock}
            witnessTitle={witnessTitle}
            activeTitle={artifactTitle}
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
