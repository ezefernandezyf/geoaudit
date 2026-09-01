import type { BotAgent } from "./types";

/**
 * 17-bot registry (RCR-1). The user-agent list is the AUTHORITATIVE product
 * contract from geo-saas-brief.md §8.2; the geo-crawlers skill only enriches
 * tier/impact semantics.
 *
 * Reconciliation note (brief §8.2 vs geo-crawlers skill):
 * - Skill Tier-1 (Critical) set: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
 *   PerplexityBot. Brief §8.2 omits OAI-SearchBot, ChatGPT-User and ClaudeBot, so
 *   per the product contract those three are NOT registered - the registry keeps
 *   exactly the 17 brief agents.
 * - Tier1/Critical (exactly 5) here: GPTBot and PerplexityBot (skill Tier-1 and
 *   present in the brief) plus the AI-search-surface crawlers of the brief:
 *   Claude-Web (Anthropic's live-feature crawler - ClaudeBot's stand-in),
 *   Googlebot (Google index, which feeds AI Overviews/Gemini) and Bingbot
 *   (Bing index, which feeds Copilot).
 * - Skill Tier-2 agents present in the brief (Google-Extended, Applebot-Extended,
 *   FacebookBot) stay Tier2/High; meta-externalagent follows the Meta AI family
 *   (skill's FacebookBot) -> Tier2/High; Omgili/Omgilibot (AI chat search) and
 *   Diffbot (knowledge graph) -> Tier2; ImagesiftBot (AI image search) -> Tier2.
 * - Skill Tier-3 training-only agents (CCBot, anthropic-ai, Bytespider, cohere-ai)
 *   -> Other/Medium (no live AI search impact).
 */
export const BOTS: readonly BotAgent[] = [
  // Tier 1 - gate access to the five main AI answer surfaces.
  { userAgent: "GPTBot", tier: "Tier1", impact: "Critical" },
  { userAgent: "PerplexityBot", tier: "Tier1", impact: "Critical" },
  { userAgent: "Claude-Web", tier: "Tier1", impact: "Critical" },
  { userAgent: "Googlebot", tier: "Tier1", impact: "Critical" },
  { userAgent: "Bingbot", tier: "Tier1", impact: "Critical" },
  // Tier 2 - important for the broader AI ecosystem.
  { userAgent: "Google-Extended", tier: "Tier2", impact: "High" },
  { userAgent: "Applebot-Extended", tier: "Tier2", impact: "High" },
  { userAgent: "meta-externalagent", tier: "Tier2", impact: "High" },
  { userAgent: "FacebookBot", tier: "Tier2", impact: "High" },
  { userAgent: "Omgili", tier: "Tier2", impact: "High" },
  { userAgent: "Omgilibot", tier: "Tier2", impact: "High" },
  { userAgent: "ImagesiftBot", tier: "Tier2", impact: "Medium" },
  { userAgent: "Diffbot", tier: "Tier2", impact: "Medium" },
  // Other - training-only crawlers with no live AI search impact.
  { userAgent: "CCBot", tier: "Other", impact: "Medium" },
  { userAgent: "anthropic-ai", tier: "Other", impact: "Medium" },
  { userAgent: "cohere-ai", tier: "Other", impact: "Medium" },
  { userAgent: "Bytespider", tier: "Other", impact: "Medium" },
];

/**
 * Bots that respect the `noai` directive (RCR-6 scenario: GPTBot, CCBot and
 * anthropic-ai are flagged when a global noai meta/header directive is present).
 */
export const NOAI_RESPECTING: readonly string[] = [
  "GPTBot",
  "CCBot",
  "anthropic-ai",
];
