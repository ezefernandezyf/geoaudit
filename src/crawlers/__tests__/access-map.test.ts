import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";
import { scoreAccess, toContractResult } from "@/crawlers/access-map";
import { parseRobotsTxt } from "@/crawlers/robots-parser";
import { BOTS } from "@/crawlers/bots";
import * as crawlerPublic from "@/crawlers/index";
import { crawlerResultSchema } from "@/lib/contracts/audit-result";
import {
  EMPTY_HEADERS,
  XRT_BOT_SCOPED_MULTI,
  XRT_BOT_SCOPED_NOINDEX,
  XRT_GLOBAL_NOAI,
  XRT_GLOBAL_NOINDEX,
} from "@/crawlers/__fixtures__/headers";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function robots(name: string) {
  return parseRobotsTxt(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

function page(name: string): CheerioAPI {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

function botStatus(result: ReturnType<typeof scoreAccess>, agent: string) {
  const entry = result.perBot.find((b) => b.userAgent === agent);
  if (!entry) throw new Error(`bot not in result: ${agent}`);
  return entry;
}

describe("crawler access map (RCR-4, RCR-8, RCR-9, RCR-10, RCR-11)", () => {
  it("scores 100 when every bot is allowed, no blanket block, and AI files are present (RCR-8)", () => {
    const result = scoreAccess(
      robots("robots-all-allowed.txt"),
      EMPTY_HEADERS,
      page("page-llms-link.html"),
    );
    expect(result.compositeScore).toBe(100);
    expect(result.components).toEqual({
      tier1: 50,
      tier2: 25,
      blanketBonus: 15,
      aiFiles: 10,
    });
    for (const entry of result.perBot) {
      expect(entry.status).toBe("Allowed");
    }
  });

  it("treats an empty robots.txt as Allowed for every bot (RCR-10)", () => {
    const result = scoreAccess(
      robots("robots-empty.txt"),
      EMPTY_HEADERS,
      page("page-clean.html"),
    );
    expect(result.perBot).toHaveLength(17);
    for (const entry of result.perBot) {
      expect(entry.status).toBe("Allowed");
      expect(entry.matchedRule).toBeNull();
    }
    // 50 + 25 + 15 + 0 (no sitemap/llms link) = 90
    expect(result.compositeScore).toBe(90);
  });

  it("reduces the composite when a Tier1 bot is blocked, proportional to 50% across 5 bots (RCR-8)", () => {
    const result = scoreAccess(
      robots("robots-gptbot-blocked.txt"),
      EMPTY_HEADERS,
      page("page-llms-link.html"),
    );
    const gpt = botStatus(result, "GPTBot");
    expect(gpt.status).toBe("Blocked");
    expect(gpt.matchedRule).toBe("Disallow: /");
    expect(result.components.tier1).toBe(40); // 4 of 5 Tier1 bots allowed -> 40/50
    expect(result.compositeScore).toBeLessThan(100);
    expect(result.compositeScore).toBe(90);
  });

  it("blocks every bot under Disallow-all except bots with an explicit Allow group (RCR-11)", () => {
    const result = scoreAccess(
      robots("robots-disallow-all.txt"),
      EMPTY_HEADERS,
      page("page-clean.html"),
    );
    expect(botStatus(result, "GPTBot").status).toBe("Allowed");
    expect(botStatus(result, "GPTBot").matchedRule).toBe("Allow: /");
    expect(botStatus(result, "PerplexityBot").status).toBe("Blocked");
    expect(botStatus(result, "PerplexityBot").matchedRule).toBe("Disallow: /");
    expect(botStatus(result, "Googlebot").status).toBe("Blocked");
    // 10 (GPTBot) + 0 + 0 + 0
    expect(result.compositeScore).toBe(10);
  });

  it("marks unmatched bots NotMentioned when no wildcard group exists (default allow)", () => {
    const result = scoreAccess(
      robots("robots-case-variant.txt"),
      EMPTY_HEADERS,
      page("page-clean.html"),
      "/private",
    );
    const gpt = botStatus(result, "GPTBot");
    expect(gpt.status).toBe("Blocked"); // case-insensitive UA + path matching
    expect(gpt.matchedRule).toBe("Disallow: /Private");
    const perplexity = botStatus(result, "PerplexityBot");
    expect(perplexity.status).toBe("NotMentioned");
    expect(perplexity.matchedRule).toBeNull();
    // 4 accessible Tier1 (40) + 8 Tier2 (25) + 15 + 0 = 80
    expect(result.compositeScore).toBe(80);
  });

  it("lets the exact bot group beat the wildcard group for the same path (RCR-3)", () => {
    const result = scoreAccess(
      robots("robots-gptbot-private.txt"),
      EMPTY_HEADERS,
      page("page-clean.html"),
      "/private",
    );
    expect(botStatus(result, "GPTBot").status).toBe("Blocked");
    expect(botStatus(result, "GPTBot").matchedRule).toBe("Disallow: /private");
    expect(botStatus(result, "PerplexityBot").status).toBe("Allowed");
    expect(botStatus(result, "PerplexityBot").matchedRule).toBe(
      "Allow: /private",
    );
  });

  it("honors the $ anchor per path (RCR-3)", () => {
    const dollarRobots = robots("robots-dollar-anchor.txt");
    expect(
      botStatus(
        scoreAccess(
          dollarRobots,
          EMPTY_HEADERS,
          page("page-clean.html"),
          "/tmp",
        ),
        "PerplexityBot",
      ).status,
    ).toBe("Blocked");
    expect(
      botStatus(
        scoreAccess(
          dollarRobots,
          EMPTY_HEADERS,
          page("page-clean.html"),
          "/tmp/file",
        ),
        "PerplexityBot",
      ).status,
    ).toBe("Allowed");
  });

  it("reports per-bot RCR-9 fields: explicit Allow and wildcard fallback (RCR-4)", () => {
    const result = scoreAccess(
      robots("robots-bot-specific.txt"),
      EMPTY_HEADERS,
      page("page-clean.html"),
      "/private",
    );
    const gpt = botStatus(result, "GPTBot");
    expect(gpt.userAgent).toBe("GPTBot");
    expect(gpt.tier).toBe("Tier1");
    expect(gpt.impact).toBe("Critical");
    expect(gpt.status).toBe("Allowed");
    expect(gpt.matchedRule).toBe("Allow: /");
    expect(gpt.recommendation).toContain("Allowed by robots.txt");
    const perplexity = botStatus(result, "PerplexityBot");
    expect(perplexity.status).toBe("Blocked"); // wildcard group's Disallow /private
    expect(perplexity.matchedRule).toBe("Disallow: /private");
  });
});

describe("X-Robots-Tag header parsing (RCR-5)", () => {
  const baseRobots = () => robots("robots-all-allowed.txt");
  const cleanPage = () => page("page-clean.html");

  it("flags every bot with noindex from a global header directive", () => {
    const result = scoreAccess(baseRobots(), XRT_GLOBAL_NOINDEX, cleanPage());
    for (const entry of result.perBot) {
      expect(entry.signals.noindex).toBe("header");
      expect(entry.status).toBe("Allowed"); // access-level unaffected
      expect(entry.recommendation).toContain("noindex via header");
    }
    // global noindex is not a blanket AI block -> bonus kept (50+25+15+5=95)
    expect(result.compositeScore).toBe(95);
  });

  it("applies a bot-scoped header directive only to that bot", () => {
    const result = scoreAccess(
      baseRobots(),
      XRT_BOT_SCOPED_NOINDEX,
      cleanPage(),
    );
    expect(botStatus(result, "Googlebot").signals.noindex).toBe("header");
    expect(botStatus(result, "PerplexityBot").signals.noindex).toBeUndefined();
  });

  it("keeps the bot scope across a multi-directive comma list", () => {
    const result = scoreAccess(baseRobots(), XRT_BOT_SCOPED_MULTI, cleanPage());
    const googlebot = botStatus(result, "Googlebot");
    expect(googlebot.signals.noindex).toBe("header");
    expect(googlebot.signals.nofollow).toBe("header");
    expect(botStatus(result, "Bingbot").signals.nofollow).toBeUndefined();
  });

  it("forfeits the blanket-block bonus on a global noai header directive", () => {
    const result = scoreAccess(baseRobots(), XRT_GLOBAL_NOAI, cleanPage());
    expect(result.components.blanketBonus).toBe(0);
    expect(result.compositeScore).toBe(80); // 50 + 25 + 0 + 5
    expect(botStatus(result, "GPTBot").signals.noai).toBe("header");
    expect(botStatus(result, "PerplexityBot").signals.noai).toBeUndefined();
  });
});

describe("meta robots parsing (RCR-6)", () => {
  const baseRobots = () => robots("robots-all-allowed.txt");

  it("flags every bot with noindex from a global meta directive", () => {
    const result = scoreAccess(
      baseRobots(),
      EMPTY_HEADERS,
      page("page-meta-noindex.html"),
    );
    for (const entry of result.perBot) {
      expect(entry.signals.noindex).toBe("meta");
    }
  });

  it("flags every bot with nofollow from a global meta directive", () => {
    const result = scoreAccess(
      baseRobots(),
      EMPTY_HEADERS,
      page("page-meta-nofollow.html"),
    );
    for (const entry of result.perBot) {
      expect(entry.signals.nofollow).toBe("meta");
    }
  });

  it("maps the none directive to noindex plus nofollow", () => {
    const result = scoreAccess(
      baseRobots(),
      EMPTY_HEADERS,
      page("page-meta-none.html"),
    );
    for (const entry of result.perBot) {
      expect(entry.signals.noindex).toBe("meta");
      expect(entry.signals.nofollow).toBe("meta");
    }
  });

  it("flags only noai-respecting bots (GPTBot, CCBot, anthropic-ai) and forfeits the blanket bonus", () => {
    const result = scoreAccess(
      baseRobots(),
      EMPTY_HEADERS,
      page("page-meta-noai.html"),
    );
    expect(result.components.blanketBonus).toBe(0);
    expect(result.compositeScore).toBe(80); // 50 + 25 + 0 + 5 (sitemap)
    expect(botStatus(result, "GPTBot").signals.noai).toBe("meta");
    expect(botStatus(result, "CCBot").signals.noai).toBe("meta");
    expect(botStatus(result, "anthropic-ai").signals.noai).toBe("meta");
    expect(botStatus(result, "PerplexityBot").signals.noai).toBeUndefined();
  });

  it("flags every bot with noimageai from a global meta directive", () => {
    const result = scoreAccess(
      baseRobots(),
      EMPTY_HEADERS,
      page("page-meta-noimageai.html"),
    );
    for (const entry of result.perBot) {
      expect(entry.signals.noimageai).toBe("meta");
    }
  });

  it("applies a bot-specific meta directive only to that bot (RCR-6)", () => {
    const result = scoreAccess(
      baseRobots(),
      EMPTY_HEADERS,
      page("page-meta-bot-specific.html"),
    );
    expect(botStatus(result, "Googlebot").signals.noindex).toBe("meta");
    expect(botStatus(result, "GPTBot").signals.noindex).toBeUndefined();
  });
});

describe("toContractResult (RCR-9 -> AuditResult CrawlerResult shape)", () => {
  it("maps statuses and composite into the shared contract and validates with Zod", () => {
    const rich = scoreAccess(
      robots("robots-disallow-all.txt"),
      EMPTY_HEADERS,
      page("page-clean.html"),
    );
    const contract = toContractResult(rich);
    expect(contract.compositeScore).toBe(10);
    expect(contract.perBot.GPTBot).toBe("allowed");
    expect(contract.perBot.PerplexityBot).toBe("blocked");
    expect(crawlerResultSchema.safeParse(contract).success).toBe(true);
  });

  it("maps NotMentioned to the contract's unknown status", () => {
    const rich = scoreAccess(
      robots("robots-case-variant.txt"),
      EMPTY_HEADERS,
      page("page-clean.html"),
      "/private",
    );
    expect(toContractResult(rich).perBot.PerplexityBot).toBe("unknown");
  });
});

describe("crawler public barrel (src/crawlers/index.ts)", () => {
  it("exposes the engine surface consumed by the orchestrator (T25)", () => {
    expect(crawlerPublic.scoreAccess).toBe(scoreAccess);
    expect(crawlerPublic.parseRobotsTxt).toBe(parseRobotsTxt);
    expect(crawlerPublic.BOTS).toBe(BOTS);
    expect(crawlerPublic.BOTS.length).toBe(17);
  });
});
