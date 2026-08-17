/**
 * Pulse block styles — verbatim reuse of the Skeleton primitive's classes
 * (src/ui/skeleton.tsx). The primitive itself sets `role="status"` per block;
 * composing it here would create N live regions, so the loading shell owns a
 * single status region (ARU-3) and the blocks are plain pulsing shapes.
 */
const PULSE_BLOCK =
  "animate-pulse motion-reduce:animate-none rounded-md bg-border";

/**
 * Report loading skeleton (U3.T2, ARU-3): one `role="status"` live region
 * labelled "Cargando reporte" with pulsing blocks approximating the report
 * layout (hero block, scorecard rows, findings lines) plus the honest wait
 * hint. Motion-safe: the pulse is disabled under `prefers-reduced-motion`.
 *
 * Shared by `loading.tsx` and the explicit `<Suspense fallback>` of the page.
 */
export function ReportSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando reporte"
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16"
    >
      <div className={`${PULSE_BLOCK} h-24 w-56`} />
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
