"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Headphones, Home, MoreHorizontal, UserRound, LogOut, Sparkles, X } from "lucide-react";
import styles from "@/components/GlobalControlMenu.module.css";

const DEFAULT_ITEMS = [
  {
    href: "/workspace",
    label: "Room",
    icon: Home,
  },
  {
    href: "/dream",
    label: "Section Dream",
    icon: Headphones,
  },
  {
    href: "/account",
    label: "Account",
    icon: UserRound,
  },
  {
    href: "/intro",
    label: "Intro",
    icon: Sparkles,
  },
];

export default function GlobalControlMenu({
  title = "Menu",
  subtitle = "Move between the Room, Section Dream, and account controls.",
  items = DEFAULT_ITEMS,
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MoreHorizontal size={18} />
      </button>

      {open ? (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <aside className={styles.panel} onClick={(event) => event.stopPropagation()}>
            <div className={styles.header}>
              <div className={styles.copy}>
                <span className={styles.kicker}>Navigation</span>
                <strong>{title}</strong>
                <p>{subtitle}</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X size={14} />
              </button>
            </div>

            <div className={styles.actions}>
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.action} ${active ? styles.actionActive : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}

              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  setOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
