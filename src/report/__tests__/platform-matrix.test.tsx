import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import { PlatformMatrix } from "@/report/platform-matrix";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";

/**
 * U5.7 - PlatformMatrix (ARU-12): pure presenter of `view.platforms`. The
 * view model delivers the six rows (built by `buildPlatformRows` inside the
 * adapter); Claude (no perPlatform measurement) shows "No medido". The pure
 * `buildPlatformRows` derivation keeps its own unit tests (platform-matrix
 * .test.ts).
 */

const matrixResult = {
  ...auditResultFixture,
  platform: {
    ...auditResultFixture.platform,
    perPlatform: {
      aio: { score: 70, criteria: [] },
      chatgpt: { score: 65, criteria: [] },
      perplexity: { score: 60, criteria: [] },
      gemini: { score: 62, criteria: [] },
      copilot: { score: 58, criteria: [] },
    },
  },
  crawlers: {
    compositeScore: 71,
    perBot: {
      GPTBot: "allowed" as const,
      "Claude-Web": "allowed" as const,
      PerplexityBot: "blocked" as const,
      "Google-Extended": "allowed" as const,
      Googlebot: "allowed" as const,
      Bingbot: "unknown" as const,
    },
  },
};

describe("PlatformMatrix (ARU-12)", () => {
  it("renders six platform rows with their readiness scores from the view", () => {
    render(<PlatformMatrix view={toGeminiViewModel(matrixResult)} />);

    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("Claude")).toBeInTheDocument();
    expect(screen.getByText("Perplexity")).toBeInTheDocument();
    expect(screen.getByText("Gemini")).toBeInTheDocument();
    expect(screen.getByText("Google AI Overviews")).toBeInTheDocument();
    expect(screen.getByText("Bing Copilot")).toBeInTheDocument();

    expect(screen.getByText("65")).toBeInTheDocument(); // ChatGPT
    expect(screen.getByText("70")).toBeInTheDocument(); // AI Overviews
  });

  it("renders Claude readiness as 'No medido' with its bot access", () => {
    render(<PlatformMatrix view={toGeminiViewModel(matrixResult)} />);

    expect(screen.getByText("No medido")).toBeInTheDocument();
    expect(screen.getByText("Claude-Web")).toBeInTheDocument();
  });

  it("renders Spanish access labels for each bot state", () => {
    render(<PlatformMatrix view={toGeminiViewModel(matrixResult)} />);

    // ChatGPT, Claude, Gemini, AI Overviews allowed → 4 "Permitido" chips.
    expect(screen.getAllByText("Permitido")).toHaveLength(4);
    expect(screen.getByText("Bloqueado")).toBeInTheDocument(); // Perplexity
    expect(screen.getByText("Desconocido")).toBeInTheDocument(); // Bing Copilot
  });

  it("renders the Gemini section header (ARU-12 matrix title)", () => {
    render(<PlatformMatrix view={toGeminiViewModel(matrixResult)} />);
    expect(
      screen.getByText("Matriz de Visibilidad por Plataforma de IA"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Matriz de plataformas de IA" }),
    ).toBeInTheDocument();
  });

  it("never renders fabricated columns (no citation rate / last crawled)", () => {
    render(<PlatformMatrix view={toGeminiViewModel(matrixResult)} />);
    expect(screen.queryByText("Tasa de Citación")).not.toBeInTheDocument();
    expect(screen.queryByText("Último Rastreo")).not.toBeInTheDocument();
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });
});
