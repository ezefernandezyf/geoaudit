"use client";

import { Suspense } from "react";
import { GitHubAuthCard } from "@/ui/github-auth-card";

/**
 * Custom sign-in page (ATH-1, R2/R7 delta, design U2) — replaces the default
 * NextAuth page via pages.signIn. The card reads searchParams (error +
 * callbackUrl), so it must sit inside a Suspense boundary for static
 * prerendering; this page shell only owns the design-system layout.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-6">
      <Suspense fallback={null}>
        <GitHubAuthCard mode="login" />
      </Suspense>
    </main>
  );
}
