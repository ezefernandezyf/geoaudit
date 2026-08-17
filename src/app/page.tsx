import { auditAction } from "@/lib/audit/actions";
import { AuditForm } from "@/ui/audit-form";

/**
 * Root landing page — U2 (ADF-1/ADF-8): hero with the free audit form as the
 * sole CTA. No /dashboard link (D6). Copy per STYLE-BRIEF §1 (product copy in
 * Spanish); the form drives the whole flow: URL → action → /report.
 */
export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-6">
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-24 text-center">
        <h1 className="font-display text-5xl tracking-tight text-navy">
          GeoAudit
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-text-secondary">
          Ingresá la URL de tu sitio y obtené tu GEO Score 0–100 con un reporte
          completo de visibilidad en buscadores con IA.
        </p>
        <div className="w-full max-w-xl">
          <AuditForm action={auditAction} />
        </div>
      </section>
    </main>
  );
}
