"use client";

import { Suspense } from "react";
import { GitHubAuthCard } from "@/ui/github-auth-card";

/**
 * Custom sign-up page (ATH-2, R2/R7 delta, design U2). Sign-up and login
 * conflue in the same GitHub OAuth flow — account creation is automatic on
 * first sign-in. Same restyled shell as /login, signup copy + login link.
 */
export default function SignupPage() {
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
          <GitHubAuthCard mode="signup" />
        </Suspense>
      </div>
    </main>
  );
}
