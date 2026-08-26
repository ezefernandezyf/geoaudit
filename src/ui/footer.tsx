import Link from "next/link";
import type { Session } from "next-auth";
import { Logo } from "@/ui/logo";

type FooterProps = {
  /** Optional session — gates the Dashboard link (D6: anon shell has none). */
  session?: Session | null;
};

/**
 * Footer (SHL-5, LGL-5, U1.10): minimal global footer — logo, product links
 * and copyright. Copy neutro: Términos / Privacidad per the legal pages. The
 * Dashboard link only renders for authenticated users (D6).
 */
export function Footer({ session }: FooterProps = {}) {
  const isAuthed = Boolean(session?.user);
  return (
    <footer className="border-t border-[#e2e8f0] bg-[#f8fafc]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <Logo size={20} />
        <nav aria-label="Pie de página" className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            Precios
          </Link>
          <Link
            href="/"
            className="text-sm text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            Inicio
          </Link>
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="text-sm text-[#475569] transition-colors hover:text-[#0f172a]"
            >
              Dashboard
            </Link>
          ) : null}
          <Link
            href="/terms"
            className="text-sm text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            Términos
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            Privacidad
          </Link>
          {/* LND-12 (sprint 9): contact signal — the E-E-A-T trustworthiness
              engine awards contact info (mailto/tel/contact/address) +5. The
              mailto uses the same support address as PROFILE_COPY. */}
          <a
            href="mailto:soporte@geoaudit.app"
            className="text-sm text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            Contacto
          </a>
        </nav>
        <p className="text-xs text-[#475569]">
          © {new Date().getFullYear()} GeoAudit
        </p>
      </div>
    </footer>
  );
}
