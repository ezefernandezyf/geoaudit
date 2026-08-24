import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getStageStatus, StageStepper } from "@/report/stage-stepper";

/**
 * U3.3 — StageStepper (ARU-10, design StageStepper): time-based visual pacing
 * over the atomic audit run. The engine has NO per-stage progress, so the
 * stepper only advances on a timer — it never claims a real engine state. The
 * pure `getStageStatus` derives per-stage status from elapsed ms; the client
 * component runs the timer and renders it.
 */

const stages = [
  { id: "fetch", label: "Conectando y resolviendo DNS", estimateMs: 8000 },
  { id: "crawlers", label: "Inspeccionando robots.txt", estimateMs: 8000 },
  { id: "citability", label: "Evaluando citabilidad", estimateMs: 8000 },
];

afterEach(() => vi.useRealTimers());

describe("getStageStatus (ARU-10)", () => {
  it("marks the first stage current at the start", () => {
    expect(getStageStatus(stages, 0)).toEqual([
      "current",
      "pending",
      "pending",
    ]);
  });

  it("marks a stage done once its cumulative window has fully passed", () => {
    expect(getStageStatus(stages, 8000)).toEqual([
      "done",
      "current",
      "pending",
    ]);
    expect(getStageStatus(stages, 16000)).toEqual(["done", "done", "current"]);
  });

  it("marks all stages done after the total duration", () => {
    expect(getStageStatus(stages, 24000)).toEqual(["done", "done", "done"]);
  });
});

describe("StageStepper (ARU-10)", () => {
  it("renders all stages with the first current and the rest pending", () => {
    vi.useFakeTimers();
    render(<StageStepper stages={stages} />);

    for (const s of stages) {
      expect(screen.getByText(s.label)).toBeInTheDocument();
    }
    expect(screen.getByText("Analizando…")).toBeInTheDocument();
    expect(screen.getAllByText("En cola")).toHaveLength(2);
    expect(screen.queryByText("Completado")).not.toBeInTheDocument();
  });

  it("advances to the next stage after the first estimate elapses", () => {
    vi.useFakeTimers();
    render(<StageStepper stages={stages} />);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.getAllByText("Completado")).toHaveLength(1);
    expect(screen.getByText("Analizando…")).toBeInTheDocument();
    expect(screen.getAllByText("En cola")).toHaveLength(1);
  });

  it("does not mark a stage done before its window passes (no engine claim)", () => {
    vi.useFakeTimers();
    render(<StageStepper stages={stages} />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText("Completado")).not.toBeInTheDocument();
    expect(screen.getByText("Analizando…")).toBeInTheDocument();
  });

  it("cleans up its timer on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(<StageStepper stages={stages} />);
    unmount();
    expect(() => act(() => vi.advanceTimersByTime(16000))).not.toThrow();
  });
});
