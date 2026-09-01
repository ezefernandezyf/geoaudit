"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { REPORT_COPY } from "@/lib/copy";

/**
 * StageStepper (U5.11, ARU-10, design U5): Gemini LiveReportPage stepper
 * VERBATIM - progress bar + numbered circles (done → emerald check, current →
 * navy pulse, pending → slate) - over the atomic audit run (10–60s).
 *
 * The engine is atomic - it has NO per-stage progress - so this stepper never
 * claims a real engine state. It advances purely on a timer and is replaced
 * by the report once the Suspense boundary resolves. Pure visual pacing
 * ("sin simulación": no fake results, no invented wait times - the real data
 * arrives via the stream/result). The `role="status"` live region lives on
 * the owning `AuditReportSkeleton`, so this component does not nest its own.
 */

export type Stage = { id: string; label: string; estimateMs: number };
export type StageStatus = "done" | "current" | "pending";

/** Timer tick granularity (1s). */
const TICK_MS = 1000;

/** Derived per-stage status from elapsed ms (pure - fully unit-testable). */
export function getStageStatus(
  stages: readonly Stage[],
  elapsedMs: number,
): StageStatus[] {
  let cumulative = 0;
  return stages.map((stage) => {
    const end = cumulative + stage.estimateMs;
    const start = cumulative;
    cumulative = end;
    if (elapsedMs >= end) return "done";
    if (elapsedMs >= start) return "current";
    return "pending";
  });
}

/** Progress bar width % from the stage statuses (pure). */
export function getStageProgress(
  stages: readonly Stage[],
  elapsedMs: number,
): number {
  const statuses = getStageStatus(stages, elapsedMs);
  const done = statuses.filter((status) => status === "done").length;
  return (done / stages.length) * 100;
}

/** Spanish status label per stage (visual pacing only). */
const STATUS_LABEL: Record<StageStatus, string> = {
  done: REPORT_COPY.live.statuses.done,
  current: REPORT_COPY.live.statuses.current,
  pending: REPORT_COPY.live.statuses.pending,
};

type StageStepperProps = {
  stages: readonly Stage[];
};

export function StageStepper({ stages }: StageStepperProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const statuses = getStageStatus(stages, elapsedMs);
  const progress = getStageProgress(stages, elapsedMs);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedMs((prev) => prev + TICK_MS);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="w-full overflow-hidden rounded-full bg-[#f1f5f9] h-2">
        <div
          data-stage-progress
          className="h-full rounded-full bg-[#10b981] transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de la auditoría"
        />
      </div>

      <ol aria-label="Progreso de la auditoría" className="space-y-3">
        {stages.map((stage, index) => {
          const status = statuses[index];
          const isDone = status === "done";
          const isCurrent = status === "current";
          return (
            <li
              key={stage.id}
              data-status={status}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center justify-between gap-4 rounded-lg border p-3.5 transition-colors ${
                isDone
                  ? "border-[#bbf7d0] bg-[#f0fdf4] text-emerald-950"
                  : isCurrent
                    ? "border-[#0f172a] bg-white shadow-xs"
                    : "border-[#e2e8f0] bg-[#f8fafc] opacity-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "bg-[#0f172a] text-white animate-pulse"
                        : "bg-[#e2e8f0] text-[#64748b]"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#0f172a]">
                    {stage.label}
                  </p>
                </div>
              </div>

              <span className="shrink-0 font-mono text-[10px] text-[#64748b]">
                {STATUS_LABEL[status]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
