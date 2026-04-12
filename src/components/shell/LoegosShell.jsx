"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import styles from "@/components/shell/LoegosShell.module.css";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function Surface({ children, className = "", tone = "default", roomy = false, ...props }) {
  return (
    <div
      className={joinClasses(
        styles.surface,
        tone !== "default" ? styles[`surface${tone.replace(/^\w/, (char) => char.toUpperCase())}`] : "",
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
    <span className={joinClasses(styles.kicker, styles[`tone${tone.replace(/^\w/, (char) => char.toUpperCase())}`], className)}>
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
        styles[`chip${tone.replace(/^\w/, (char) => char.toUpperCase())}`],
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

export function EchoPulse({ state = null, className = "" }) {
  const entries = Array.isArray(state?.entries) ? state.entries : [];
  const primary = state?.primary || null;
  const secondary = state?.secondary || null;

  return (
    <div
      className={joinClasses(styles.echoPulse, state?.dormant ? styles.echoPulseDormant : "", className)}
      aria-live="polite"
    >
      <div className={styles.echoPulseMeta}>
        {entries.length ? (
          entries.slice(0, 2).map((entry) => (
            <SignalChip key={entry.key} tone={entry.tone} className={styles.echoPulseChip}>
              {entry.label}
            </SignalChip>
          ))
        ) : (
          <SignalChip tone="neutral" className={styles.echoPulseChip}>
            Open
          </SignalChip>
        )}
      </div>
      <div className={styles.echoPulseCopy}>
        {primary ? <p>{primary.text}</p> : <p>Awaiting a structural shift.</p>}
        {secondary && secondary.key !== primary?.key ? (
          <small>{secondary.text}</small>
        ) : null}
      </div>
    </div>
  );
}

export function Dock({ items = [], className = "" }) {
  return (
    <nav className={joinClasses(styles.dock, className)} aria-label="Signed-in sections">
      {items.map((item) => (
        <IconButton
          key={item.id || item.label}
          icon={item.icon}
          label={item.label}
          href={item.href}
          onClick={item.onClick}
          active={item.active}
          disabled={item.disabled}
          testId={item.testId}
        />
      ))}
    </nav>
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
    <div className={styles.sectionBackdrop} onClick={onClose}>
      <aside className={styles.sectionLayer} onClick={(event) => event.stopPropagation()}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderCopy}>
            {label ? <Kicker>{label}</Kicker> : null}
            {title ? <strong>{title}</strong> : null}
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close section"
            title="Close section"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.sectionBody}>{children}</div>
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

export default function LoegosShell({
  route = "workspace",
  title = "",
  headerAccessory = null,
  main = null,
  echo = null,
  composer = null,
  dockItems = [],
  sectionLayer = null,
  overflowItems = [],
}) {
  const resolvedOverflowItems = overflowItems.length
    ? overflowItems
    : [
        { label: "Workspace", href: "/workspace" },
        { label: "Section Dream", href: "/dream" },
        { label: "Account", href: "/account" },
        {
          label: "Sign Out",
          icon: LogOut,
          onClick: () => {
            void signOut({ callbackUrl: "/" });
          },
        },
      ];

  return (
    <main className={styles.root} data-route={route}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.wordmark}>Lœgos</span>
          {title ? <span className={styles.headerTitle}>{title}</span> : null}
        </div>
        <div className={styles.headerActions}>
          {headerAccessory}
          <OverflowMenu items={resolvedOverflowItems} />
        </div>
      </div>

      <div className={styles.mainFrame}>{main || <Surface className={styles.emptyPlane} />}</div>

      <div className={styles.bottomRail}>
        <EchoPulse state={echo} />
        {composer ? <div className={styles.composerSlot}>{composer}</div> : null}
        {dockItems.length ? <Dock items={dockItems} /> : null}
      </div>

      <SectionLayer
        open={Boolean(sectionLayer?.open)}
        label={sectionLayer?.label || ""}
        title={sectionLayer?.title || ""}
        onClose={sectionLayer?.onClose}
      >
        {sectionLayer?.children || null}
      </SectionLayer>
    </main>
  );
}
