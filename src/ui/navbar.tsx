import Link from "next/link";
import type { Session } from "next-auth";
import { LogoutButton } from "@/ui/logout-button";

type NavbarProps = {
  /** Auth session resolved by the layout via `auth()` (SHL-3). Optional for anon. */
  session?: Session | null;
};

/**
 * Navbar (SHL-1/2/3, DNF-10): global responsive navigation. Server component
 * that renders the anonymous or authenticated action set based on the session
 * resolved in the layout. Icons come from lucide-react.
 */
export function Navbar({ session }: NavbarProps) {
  const user = session?.user;
  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="GeoAudit Inicio"
            className="flex items-center gap-3 text-left"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-navy font-display text-lg font-bold text-white"
            >
              G
            </span>
            <span className="hidden flex-col sm:flex">
              <span className="font-display text-xl leading-none tracking-tight text-text-primary">
                GeoAudit
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
                AI Visibility Audit
              </span>
            </span>
          </Link>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-1.5 md:flex"
          >
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
            >
              Producto
            </Link>
            <Link
              href="/pricing"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
            >
              Precios
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                title={`Sesión iniciada como ${user.name ?? user.email ?? ""}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface p-1 pr-3 transition-colors hover:bg-surface-muted"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-border-strong text-[10px] font-bold text-text-primary">
                  {initial}
                </span>
                {user.name ? (
                  <span className="hidden text-sm font-semibold md:block">
                    {user.name.split(" ")[0]}
                  </span>
                ) : null}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-navy px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
