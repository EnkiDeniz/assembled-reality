"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({ className = "", children = "Sign Out" }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      {children}
    </button>
  );
}
