import { auth } from "@/lib/auth";

/**
 * Dashboard placeholder — Sprint 0 (auth-github R3).
 * Guarded by src/middleware.ts; real product UI lands in Sprint 2.
 */
export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      {session?.user ? (
        <p className="text-neutral-500">
          Signed in as {session.user.name ?? session.user.email}
        </p>
      ) : null}
    </main>
  );
}
