"use client";

import { Suspense } from "react";
import { GitHubAuthCard } from "@/ui/github-auth-card";

/**
 * Custom sign-up page (ATH-2, R2/R7 delta, design U2). Sign-up and login
 * conflue in the same GitHub OAuth flow — account creation is automatic on
 * first sign-in. Gemini verbatim shell: full-height centered card (max-w-lg)
 * on a #f8fafc backdrop; the card owns the brand header, benefits list
 * (ATH-7), copy and switch link. The card reads searchParams (error +
 * callbackUrl), so it must sit inside a Suspense boundary.
 */
export default function SignupPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc]">
      <Suspense fallback={null}>
        <GitHubAuthCard mode="signup" />
      </Suspense>
    </main>
  );
}
