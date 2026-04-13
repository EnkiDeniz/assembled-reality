"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import {
  APP_MODES,
  buildPulseStripState,
  CONTEXT_CARD_LIFECYCLES,
  normalizeAppMode,
  sortContextCards,
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

function ModeSwitch({ mode = APP_MODES.room }) {
  return (
    <div className={styles.modeSwitch} role="tablist" aria-label="Signed-in modes">
      <Link
        href="/workspace"
        className={joinClasses(styles.modeTab, mode === APP_MODES.room ? styles.modeTabActive : "")}
        role="tab"
        aria-selected={mode === APP_MODES.room}
        data-testid="shell-mode-room"
      >
        Room
      </Link>
      <Link
        href="/dream"
        className={joinClasses(styles.modeTab, mode === APP_MODES.dream ? styles.modeTabActive : "")}
        role="tab"
        aria-selected={mode === APP_MODES.dream}
        data-testid="shell-mode-dream"
      >
        Dream
      </Link>
    </div>
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

  return (
    <button
      type="button"
      className={joinClasses(styles.pulseStrip, state?.dormant ? styles.pulseStripDormant : "", className)}
      aria-label={primary ? `Open ${primary.label} context` : "Open context"}
      onClick={onOpenCards}
      data-testid="shell-pulse-strip"
    >
      <div className={styles.pulsePrimary}>
        {primary ? (
          <>
            <Kicker tone={primary.tone}>{primary.label}</Kicker>
            <p>{primary.verdict || primary.title}</p>
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
}) {
  if (!open) return null;

  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <aside className={styles.sheetLayer} onClick={(event) => event.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHeaderCopy}>
            {label ? <Kicker>{label}</Kicker> : null}
            {title ? <strong>{title}</strong> : null}
          </div>
          <button
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
    items.push({ label: "Dream Library", href: "/dream" });
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
  contextControl = null,
  headerAccessory = null,
  main = null,
  cards = [],
  onDismissCard = null,
  pulse = null,
  echo = null,
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
  const resolvedCards = useMemo(
    () =>
      sortContextCards(cards).filter(
        (card) => card.lifecycle === CONTEXT_CARD_LIFECYCLES.active,
      ),
    [cards],
  );
  const desktopCards = resolvedCards.slice(0, 3);
  const resolvedPulse = pulse || echo?.pulse || buildPulseStripState(resolvedCards);
  const [isPulseOpen, setIsPulseOpen] = useState(false);
  const resolvedSheet = sheet || sectionLayer;
  const headerControl = contextControl || headerAccessory;
  const resolvedOverflowItems = overflowItems.length
    ? overflowItems
    : buildDefaultOverflowItems(route);

  return (
    <main className={styles.root} data-route={route} data-mode={normalizedMode}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.wordmark}>Lœgos</span>
          {title ? <span className={styles.headerTitle}>{title}</span> : null}
        </div>

        <div className={styles.headerMiddle}>
          <ModeSwitch mode={normalizedMode} />
        </div>

        <div className={styles.headerActions}>
          {headerControl}
          <OverflowMenu items={resolvedOverflowItems} />
        </div>
      </div>

      <div className={joinClasses(styles.body, desktopCards.length ? styles.bodyWithCards : "")}>
        <div className={styles.stageFrame}>{main || <Surface className={styles.emptyPlane} />}</div>
        <CardLane cards={desktopCards} onDismiss={onDismissCard} />
      </div>

      <div className={styles.bottomRail}>
        <PulseStrip state={resolvedPulse} onOpenCards={() => setIsPulseOpen(true)} />
        {composer ? <div className={styles.composerSlot}>{composer}</div> : null}
      </div>

      <SectionLayer
        open={isPulseOpen}
        label="Context"
        title={resolvedPulse?.primary?.label || "Context"}
        onClose={() => setIsPulseOpen(false)}
      >
        <div className={styles.sheetCardStack}>
          {resolvedCards.length ? (
            resolvedCards.map((card) => (
              <ContextCard
                key={card.id}
                card={card}
                compact
                defaultExpanded
                onDismiss={onDismissCard}
              />
            ))
          ) : (
            <Surface className={styles.emptyContext} roomy>
              <p>Awaiting structure.</p>
            </Surface>
          )}
        </div>
      </SectionLayer>

      <SectionLayer
        open={Boolean(resolvedSheet?.open)}
        label={resolvedSheet?.label || ""}
        title={resolvedSheet?.title || ""}
        onClose={resolvedSheet?.onClose}
      >
        {resolvedSheet?.children || null}
      </SectionLayer>
    </main>
  );
}
