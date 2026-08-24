"use client";

import { Suspense } from "react";
import { GitHubAuthCard } from "@/ui/github-auth-card";

/**
 * Custom sign-in page (ATH-1, R2/R7 delta, design U2) — replaces the default
 * NextAuth page via pages.signIn. The card reads searchParams (error +
 * callbackUrl), so it must sit inside a Suspense boundary for static
 * prerendering; this page shell owns the restyled design-system layout with
 * the brand mark.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-surface-muted px-6 py-12">
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy font-display text-2xl font-bold text-white"
          >
            G
          </span>
          <span className="font-display text-2xl tracking-tight text-navy">
            GeoAudit
          </span>
        </div>
        <Suspense fallback={null}>
          <GitHubAuthCard mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
