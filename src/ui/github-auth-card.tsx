"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Check } from "lucide-react";
import { authErrorMessage } from "@/lib/auth-errors";
import { AUTH_COPY } from "@/lib/copy";
import { Logo } from "@/ui/logo";

type AuthMode = "login" | "signup";

/**
 * Shared GitHub OAuth card (ATH-1..ATH-9, design U2) used by /login and
 * /signup — both pages conflue in the same GitHub OAuth flow. Gemini verbatim:
 * centered white card (direct hex), serif heading, brand mark, "Continuar con
 * GitHub" button with the GitHub glyph (ATH-8), terms note, and a prompt +
 * switch link. Signup mode adds the benefits list (ATH-7).
 *
 * The button initiates the handshake with the callbackUrl preserved from the
 * query string (default /dashboard); a failed/denied attempt surfaces an
 * inline role="alert" error mapped by authErrorMessage (ATH-5, neutral copy).
 *
 * Client component: it must read searchParams (NextAuth redirects back to
 * /login?error=...) and call the client-side signIn.
 */
export function GitHubAuthCard({ mode }: { mode: AuthMode }) {
  const params = useSearchParams();
  const copy = AUTH_COPY[mode];
  const error = authErrorMessage(params.get("error"));
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  return (
    <div
      className={`w-full ${mode === "signup" ? "max-w-lg" : "max-w-md"} bg-white p-8 sm:p-10 rounded-2xl border border-[#e2e8f0] shadow-sm ${mode === "login" ? "text-center" : ""}`}
    >
      {mode === "signup" ? (
        <div className="flex items-center gap-3 mb-6">
          <Logo size={40} />
          <span className="text-[11px] font-mono text-[#64748b]">
            Crea tu cuenta de desarrollador / marketer
          </span>
        </div>
      ) : (
        <Logo size={48} showWordmark={false} className="mx-auto mb-4" />
      )}

      <h1
        className={`font-serif text-[#0f172a] font-normal mb-2 ${mode === "signup" ? "text-2xl sm:text-3xl" : "text-3xl"}`}
      >
        {copy.heading}
      </h1>

      <p
        className={`text-sm text-[#475569] font-sans ${mode === "signup" ? "mb-6" : "mb-8"}`}
      >
        {copy.description}
      </p>

      {error ? (
        <div
          role="alert"
          className="mb-6 p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-left text-xs font-sans text-[#b91c1c] flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error de autenticación</p>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      {mode === "signup" && copy.benefits ? (
        <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] mb-6 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0f172a] mb-2 font-mono">
            {copy.benefits.label}
          </p>
          {copy.benefits.items.map((item) => (
            <div
              key={item}
              className="flex items-start gap-2.5 text-xs text-[#475569] font-sans"
            >
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        <button
          onClick={() => signIn("github", { callbackUrl })}
          className="w-full h-12 bg-[#0f172a] hover:bg-[#1e293b] active:bg-[#0f172a] text-white text-sm font-semibold rounded-md flex items-center justify-center gap-3 transition-all duration-150 shadow-xs select-none disabled:opacity-60 active:scale-[0.98] cursor-pointer"
        >
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>{copy.buttonLabel}</span>
        </button>

        <p className="text-xs text-[#64748b] leading-relaxed">
          {copy.termsNote}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-[#e2e8f0]">
        <p className="text-xs text-[#475569]">
          {copy.switchPrompt}{" "}
          <Link
            href={copy.switchLink.href}
            className="text-[#0f172a] font-semibold hover:underline"
          >
            {copy.switchLink.label}
          </Link>
        </p>
      </div>
    </div>
  );
}
