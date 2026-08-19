"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { authErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";

type AuthMode = "login" | "signup";

type AuthCopy = {
  heading: string;
  description: string;
  buttonLabel: string;
  switchLink: { href: string; label: string };
};

const AUTH_COPY: Record<AuthMode, AuthCopy> = {
  login: {
    heading: "Iniciá sesión",
    description:
      "Accedé a tu historial de auditorías y seguí tu progreso de visibilidad en IA.",
    buttonLabel: "Iniciar sesión con GitHub",
    switchLink: { href: "/signup", label: "¿No tenés cuenta? Creala" },
  },
  signup: {
    heading: "Creá tu cuenta",
    description:
      "Auditá tus URLs, guardá tus reportes y seguí tu evolución en los buscadores con IA.",
    buttonLabel: "Crear cuenta con GitHub",
    switchLink: { href: "/login", label: "¿Ya tenés cuenta? Iniciá sesión" },
  },
};

/**
 * Shared GitHub OAuth card (ATH-1..ATH-5, design U2) used by /login and
 * /signup — both pages conflue in the same GitHub OAuth flow. The button
 * initiates the handshake with the callbackUrl preserved from the query
 * string (default /dashboard); a failed/denied attempt surfaces an inline
 * role="alert" error mapped by authErrorMessage.
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
    <Card className="w-full max-w-md">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-4xl tracking-tight text-navy">
          {copy.heading}
        </h1>
        <p className="text-text-secondary">{copy.description}</p>
        {error ? (
          <p
            role="alert"
            className="w-full border border-red/30 bg-red/10 px-4 py-3 text-sm text-red"
          >
            {error}
          </p>
        ) : null}
        <Button
          onClick={() => signIn("github", { callbackUrl })}
          className="w-full"
        >
          {copy.buttonLabel}
        </Button>
        <Link
          href={copy.switchLink.href}
          className="text-sm text-text-secondary underline-offset-4 hover:underline"
        >
          {copy.switchLink.label}
        </Link>
      </div>
    </Card>
  );
}
