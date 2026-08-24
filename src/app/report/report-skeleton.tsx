import { StageStepper, type Stage } from "@/report/stage-stepper";

/**
 * Pulse block styles — verbatim reuse of the Skeleton primitive's classes
 * (src/ui/skeleton.tsx). The primitive itself sets `role="status"` per block;
 * composing it here would create N live regions, so the loading shell owns a
 * single status region (ARU-3) and the blocks are plain pulsing shapes.
 */
const PULSE_BLOCK =
  "animate-pulse motion-reduce:animate-none rounded-md bg-border";

/**
 * Time-based stage slots for the live stepper (ARU-10, design StageStepper).
 * Calibrated over the 10–60s atomic run: the engine is atomic (no per-stage
 * progress), so these are VISUAL pacing estimates only — never real engine
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
 * Report loading skeleton (ARU-3/ARU-10): one `role="status"` live region
 * labelled "Cargando reporte" with pulsing blocks approximating the report
 * layout plus the live time-based StageStepper and the honest wait hint.
 * Motion-safe: the pulse is disabled under `prefers-reduced-motion`.
 *
 * Shared by `loading.tsx` and the explicit `<Suspense fallback>` of the page.
 * The StageStepper is replaced by the report once the Suspense boundary
 * resolves.
 */
export function ReportSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando reporte"
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16"
    >
      <div className={`${PULSE_BLOCK} h-24 w-56`} />
      <StageStepper stages={STAGES} />
      <div className="flex flex-col gap-4">
        <div className={`${PULSE_BLOCK} h-6 w-full`} />
        <div className={`${PULSE_BLOCK} h-6 w-5/6`} />
        <div className={`${PULSE_BLOCK} h-6 w-4/6`} />
      </div>
      <div className="flex flex-col gap-3">
        <div className={`${PULSE_BLOCK} h-4 w-full`} />
        <div className={`${PULSE_BLOCK} h-4 w-3/4`} />
        <div className={`${PULSE_BLOCK} h-4 w-2/3`} />
      </div>
      <p className="text-sm text-text-secondary">
        Puede tardar hasta 60 segundos.
      </p>
    </div>
  );
}
