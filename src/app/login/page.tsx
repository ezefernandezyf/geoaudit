"use client";

import { Suspense } from "react";
import { GitHubAuthCard } from "@/ui/github-auth-card";

/**
 * Custom sign-in page (ATH-1, R2/R7 delta, design U2) — replaces the default
 * NextAuth page via pages.signIn. Gemini verbatim shell: full-height centered
 * card on a #f8fafc backdrop; the card owns the brand mark, copy and switch
 * link. The card reads searchParams (error + callbackUrl), so it must sit
 * inside a Suspense boundary for static prerendering.
 */
export default function LoginPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc]">
      <Suspense fallback={null}>
        <GitHubAuthCard mode="login" />
      </Suspense>
    </main>
  );
}
