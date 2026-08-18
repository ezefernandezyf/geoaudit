/**
 * Empty state (DSH-4, design U4): honest copy for a user with zero audits and
 * a single call-to-action. The CTA targets /report, where the inline audit
 * form renders when no url param is present (ARU-5).
 */
export function DashboardEmptyState() {
  return (
    <section
      aria-labelledby="dashboard-empty-title"
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <h2
        id="dashboard-empty-title"
        className="font-display text-3xl tracking-tight text-navy"
      >
        Aún no hiciste auditorías
      </h2>
      <p className="max-w-md text-text-secondary">
        Ejecutá tu primera auditoría GEO para empezar a construir tu historial y
        ver la evolución de tu score.
      </p>
      <a
        href="/report"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Hacer mi primera auditoría
      </a>
    </section>
  );
}
