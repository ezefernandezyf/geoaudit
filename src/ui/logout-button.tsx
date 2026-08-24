"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

/**
 * LogoutButton (SHL-3, U1.9): client island that signs the user out. Rendered
 * by the server Navbar; kept client because `signOut` from next-auth/react
 * needs the browser. Gemini hex styling.
 */
export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      aria-label="Cierra sesión"
      title="Cierra sesión"
      className="inline-flex items-center rounded-md p-2 text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
