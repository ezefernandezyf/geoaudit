import Link from "next/link";

/**
 * Root landing page — Sprint 0 placeholder.
 * Real marketing/product UI lands in Sprint 2 (STYLE-BRIEF driven).
 * Kept minimal so the smoke test (src/app/__tests__/page.test.tsx) is stable.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">GeoAudit</h1>
      <p className="max-w-md text-center text-lg text-neutral-500">
        AI visibility audit for your website. Enter a URL and get your GEO Score.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Go to dashboard
      </Link>
    </main>
  );
}
