import type { GeminiView } from "@/report/presenters/types";

/**
 * ReportMeta (U5.6, ARU-10, design U5): pure presenter of the view model -
 * the honest metadata strip (audit date + duration). The view model only
 * carries metrics the engine actually measured (APT-10); the caller supplies
 * the persisted date via the adapter `ctx`. Pure SSR Server Component.
 */
export function ReportMeta({ view }: { view: GeminiView }) {
  return (
    <section aria-label="Metadatos del análisis" className="w-full">
      <dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[#64748b]">
        {view.auditDate ? (
          <div>
            <dt className="sr-only">Fecha de la auditoría</dt>
            <dd>{view.auditDate}</dd>
          </div>
        ) : null}
        <div>
          <dt className="sr-only">Duración del análisis</dt>
          <dd>{view.durationSeconds}s</dd>
        </div>
      </dl>
    </section>
  );
}
