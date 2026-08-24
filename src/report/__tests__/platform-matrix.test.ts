import { describe, expect, it } from "vitest";
import { buildPlatformRows } from "@/report/platform-matrix";

/**
 * U3.1/U3.2 — Platform matrix derivation (ADP-6, design PlatformMatrix).
 * Pure function, no React: maps the six platform rows from the real
 * `platform.perPlatform` (5 ids: aio/chatgpt/perplexity/gemini/copilot) plus
 * `crawlers.perBot` access map. Claude has no `perPlatform` score → readiness
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
  "Claude-Web": "allowed",
  PerplexityBot: "blocked",
  "Google-Extended": "allowed",
  Googlebot: "allowed",
  Bingbot: "unknown",
};

describe("buildPlatformRows (ADP-6)", () => {
  it("derives exactly six platform rows", () => {
    const rows = buildPlatformRows(perPlatform, perBot);
    expect(rows).toHaveLength(6);
  });

  it("maps each platform readiness from perPlatform and access from perBot", () => {
    const rows = buildPlatformRows(perPlatform, perBot);
    const chatgpt = rows.find((r) => r.name === "ChatGPT")!;
    expect(chatgpt.readiness).toBe(65);
    expect(chatgpt.access).toBe("allowed");

    const aio = rows.find((r) => r.name === "Google AI Overviews")!;
    expect(aio.readiness).toBe(70);
    expect(aio.access).toBe("allowed");
  });

  it("shows Claude readiness null (No medido) but reads its perBot access", () => {
    const rows = buildPlatformRows(perPlatform, perBot);
    const claude = rows.find((r) => r.name === "Claude")!;
    expect(claude.readiness).toBeNull();
    expect(claude.access).toBe("allowed");
    expect(claude.bot).toBe("Claude-Web");
  });

  it("surfaces blocked and unknown access states", () => {
    const rows = buildPlatformRows(perPlatform, perBot);
    expect(rows.find((r) => r.name === "Perplexity")!.access).toBe("blocked");
    expect(rows.find((r) => r.name === "Bing Copilot")!.access).toBe("unknown");
  });

  it("uses the expected bot identifiers per row", () => {
    const rows = buildPlatformRows(perPlatform, perBot);
    const names = new Set(rows.map((r) => `${r.name}:${r.bot}`));
    expect(names).toEqual(
      new Set([
        "ChatGPT:GPTBot",
        "Claude:Claude-Web",
        "Perplexity:PerplexityBot",
        "Gemini:Google-Extended",
        "Google AI Overviews:Googlebot",
        "Bing Copilot:Bingbot",
      ]),
    );
  });
});
