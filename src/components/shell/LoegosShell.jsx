"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, MoreHorizontal, PanelLeft, X } from "lucide-react";
import {
  APP_MODES,
  CONTEXT_CARD_LIFECYCLES,
  normalizeAppMode,
} from "@/lib/loegos-shell";
import styles from "@/components/shell/LoegosShell.module.css";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function capitalize(value = "") {
  return String(value || "").replace(/^\w/, (char) => char.toUpperCase());
}

export function Surface({ children, className = "", tone = "default", roomy = false, ...props }) {
  return (
    <div
      className={joinClasses(
        styles.surface,
        tone !== "default" ? styles[`surface${capitalize(tone)}`] : "",
        roomy ? styles.surfaceRoomy : "",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Kicker({ children, tone = "neutral", className = "" }) {
  return (
    <span className={joinClasses(styles.kicker, styles[`tone${capitalize(tone)}`], className)}>
      {children}
    </span>
  );
}

export function SignalChip({ children, tone = "neutral", className = "", ...props }) {
  if (!children) return null;
  return (
    <span
      className={joinClasses(
        styles.signalChip,
        styles[`chip${capitalize(tone)}`],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function IconButton({
  icon,
  label,
  active = false,
  href = "",
  onClick,
  disabled = false,
  className = "",
  testId = "",
}) {
  const Glyph = icon || MoreHorizontal;
  const classes = joinClasses(
    styles.iconButton,
    active ? styles.iconButtonActive : "",
    disabled ? styles.iconButtonDisabled : "",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label} title={label} data-testid={testId || undefined}>
        <Glyph size={18} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      data-testid={testId || undefined}
    >
      <Glyph size={18} aria-hidden="true" />
    </button>
  );
}

function ModeSwitch({ mode = APP_MODES.room, className = "" }) {
  return (
    <nav className={joinClasses(styles.modeSwitch, className)} aria-label="Signed-in sections">
      <Link
        href="/workspace"
        className={joinClasses(styles.modeTab, mode === APP_MODES.room ? styles.modeTabActive : "")}
        aria-current={mode === APP_MODES.room ? "page" : undefined}
        data-testid="shell-mode-room"
      >
        Room
      </Link>
      <Link
        href="/dream"
        className={joinClasses(styles.modeTab, mode === APP_MODES.dream ? styles.modeTabActive : "")}
        aria-current={mode === APP_MODES.dream ? "page" : undefined}
        data-testid="shell-mode-dream"
      >
        Library
      </Link>
    </nav>
  );
}

function ContextCardAction({ action }) {
  if (!action) return null;
  if (action.href) {
    return (
      <Link
        href={action.href}
        className={styles.cardAction}
        onClick={(event) => event.stopPropagation()}
      >
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={styles.cardAction}
      onClick={(event) => {
        event.stopPropagation();
        action.onClick?.();
      }}
    >
      {action.label}
    </button>
  );
}

export function ContextCard({
  card,
  compact = false,
  onDismiss = null,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (!card) return null;
  const canExpand = Boolean(card.detail || card.meta?.length || card.actions?.length);
  const front = (
    <>
      <div className={styles.contextCardHead}>
        <div className={styles.contextCardMeta}>
          <Kicker tone={card.tone}>{card.label}</Kicker>
          {card.lifecycle !== CONTEXT_CARD_LIFECYCLES.active ? (
            <SignalChip tone="neutral">{card.lifecycle}</SignalChip>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            className={styles.cardDismiss}
            aria-label={`Dismiss ${card.label}`}
            title={`Dismiss ${card.label}`}
            onClick={(event) => {
              event.stopPropagation();
              onDismiss(card);
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className={styles.contextCardBody}>
        <strong>{card.title || card.verdict || card.label}</strong>
        {card.verdict ? <p>{card.verdict}</p> : null}
      </div>
    </>
  );

  return (
    <Surface
      tone={card.tone === "neutral" ? "raised" : card.tone}
      className={joinClasses(styles.contextCard, compact ? styles.contextCardCompact : "")}
    >
      <div
        className={joinClasses(
          styles.contextCardFront,
          styles[`contextCardTint${capitalize(card.tone)}`],
          canExpand ? styles.contextCardFrontInteractive : "",
        )}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        onClick={canExpand ? () => setExpanded((current) => !current) : undefined}
        onKeyDown={
          canExpand
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setExpanded((current) => !current);
                }
              }
            : undefined
        }
      >
        {front}
      </div>

      {expanded ? (
        <div className={styles.contextCardBack}>
          {card.detail ? (
            <div className={styles.contextCardEvidence}>
              <Kicker tone="neutral">Evidence</Kicker>
              <small>{card.detail}</small>
            </div>
          ) : null}
          {card.meta?.length ? (
            <div className={styles.contextCardFoot}>
              {card.meta.slice(0, compact ? 1 : 3).map((item) => (
                <SignalChip key={item} tone="neutral">
                  {item}
                </SignalChip>
              ))}
            </div>
          ) : null}
          {card.actions?.length ? (
            <div className={styles.contextCardActions}>
              {card.actions.slice(0, compact ? 1 : 2).map((action) => (
                <ContextCardAction key={action.label} action={action} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!canExpand && card.detail ? (
        <div className={styles.contextCardBackStatic}>
          <small>{card.detail}</small>
        </div>
      ) : null}
      {!canExpand && onDismiss ? (
        <div className={styles.contextCardDismissRow}>
          <button
            type="button"
            className={styles.cardDismiss}
            aria-label={`Dismiss ${card.label}`}
            title={`Dismiss ${card.label}`}
            onClick={() => onDismiss(card)}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </Surface>
  );
}

export function PulseStrip({ state = null, onOpenCards, className = "" }) {
  const primary = state?.primary || null;
  const secondaryCards = Array.isArray(state?.secondaryCards) ? state.secondaryCards : [];
  const overflowCount = Number(state?.overflowCount || 0);
  const field = state?.field || null;
  const reasonLine = state?.reasonLine || null;

  return (
    <button
      type="button"
      className={joinClasses(styles.pulseStrip, state?.dormant ? styles.pulseStripDormant : "", className)}
      aria-label={primary ? `Open ${primary.label} context` : "Open context"}
      onClick={onOpenCards}
      data-testid="shell-pulse-strip"
    >
      {field?.label ? (
        <div className={styles.pulseHead}>
          <SignalChip tone={field.tone || "neutral"}>{field.label}</SignalChip>
        </div>
      ) : null}

      <div className={styles.pulsePrimary}>
        {primary ? (
          <>
            <Kicker tone={primary.tone}>{primary.label}</Kicker>
            <p>{primary.verdict || primary.title}</p>
            {reasonLine?.text ? (
              <small className={styles.pulseReason}>
                {reasonLine.label}: {reasonLine.text}
              </small>
            ) : null}
          </>
        ) : (
          <>
            <Kicker tone="neutral">Pulse</Kicker>
            <p>Awaiting structure.</p>
          </>
        )}
      </div>

      <div className={styles.pulseSecondary}>
        {secondaryCards.map((card) => (
          <SignalChip key={card.id} tone={card.tone}>
            {card.label}
          </SignalChip>
        ))}
        {overflowCount > 0 ? <SignalChip tone="neutral">+{overflowCount}</SignalChip> : null}
      </div>
    </button>
  );
}

export function CardLane({ cards = [], onDismiss = null }) {
  if (!cards.length) return null;

  return (
    <aside className={styles.cardRail} aria-label="Contextual cards">
      {cards.map((card) => (
        <ContextCard key={card.id} card={card} onDismiss={onDismiss} />
      ))}
    </aside>
  );
}

export function SectionLayer({
  open = false,
  label = "",
  title = "",
  onClose,
  children = null,
  variant = "sheet",
}) {
  const titleId = useId();
  const closeButtonRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const layer = layerRef.current;
    const previousActiveElement =
      typeof document !== "undefined" ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    document.body.style.overflow = "hidden";

    function getFocusableElements() {
      if (!layer) return [];
      return Array.from(
        layer.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => {
        if (!(element instanceof HTMLElement)) return false;
        return !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden");
      });
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || !layer?.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last || !layer?.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousActiveElement && typeof previousActiveElement.focus === "function") {
        previousActiveElement.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={joinClasses(
        styles.sheetBackdrop,
        variant === "drawer" ? styles.drawerBackdrop : "",
        variant === "takeover" ? styles.takeoverBackdrop : "",
      )}
      onClick={onClose}
    >
      <aside
        ref={layerRef}
        className={joinClasses(
          styles.sheetLayer,
          variant === "drawer" ? styles.drawerLayer : "",
          variant === "takeover" ? styles.takeoverLayer : "",
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHeaderCopy}>
            {label ? <Kicker>{label}</Kicker> : null}
            {title ? <strong id={titleId}>{title}</strong> : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close sheet"
            title="Close sheet"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.sheetBody}>{children}</div>
      </aside>
    </div>
  );
}

function OverflowMenu({ items = [] }) {
  const [open, setOpen] = useState(false);

  if (!items.length) return null;

  return (
    <div className={styles.overflow}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="Open shell menu"
        title="Open shell menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>

      {open ? (
        <div className={styles.overflowMenu}>
          {items.map((item) => {
            const Icon = item.icon || MoreHorizontal;
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={styles.overflowItem}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                className={styles.overflowItem}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function buildDefaultOverflowItems(route = "workspace") {
  const items = [];

  if (route !== "account") {
    items.push({ label: "Account", href: "/account" });
  } else {
    items.push({ label: "Room", href: "/workspace" });
    items.push({ label: "Library", href: "/dream" });
  }

  items.push({
    label: "Sign Out",
    icon: LogOut,
    onClick: () => {
      void signOut({ callbackUrl: "/" });
    },
  });

  return items;
}

export default function LoegosShell({
  route = "workspace",
  mode = "",
  title = "",
  lensLabel = "",
  workspaceLabel = "Personal",
  scopeControl = null,
  rail = null,
  focusMode = false,
  contextControl = null,
  headerAccessory = null,
  main = null,
  composer = null,
  sheet = null,
  sectionLayer = null,
  overflowItems = [],
}) {
  const resolvedMode =
    mode ||
    (route === "dream"
      ? APP_MODES.dream
      : APP_MODES.room);
  const normalizedMode = normalizeAppMode(resolvedMode);
  const resolvedSheet = sheet || sectionLayer;
  const sheetOpen = Boolean(resolvedSheet?.open);
  const headerControl = contextControl || headerAccessory;
  const resolvedOverflowItems = overflowItems.length
    ? overflowItems
    : buildDefaultOverflowItems(route);
  const defaultLensLabel = normalizedMode === APP_MODES.dream ? "Library" : "Room";
  const resolvedTitle = title || lensLabel || defaultLensLabel;
  const hasRail = Boolean(rail);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const effectiveRailCollapsed = Boolean(focusMode || railCollapsed);
  const overlayOpen = Boolean(sheetOpen || mobileDrawerOpen);

  useEffect(() => {
    if (!sheetOpen) return;
    const frame = window.requestAnimationFrame(() => {
      setMobileDrawerOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [sheetOpen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMobileDrawerOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [route]);

  const drawerContent = (
    <div className={styles.drawerStack}>
      <div className={styles.drawerIdentity}>
        <span className={styles.wordmark}>Lœgos</span>
        <span className={styles.railWorkspace}>{workspaceLabel}</span>
      </div>

      <div className={styles.drawerLens}>
        <Kicker tone="neutral">Current lens</Kicker>
        <strong>{resolvedTitle}</strong>
      </div>

      <ModeSwitch mode={normalizedMode} className={styles.drawerModeSwitch} />

      {scopeControl ? (
        <div className={styles.drawerScope}>
          <Kicker tone="neutral">Current scope</Kicker>
          <div className={styles.drawerScopeSlot}>{scopeControl}</div>
        </div>
      ) : null}

      {rail ? (
        <div
          className={styles.drawerSection}
          onClickCapture={(event) => {
            if (event.target instanceof Element && event.target.closest("a,button")) {
              setMobileDrawerOpen(false);
            }
          }}
        >
          {rail}
        </div>
      ) : null}

      {resolvedOverflowItems.length ? (
        <div className={styles.drawerUtilityList}>
          <Kicker tone="neutral">Utilities</Kicker>
          <div className={styles.drawerUtilityItems}>
            {resolvedOverflowItems.map((item) => {
              const Icon = item.icon || MoreHorizontal;
              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={styles.drawerUtilityItem}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  className={styles.drawerUtilityItem}
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    item.onClick?.();
                  }}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <main
      className={joinClasses(
        styles.root,
        hasRail ? styles.rootWithRail : "",
        hasRail && effectiveRailCollapsed ? styles.rootRailCollapsed : "",
      )}
      data-route={route}
      data-mode={normalizedMode}
    >
      {hasRail ? (
        <aside
          className={styles.rail}
          inert={overlayOpen ? true : undefined}
          aria-hidden={overlayOpen ? "true" : undefined}
        >
          <div className={styles.railHeader}>
            <span className={styles.wordmark}>Lœgos</span>
            <span className={styles.railWorkspace}>{workspaceLabel}</span>
          </div>
          <ModeSwitch mode={normalizedMode} className={styles.railModeSwitch} />
          <div className={styles.railBody}>{rail}</div>
        </aside>
      ) : null}

      <div className={styles.shellMain}>
        <div
          className={styles.topBar}
          inert={overlayOpen ? true : undefined}
          aria-hidden={overlayOpen ? "true" : undefined}
        >
          <button
            type="button"
            className={styles.mobileShellTrigger}
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open navigation"
            title="Open navigation"
            data-testid="shell-mobile-drawer-trigger"
          >
            □
          </button>

          <div className={styles.topBarIdentity}>
            {hasRail ? (
              <button
                type="button"
                className={styles.utilityButton}
                onClick={() => setRailCollapsed((current) => !current)}
                aria-label={effectiveRailCollapsed ? "Show navigation lists" : "Hide navigation lists"}
                title={effectiveRailCollapsed ? "Show navigation lists" : "Hide navigation lists"}
                data-testid="shell-rail-toggle"
              >
                <PanelLeft size={16} aria-hidden="true" />
                <span>{effectiveRailCollapsed ? "Show lists" : "Hide lists"}</span>
              </button>
            ) : null}
            <div className={styles.topBarTitle}>
              <strong>{resolvedTitle}</strong>
            </div>
            {!hasRail ? <span className={styles.workspaceBadge}>{workspaceLabel}</span> : null}
          </div>

          <div className={styles.topBarActions}>
            {scopeControl ? <div className={styles.scopeSlot}>{scopeControl}</div> : null}
            {headerControl || null}
            <OverflowMenu items={resolvedOverflowItems} />
          </div>
        </div>

        <div
          className={styles.body}
          inert={overlayOpen ? true : undefined}
          aria-hidden={overlayOpen ? "true" : undefined}
        >
          <div className={styles.stageFrame}>{main || <Surface className={styles.emptyPlane} />}</div>
        </div>

        <div
          className={styles.bottomRail}
          inert={overlayOpen ? true : undefined}
          aria-hidden={overlayOpen ? "true" : undefined}
        >
          {composer ? <div className={styles.composerSlot}>{composer}</div> : null}
        </div>
      </div>

      <SectionLayer
        open={mobileDrawerOpen}
        label="Shell"
        title={workspaceLabel}
        onClose={() => setMobileDrawerOpen(false)}
        variant="drawer"
      >
        {drawerContent}
      </SectionLayer>

      <SectionLayer
        open={Boolean(resolvedSheet?.open)}
        label={resolvedSheet?.label || ""}
        title={resolvedSheet?.title || ""}
        onClose={resolvedSheet?.onClose}
        variant={resolvedSheet?.variant || "sheet"}
      >
        {resolvedSheet?.children || null}
      </SectionLayer>
    </main>
  );
}
