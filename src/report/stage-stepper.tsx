"use client";

import { useEffect, useState } from "react";

/**
 * StageStepper (ARU-10, design StageStepper): TIME-BASED visual pacing over
 * the atomic audit run (10–60s). The engine is atomic — it has NO per-stage
 * progress — so this stepper never claims a real engine state. It advances
 * purely on a timer and is replaced by the report once the Suspense boundary
 * resolves. Pure visual pacing; the `role="status"` live region lives on the
 * owning skeleton (ARU-3), so this component does not nest its own.
 */

export type Stage = { id: string; label: string; estimateMs: number };
export type StageStatus = "done" | "current" | "pending";

/** Timer tick granularity (1s). */
const TICK_MS = 1000;

/** Derived per-stage status from elapsed ms (pure — fully unit-testable). */
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

/** Spanish status label per stage (visual pacing only). */
const STATUS_LABEL: Record<StageStatus, string> = {
  done: "Completado",
  current: "Analizando…",
  pending: "En cola",
};

type StageStepperProps = {
  stages: readonly Stage[];
};

export function StageStepper({ stages }: StageStepperProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const statuses = getStageStatus(stages, elapsedMs);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedMs((prev) => prev + TICK_MS);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <ol aria-label="Progreso de la auditoría" className="flex flex-col gap-2">
      {stages.map((stage, index) => {
        const status = statuses[index];
        return (
          <li
            key={stage.id}
            data-status={status}
            aria-current={status === "current" ? "step" : undefined}
            className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
              status === "done"
                ? "border-emerald/20 bg-emerald/5"
                : status === "current"
                  ? "border-navy bg-surface"
                  : "border-border bg-surface-muted opacity-60"
            }`}
          >
            <span className="font-medium text-text-primary">{stage.label}</span>
            <span
              className={`shrink-0 text-xs font-medium ${
                status === "done"
                  ? "text-emerald-700"
                  : status === "current"
                    ? "text-navy"
                    : "text-text-secondary"
              }`}
            >
              {STATUS_LABEL[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
