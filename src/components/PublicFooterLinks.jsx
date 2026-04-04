"use client";

import Link from "next/link";
import { publicFooterLinks } from "@/lib/public-site";

export default function PublicFooterLinks({
  align = "center",
  className = "",
}) {
  const classes = [
    "public-footer-links",
    align === "start" ? "is-start" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={classes} aria-label="Public pages">
      {publicFooterLinks.map((page) => (
        <Link key={page.path} href={page.path} className="public-footer-links__link">
          {page.label}
        </Link>
      ))}
    </nav>
  );
}
