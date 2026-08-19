"use client";

import { Suspense } from "react";
import { GitHubAuthCard } from "@/ui/github-auth-card";

/**
 * Custom sign-up page (ATH-2, R2/R7 delta, design U2). Sign-up and login
 * conflue in the same GitHub OAuth flow — account creation is automatic on
 * first sign-in. Same layout/shape as /login, signup copy + login link.
 */
export default function SignupPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-6">
      <Suspense fallback={null}>
        <GitHubAuthCard mode="signup" />
      </Suspense>
    </main>
  );
}
