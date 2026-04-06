import Popover from "@/components/Popover";
import {
  SignalChip,
} from "@/components/LoegosSystem";
import RealityInstrument from "@/components/RealityInstrument";
import { PRODUCT_MARK } from "@/lib/product-language";

export default function WorkspaceControlSurface({
  viewModel,
  artifactTitle = "",
  artifactRoleLabel = "Artifact",
  artifactKindLabel = "",
  artifactBlockCount = 0,
  artifactConvergence = 0,
  artifactCanSeal = false,
  artifactBlockerCount = 0,
  isMobileLayout = false,
  onOpenBoxes,
  onOpenBoxHome,
  onOpenIntake,
  onOpenSpeak,
  onRunOperate,
  onOpenReceipts,
  onManageBox,
  onOpenConfirmation,
  instrument = null,
  onInstrumentMove,
  onOpenRoot,
}) {
  const confirmationCount = viewModel?.confirmationCount || 0;
  const hasRoot = viewModel?.hasRoot;
  const rootText = viewModel?.rootText || "";
  const stateSummary = viewModel?.stateSummary;

  return (
    <div className="instrument-bar-wrapper">
      <div className="loegos-workspace-control">
        <div className="loegos-workspace-control__topline">
          <div className="loegos-workspace-control__identity">
            <button
              type="button"
              className="loegos-workspace-control__brand"
              onClick={onOpenBoxes}
              aria-label="All boxes"
            >
              {PRODUCT_MARK}
            </button>

            <Popover
              align="start"
              trigger={
                <button
                  type="button"
                  className="loegos-workspace-control__box"
                  aria-label={`Current box: ${viewModel?.currentBoxTitle || "Untitled Box"}`}
                >
                  <span>{viewModel?.currentBoxTitle || "Untitled Box"}</span>
                  {stateSummary?.chipLabel ? (
                    <SignalChip tone={stateSummary?.tone || "neutral"} subtle>
                      {stateSummary.chipLabel}
                    </SignalChip>
                  ) : null}
                </button>
              }
            >
              <div className="assembler-popover__label">Current box</div>
              <div className="assembler-popover__item" style={{ cursor: "default" }}>
                <span>{viewModel?.currentBoxTitle || "Untitled Box"}</span>
                {stateSummary?.chipLabel ? (
                  <span
                    className="assembler-assembly-chip assembler-popover__item-meta"
                    style={{
                      "--assembly-tone": stateSummary?.colorTokens?.fill,
                      "--assembly-tone-soft": stateSummary?.colorTokens?.soft,
                      "--assembly-tone-border": stateSummary?.colorTokens?.border,
                      "--assembly-tone-glow": stateSummary?.colorTokens?.glow,
                      "--assembly-tone-text": stateSummary?.colorTokens?.text,
                    }}
                  >
                    {stateSummary.chipLabel}
                  </span>
                ) : null}
              </div>
              <div className="assembler-popover__separator" />
              <button
                type="button"
                className="assembler-popover__item"
                onClick={onOpenBoxHome}
              >
                Box overview
              </button>
              <button
                type="button"
                className="assembler-popover__item"
                onClick={onOpenBoxes}
              >
                All boxes
              </button>
              {!isMobileLayout ? (
                <button
                  type="button"
                  className="assembler-popover__item"
                  onClick={onManageBox}
                >
                  Manage box
                </button>
              ) : null}
            </Popover>
          </div>

          <div className="loegos-workspace-control__artifact">
            <span className="loegos-workspace-control__artifact-label">{artifactRoleLabel}</span>
            <strong className="loegos-workspace-control__artifact-title">
              {artifactTitle || "Untitled artifact"}
            </strong>
            <div className="loegos-workspace-control__artifact-chips">
              {artifactKindLabel ? (
                <SignalChip tone="neutral" subtle>
                  {artifactKindLabel}
                </SignalChip>
              ) : null}
              <SignalChip tone="active" subtle>
                {artifactBlockCount} block{artifactBlockCount === 1 ? "" : "s"}
              </SignalChip>
              <SignalChip
                tone={artifactCanSeal ? "clear" : artifactBlockerCount ? "alert" : "active"}
                subtle
              >
                {artifactCanSeal
                  ? "ready to seal"
                  : artifactBlockerCount
                    ? `${artifactBlockerCount} blockers`
                    : `${artifactConvergence}% convergence`}
              </SignalChip>
            </div>
          </div>

          <div className="loegos-workspace-control__utilities">
            <button
              type="button"
              className="loegos-workspace-control__utility"
              onClick={onOpenReceipts}
            >
              Receipts
            </button>
            <button
              type="button"
              className="loegos-workspace-control__utility"
              onClick={onOpenSpeak}
            >
              Speak
            </button>
            <button
              type="button"
              className="loegos-workspace-control__utility"
              onClick={onOpenIntake}
            >
              Add source
            </button>
            {!isMobileLayout ? (
              <button
                type="button"
                className="loegos-workspace-control__utility"
                onClick={onManageBox}
              >
                Manage box
              </button>
            ) : null}
          </div>
        </div>

        <div className="loegos-workspace-control__meta">
          <button
            type="button"
            className={`loegos-workspace-control__root ${hasRoot ? "" : "is-empty"}`}
            onClick={onOpenRoot}
            title={hasRoot ? rootText : "Declare the box root"}
            aria-label={hasRoot ? `Root: ${rootText}` : "Declare the box root"}
          >
            {hasRoot ? rootText : "Declare root"}
          </button>

          <div className="loegos-workspace-control__signal-row">
            <span className="loegos-workspace-control__summary">
              {stateSummary?.body || stateSummary?.label || "Continue editing the open artifact while diagnostics and build state stay beside it."}
            </span>
            {confirmationCount > 0 ? (
              <button
                type="button"
                className="loegos-workspace-control__utility"
                onClick={onOpenConfirmation}
                aria-label={`${confirmationCount} blocks waiting for confirmation`}
              >
                Confirm {confirmationCount}
              </button>
            ) : null}
            {viewModel?.canRunOperate ? (
              <button
                type="button"
                className="loegos-workspace-control__utility"
                onClick={onRunOperate}
              >
                Run Operate
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {instrument ? (
        <RealityInstrument
          viewModel={instrument}
          variant="compact"
          onMove={onInstrumentMove}
        />
      ) : null}
    </div>
  );
}
