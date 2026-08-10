import { describe, expect, it } from "vitest";
import { BOTS, NOAI_RESPECTING } from "@/crawlers/bots";

/**
 * RCR-1: static registry of exactly the 17 brief §8.2 user agents, with tier and
 * impact classification. The brief list is the authoritative product contract;
 * the geo-crawlers skill only enriches tier/impact semantics (see bots.ts comment).
 */
const BRIEF_AGENTS = [
  "GPTBot",
  "CCBot",
  "anthropic-ai",
  "Claude-Web",
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "PerplexityBot",
  "Applebot-Extended",
  "meta-externalagent",
  "cohere-ai",
  "Bytespider",
  "Omgili",
  "Omgilibot",
  "ImagesiftBot",
  "Diffbot",
  "FacebookBot",
];

describe("bot registry (RCR-1)", () => {
  it("registers exactly the 17 brief §8.2 user agents with unique tokens", () => {
    expect(BOTS).toHaveLength(17);
    expect(new Set(BOTS.map((b) => b.userAgent)).size).toBe(17);
    expect(BOTS.map((b) => b.userAgent).sort()).toEqual(
      [...BRIEF_AGENTS].sort(),
    );
  });

  it("selects exactly 5 Tier1 agents — the AI-search-surface critical set", () => {
    const tier1 = BOTS.filter((b) => b.tier === "Tier1")
      .map((b) => b.userAgent)
      .sort();
    expect(tier1).toEqual([
      "Bingbot",
      "Claude-Web",
      "GPTBot",
      "Googlebot",
      "PerplexityBot",
    ]);
  });

  it("marks every Tier1 agent with Critical impact", () => {
    const tier1 = BOTS.filter((b) => b.tier === "Tier1");
    expect(tier1).toHaveLength(5);
    for (const bot of tier1) {
      expect(bot.impact).toBe("Critical");
    }
  });

  it("classifies Tier2 agents (8) with High/Medium impact and Other agents (4) with Medium", () => {
    const tier2 = BOTS.filter((b) => b.tier === "Tier2");
    expect(tier2).toHaveLength(8);
    for (const bot of tier2) {
      expect(["High", "Medium"]).toContain(bot.impact);
    }
    const other = BOTS.filter((b) => b.tier === "Other");
    expect(other).toHaveLength(4);
    for (const bot of other) {
      expect(bot.impact).toBe("Medium");
    }
  });

  it("keeps the brief list authoritative — skill Tier-1 agents absent from brief are NOT added", () => {
    const tier1Agents = BOTS.filter((b) => b.tier === "Tier1").map(
      (b) => b.userAgent,
    );
    expect(tier1Agents).toContain("GPTBot");
    expect(tier1Agents).toContain("PerplexityBot");
    // geo-crawlers skill Tier-1 set also lists these three, but brief §8.2 omits them.
    expect(BOTS.some((b) => b.userAgent === "OAI-SearchBot")).toBe(false);
    expect(BOTS.some((b) => b.userAgent === "ChatGPT-User")).toBe(false);
    expect(BOTS.some((b) => b.userAgent === "ClaudeBot")).toBe(false);
  });

  it("declares the noai-respecting set used by RCR-6 meta-noai flagging", () => {
    expect(NOAI_RESPECTING).toEqual(["GPTBot", "CCBot", "anthropic-ai"]);
  });

  it("gives every entry a valid tier, impact, and non-empty user agent", () => {
    const tiers = ["Tier1", "Tier2", "Other"];
    const impacts = ["Critical", "High", "Medium"];
    for (const bot of BOTS) {
      expect(tiers).toContain(bot.tier);
      expect(impacts).toContain(bot.impact);
      expect(bot.userAgent.length).toBeGreaterThan(0);
    }
  });
});
