import { RefreshCw } from "lucide-react";
import { REPORT_COPY } from "@/lib/copy";
import { StageStepper, type Stage } from "@/report/stage-stepper";
import { AuditReportSkeleton } from "@/ui/skeleton";

/**
 * Time-based stage slots for the live stepper (U5.11, ARU-10, design U5).
 * Calibrated over the 10–60s atomic run: the engine is atomic (no per-stage
 * progress), so these are VISUAL pacing estimates only - never real engine
 * state. fetch dominates the tail (platform 40-60s).
 */
const STAGES: readonly Stage[] = [
  { id: "fetch", label: "Conectando y resolviendo DNS", estimateMs: 8000 },
  { id: "crawlers", label: "Inspeccionando robots.txt", estimateMs: 8000 },
  { id: "citability", label: "Evaluando citabilidad", estimateMs: 8000 },
  {
    id: "content",
    label: "Analizando E-E-A-T del contenido",
    estimateMs: 8000,
  },
  { id: "schema", label: "Validando datos estructurados", estimateMs: 8000 },
  {
    id: "platform",
    label: "Computando readiness de plataformas",
    estimateMs: 20000,
  },
];

/**
 * Report loading skeleton (U5.11, ARU-3/ARU-10): Gemini LiveReportPage
 * scanning card VERBATIM - emerald spinner, "Auditoría en Progreso" eyebrow,
 * serif "Analizando <url>", the animated StageStepper (progress bar +
 * numbered circles) and the AuditReportSkeleton preview. NO simulation: the
 * stages pace on the honest timer only, the real report arrives via the
 * Suspense stream. The single `role="status"` live region is the nested
 * AuditReportSkeleton ("Cargando auditoría GEO...") - no duplicated regions.
 *
 * Shared by `loading.tsx` and the explicit `<Suspense fallback>` of the page;
 * the StageStepper is replaced by the report once the boundary resolves.
 */
export function ReportSkeleton({ url }: { url?: string }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="space-y-8 rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm sm:p-10">
        {/* Live progress header (Gemini verbatim) */}
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
            <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
          </div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {REPORT_COPY.live.inProgress}
          </p>
          <h1 className="font-serif text-3xl font-normal text-[#0f172a] sm:text-4xl">
            {REPORT_COPY.live.analyzing}{" "}
            <span className="font-mono text-2xl font-bold text-emerald-800">
              {url ?? "el sitio"}
            </span>
          </h1>
          <p className="font-sans text-xs text-[#475569]">
            {REPORT_COPY.live.subtitle}
          </p>
        </div>

        <StageStepper stages={STAGES} />

        {/* Skeleton preview underneath */}
        <div className="border-t border-[#e2e8f0] pt-6">
          <p className="mb-4 text-center font-mono text-xs uppercase tracking-wider text-[#94a3b8]">
            {REPORT_COPY.live.preparing}
          </p>
          <AuditReportSkeleton />
        </div>
      </div>
    </div>
  );
}
