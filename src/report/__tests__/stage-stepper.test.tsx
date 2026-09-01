import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getStageProgress,
  getStageStatus,
  StageStepper,
} from "@/report/stage-stepper";

/**
 * U5.11 - StageStepper (ARU-10, design U5): Gemini stepper - progress bar +
 * numbered circles - as time-based visual pacing over the atomic audit run.
 * The engine has NO per-stage progress, so the stepper only advances on a
 * timer - it never claims a real engine state ("sin simulación": the real
 * report arrives via the Suspense stream). The pure helpers derive status and
 * progress from elapsed ms; the client component runs the timer and renders.
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

describe("getStageProgress (U5.11)", () => {
  it("derives the progress width from the done stages", () => {
    expect(getStageProgress(stages, 0)).toBe(0);
    expect(getStageProgress(stages, 8000)).toBeCloseTo(33.33);
    expect(getStageProgress(stages, 16000)).toBeCloseTo(66.67);
    expect(getStageProgress(stages, 24000)).toBe(100);
  });
});

describe("StageStepper (ARU-10 + U5.11)", () => {
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

  it("renders the Gemini progress bar at 0% before any stage completes", () => {
    vi.useFakeTimers();
    render(<StageStepper stages={stages} />);

    const bar = screen.getByRole("progressbar", {
      name: "Progreso de la auditoría",
    });
    expect(bar).toHaveStyle({ width: "0%" });
  });

  it("advances the progress bar and circles after the first estimate elapses", () => {
    vi.useFakeTimers();
    render(<StageStepper stages={stages} />);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.getAllByText("Completado")).toHaveLength(1);
    expect(screen.getByText("Analizando…")).toBeInTheDocument();
    expect(screen.getAllByText("En cola")).toHaveLength(1);
    const bar = screen.getByRole("progressbar", {
      name: "Progreso de la auditoría",
    });
    expect(bar).toHaveStyle({ width: "33.33333333333333%" });
  });

  it("renders numbered circles and swaps the completed stage for a check", () => {
    vi.useFakeTimers();
    render(<StageStepper stages={stages} />);

    // Pending/current circles show their 1-based number.
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(8000);
    });
    // Stage 1 completed → circle replaced by a check icon (no "1" circle).
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
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
