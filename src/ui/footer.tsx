import Link from "next/link";

/**
 * Footer (SHL-4, DNF-10): minimal global footer with product info and a link
 * to /pricing. No invented features or claims.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <p className="font-display text-lg text-text-primary">GeoAudit</p>
        <nav aria-label="Pie de página" className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            Precios
          </Link>
          <Link
            href="/login"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            Iniciar sesión
          </Link>
        </nav>
        <p className="text-xs text-text-secondary">
          © {new Date().getFullYear()} GeoAudit
        </p>
      </div>
    </footer>
  );
}
