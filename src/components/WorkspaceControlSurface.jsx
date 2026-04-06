import Popover from "@/components/Popover";
import {
  ShapeNav,
  SignalChip,
  VerbToolbar,
  buildLoegosNavItems,
} from "@/components/LoegosSystem";
import RealityInstrument from "@/components/RealityInstrument";
import {
  getPrimaryBoxPhaseForShape,
  getWorkspaceShapeAndVerb,
} from "@/lib/loegos-system";
import { PRODUCT_MARK } from "@/lib/product-language";

export default function WorkspaceControlSurface({
  viewModel,
  isMobileLayout = false,
  onOpenBoxes,
  onOpenBoxHome,
  onSelectPhase,
  onOpenIntake,
  onOpenSpeak,
  onOpenSeven,
  onOpenStage,
  onRunOperate,
  onOpenReceipts,
  onManageBox,
  onOpenConfirmation,
  instrument = null,
  onInstrumentMove,
  receiptAttentionTone = "",
  onOpenRoot,
}) {
  const confirmationCount = viewModel?.confirmationCount || 0;
  const hasRoot = viewModel?.hasRoot;
  const rootText = viewModel?.rootText || "";
  const stateSummary = viewModel?.stateSummary;
  const { shapeKey: activeShape, verb: activeVerb } = getWorkspaceShapeAndVerb({
    boxPhase: viewModel?.boxPhase,
  });
  const shapeItems = buildLoegosNavItems({
    activeShape,
    activeVerb,
    badges: {
      seal: receiptAttentionTone
        ? {
            label: receiptAttentionTone === "alert" ? "attention" : receiptAttentionTone,
            tone: receiptAttentionTone,
          }
        : null,
    },
  });

  function handleSelectShape(nextShape) {
    onSelectPhase?.(getPrimaryBoxPhaseForShape(nextShape));
  }

  function handleSelectVerb(nextVerb) {
    if (activeShape === "aim") {
      onOpenRoot?.();
      return;
    }

    if (activeShape === "reality") {
      if (nextVerb === "capture") {
        onOpenIntake?.();
        return;
      }
      if (nextVerb === "listen") {
        onOpenSpeak?.();
        return;
      }
      onSelectPhase?.("think");
      return;
    }

    if (activeShape === "weld") {
      if (nextVerb === "operate") {
        onSelectPhase?.("operate");
        return;
      }
      if (nextVerb === "stage") {
        onOpenStage?.();
      }
      onSelectPhase?.("create");
      return;
    }

    onOpenReceipts?.();
  }

  return (
    <div className="instrument-bar-wrapper">
      <div className="loegos-workspace-control">
        <div className="loegos-workspace-control__topline">
          <button
            type="button"
            className="loegos-workspace-control__brand"
            onClick={onOpenBoxes}
            aria-label="All boxes"
          >
            {PRODUCT_MARK}
          </button>

          <div className="loegos-workspace-control__utilities">
            {!isMobileLayout ? (
              <button
                type="button"
                className="loegos-workspace-control__utility"
                onClick={onManageBox}
              >
                Manage box
              </button>
            ) : null}
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
          </div>
        </div>

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
            Box home
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

        <ShapeNav
          items={shapeItems}
          activeShape={activeShape}
          compact
          onSelect={handleSelectShape}
        />

        <div className="loegos-workspace-control__meta">
          <button
            type="button"
            className={`loegos-workspace-control__root ${hasRoot ? "" : "is-empty"}`}
            onClick={onOpenRoot}
            title={hasRoot ? rootText : "Declare the box root"}
            aria-label={hasRoot ? `Root: ${rootText}` : "Declare the box root"}
          >
            {hasRoot ? rootText : "Declare the box root"}
          </button>

          <div className="loegos-workspace-control__signal-row">
            <span className="loegos-workspace-control__summary">
              {stateSummary?.body || stateSummary?.label || "Shape navigation keeps the room stable while the tools change."}
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

        <VerbToolbar
          shapeKey={activeShape}
          activeVerb={activeVerb}
          onSelect={handleSelectVerb}
        />
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
