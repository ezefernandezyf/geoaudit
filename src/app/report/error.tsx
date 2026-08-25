"use client";

import { Button } from "@/ui/button";

type ReportErrorProps = {
  /** Error thrown inside the route segment (Next passes it; not displayed raw). */
  error: Error & { digest?: string };
  /** Next.js retry: re-renders the failed segment (full page retry). */
  reset: () => void;
};

/**
 * Report route error boundary (U3.T3, ARU-4): friendly message + "Reintentar"
 * wired to Next's `reset()`. Fetch failures never reach this boundary — the
 * AuditRunner maps them to specific copy (ARU-6); this catches the unexpected.
 */
export default function ReportError({ reset }: ReportErrorProps) {
  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center"
    >
      <h1 className="font-serif text-3xl tracking-tight text-[#0f172a]">
        No pudimos generar el reporte
      </h1>
      <p className="max-w-md text-[#475569]">
        Ocurrió un error inesperado mientras analizábamos el sitio. Pruebe
        nuevamente.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
