import { describe, expect, it } from "vitest";
import { buildPlatformRows } from "@/report/presenters/platforms";

/**
 * U5.4 — `platforms.ts` (APT-8). Six platform rows derived from the real
 * `perPlatform` (5 ids: aio/chatgpt/perplexity/gemini/copilot) plus
 * `crawlers.perBot` access map. Claude has no `perPlatform` id → readiness
 * null ("No medido"); its access still comes from `perBot["Claude-Web"]`.
 */

const perPlatform: Record<string, unknown> = {
  aio: { score: 70, criteria: [] },
  chatgpt: { score: 65, criteria: [] },
  perplexity: { score: 60, criteria: [] },
  gemini: { score: 62, criteria: [] },
  copilot: { score: 58, criteria: [] },
};

const perBot: Record<string, "allowed" | "blocked" | "unknown"> = {
  GPTBot: "allowed",
  "Claude-Web": "blocked",
  PerplexityBot: "unknown",
  "Google-Extended": "allowed",
  Googlebot: "allowed",
  Bingbot: "unknown",
};

describe("buildPlatformRows (APT-8)", () => {
  it("derives exactly six platform rows in the expected order", () => {
    const rows = buildPlatformRows(perPlatform, perBot);
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.name)).toEqual([
      "ChatGPT",
      "Claude",
      "Perplexity",
      "Gemini",
      "Google AI Overviews",
      "Bing Copilot",
    ]);
  });

  it("maps each platform readiness from perPlatform and access from perBot", () => {
    const rows = buildPlatformRows(perPlatform, perBot);
    const chatgpt = rows.find((r) => r.id === "chatgpt")!;
    expect(chatgpt.readiness).toBe(65);
    expect(chatgpt.access).toBe("allowed");

    const gemini = rows.find((r) => r.id === "gemini")!;
    expect(gemini.readiness).toBe(62);
    expect(gemini.access).toBe("allowed");

    const aio = rows.find((r) => r.id === "aio")!;
    expect(aio.readiness).toBe(70);
    expect(aio.access).toBe("allowed");

    const copilot = rows.find((r) => r.id === "copilot")!;
    expect(copilot.readiness).toBe(58);
    expect(copilot.access).toBe("unknown");
  });

  it("marks Claude readiness null with access from Claude-Web (APT-8)", () => {
    const rows = buildPlatformRows(perPlatform, perBot);
    const claude = rows.find((r) => r.id === "claude")!;
    expect(claude.name).toBe("Claude");
    expect(claude.bot).toBe("Claude-Web");
    expect(claude.readiness).toBeNull();
    expect(claude.access).toBe("blocked");
  });

  it("falls back to unknown access when a bot is not measured (APT-10)", () => {
    const rows = buildPlatformRows(perPlatform, {});
    for (const row of rows) {
      expect(row.access).toBe("unknown");
    }
    const claude = rows.find((r) => r.id === "claude")!;
    expect(claude.readiness).toBeNull();
  });
});
