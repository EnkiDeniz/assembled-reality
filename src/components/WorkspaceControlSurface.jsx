import {
  Rows3,
  Sprout,
  ScanLine,
  FileCheck,
  Plus,
  Mic,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import Popover from "@/components/Popover";
import RealityInstrument from "@/components/RealityInstrument";
import { PRODUCT_MARK } from "@/lib/product-language";

const ICON_SIZE = 16;
const ICON_STROKE = 1.7;

const MODE_ICONS = [
  { phase: "lane", icon: Rows3, label: "Assembly lane" },
  { phase: "create", icon: Sprout, label: "Seed" },
  { phase: "operate", icon: ScanLine, label: "Operate" },
  { phase: "receipts", icon: FileCheck, label: "Receipts" },
];

function InstrumentSeparator() {
  return <span className="instrument-bar__separator" aria-hidden="true" />;
}

export default function WorkspaceControlSurface({
  viewModel,
  isMobileLayout = false,
  onOpenBoxes,
  onOpenBoxHome,
  onSelectPhase,
  onOpenIntake,
  onOpenSpeak,
  onManageBox,
  onOpenConfirmation,
  instrument = null,
  onInstrumentMove,
  receiptAttentionTone = "",
  onOpenRoot,
}) {
  const stateTokens = viewModel?.stateColorTokens || {};
  const confirmationCount = viewModel?.confirmationCount || 0;
  const hasRoot = viewModel?.hasRoot;
  const rootText = viewModel?.rootText || "";
  const stateSummary = viewModel?.stateSummary;

  return (
    <div className="instrument-bar-wrapper">
      <div className={`instrument-bar ${isMobileLayout ? "is-mobile" : ""}`}>
        {/* Product mark */}
        <button
          type="button"
          className="instrument-bar__mark"
          onClick={onOpenBoxes}
          aria-label="All boxes"
        >
          {PRODUCT_MARK}
        </button>

        {/* Box selector pill */}
        <Popover
          align="start"
          trigger={
            <button
              type="button"
              className="instrument-bar__box-pill"
              aria-label={`Current box: ${viewModel?.currentBoxTitle || "Untitled Box"}`}
            >
              <span
                className="instrument-bar__box-dot"
                aria-hidden="true"
                style={{
                  "--assembly-tone": stateTokens.fill,
                  "--assembly-tone-border": stateTokens.border,
                  "--assembly-tone-glow": stateTokens.glow,
                }}
              />
              <span className="instrument-bar__box-name">
                {viewModel?.currentBoxTitle || "Untitled Box"}
              </span>
              <ChevronDown size={12} strokeWidth={ICON_STROKE} />
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

        <InstrumentSeparator />

        {/* Mode icons */}
        <div className="instrument-bar__modes">
          {MODE_ICONS.map((mode) => {
            const Icon = mode.icon;
            const active = viewModel?.boxPhase === mode.phase;
            const showAlert =
              mode.phase === "receipts" && receiptAttentionTone;
            return (
              <button
                key={mode.phase}
                type="button"
                className={`instrument-bar__icon-button ${active ? "is-active" : ""}`}
                onClick={() => onSelectPhase(mode.phase)}
                title={mode.label}
                aria-label={mode.label}
              >
                <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                {showAlert ? (
                  <span
                    className={`instrument-bar__alert is-${receiptAttentionTone}`}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Inline root summary */}
        <button
          type="button"
          className={`instrument-bar__root ${hasRoot ? "" : "is-empty"}`}
          onClick={onOpenRoot}
          title={hasRoot ? rootText : "Name box"}
          aria-label={hasRoot ? `Root: ${rootText}` : "Name box"}
        >
          {hasRoot ? rootText : "Name box"}
        </button>

        <InstrumentSeparator />

        {/* Action icons */}
        <div className="instrument-bar__actions">
          <button
            type="button"
            className="instrument-bar__icon-button is-primary"
            onClick={onOpenIntake}
            title="Add source"
            aria-label="Add source"
          >
            <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </button>
          <button
            type="button"
            className="instrument-bar__icon-button"
            onClick={onOpenSpeak}
            title="Speak"
            aria-label="Speak"
          >
            <Mic size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </button>
          {!isMobileLayout ? (
            <button
              type="button"
              className="instrument-bar__icon-button"
              onClick={onManageBox}
              title="Box settings"
              aria-label="Box settings"
            >
              <SlidersHorizontal size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </button>
          ) : null}
        </div>

        {/* Confirmation badge */}
        {confirmationCount > 0 ? (
          <button
            type="button"
            className={`instrument-bar__badge ${stateSummary?.isLooping ? "is-looping" : ""}`}
            onClick={onOpenConfirmation}
            aria-label={`${confirmationCount} blocks waiting for confirmation`}
          >
            ⊘ {confirmationCount}
          </button>
        ) : null}
      </div>

      {/* Reality Instrument — still below the bar */}
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
