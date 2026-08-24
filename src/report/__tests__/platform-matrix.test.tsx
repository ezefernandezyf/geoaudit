import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { PlatformMatrix } from "@/report/platform-matrix";

/**
 * U3.2 — PlatformMatrix component (ADP-6): renders the six rows derived from
 * the real perPlatform + perBot contract shapes. Claude (no perPlatform
 * measurement) shows "No medido"; access states render their Spanish label.
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
      GPTBot: "allowed",
      "Claude-Web": "allowed",
      PerplexityBot: "blocked",
      "Google-Extended": "allowed",
      Googlebot: "allowed",
      Bingbot: "unknown",
    },
  },
};

describe("PlatformMatrix (ADP-6)", () => {
  it("renders six platform rows with their readiness scores", () => {
    render(<PlatformMatrix result={matrixResult} />);

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
    render(<PlatformMatrix result={matrixResult} />);

    expect(screen.getByText("No medido")).toBeInTheDocument();
    expect(screen.getByText("Claude-Web")).toBeInTheDocument();
  });

  it("renders Spanish access labels for each bot state", () => {
    render(<PlatformMatrix result={matrixResult} />);

    // ChatGPT, Claude, Gemini, AI Overviews allowed → 4 "Permitido" chips.
    expect(screen.getAllByText("Permitido")).toHaveLength(4);
    expect(screen.getByText("Bloqueado")).toBeInTheDocument(); // Perplexity
    expect(screen.getByText("Desconocido")).toBeInTheDocument(); // Bing Copilot
  });
});
