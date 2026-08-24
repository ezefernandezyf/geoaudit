"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

/**
 * LogoutButton (SHL-3, DNF-10): client component that signs the user out.
 * Rendered by the server Navbar; kept client because `signOut` from
 * next-auth/react needs the browser.
 */
export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className="inline-flex items-center gap-2 rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
