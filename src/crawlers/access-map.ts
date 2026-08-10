import type { CheerioAPI } from "cheerio";
import { BOTS, NOAI_RESPECTING } from "./bots";
import { matchPath, selectGroup } from "./robots-parser";
import type {
  BotAccess,
  BotSignals,
  BotStatus,
  CrawlerAccessComponents,
  CrawlerAccessResult,
  DirectiveSource,
} from "./types";
import type { RobotsTxt } from "@/lib/contracts/fetch-types";
import type { CrawlerResult } from "@/lib/contracts/audit-result";

/**
 * Crawler access map (RCR-4..RCR-11). Pure function over three parsed inputs:
 * the RobotsTxt contract, the page HTTP headers and the Cheerio DOM — zero
 * network. Produces a per-bot map (RCR-9) and the composite crawler score
 * (RCR-8: Tier1 50% + Tier2 25% + no-blanket-block 15% + AI-files 10%).
 *
 * The engine-local `CrawlerAccessResult` is richer than the shared
 * `CrawlerResult` contract (which only carries `compositeScore` +
 * `perBot: Record<agent, allowed|blocked|unknown>`); `toContractResult` maps
 * between them for the AuditResult shape.
 */

interface DirectiveEntry {
  /** Lowercased bot token, or null for a global directive. */
  scope: string | null;
  /** Lowercased directive token (noindex, nofollow, noai, ...). */
  directive: string;
  source: DirectiveSource;
}

const STATUS_TO_CONTRACT = {
  Allowed: "allowed",
  Blocked: "blocked",
  NotMentioned: "unknown",
} as const;

/**
 * Parses `X-Robots-Tag` header values (RCR-5), including bot-scoped values
 * (`googlebot: noindex, nofollow`). The Web Headers class joins repeated
 * header lines with ", " so a colon token re-scopes all following tokens until
 * the next colon — the best possible reconstruction for the combined value.
 */
function parseHeaderDirectives(headers: Headers): DirectiveEntry[] {
  const value = headers.get("x-robots-tag");
  if (!value) return [];
  const entries: DirectiveEntry[] = [];
  let scope: string | null = null;
  for (const rawToken of value.split(",")) {
    const token = rawToken.trim();
    if (token.length === 0) continue;
    const colon = token.indexOf(":");
    if (colon !== -1) {
      const bot = token.slice(0, colon).trim().toLowerCase();
      const directive = token
        .slice(colon + 1)
        .trim()
        .toLowerCase();
      scope = bot.length > 0 ? bot : null;
      if (directive.length > 0)
        entries.push({ scope, directive, source: "header" });
    } else {
      entries.push({ scope, directive: token.toLowerCase(), source: "header" });
    }
  }
  return entries;
}

/**
 * Parses `<meta name="...">` robots directives (RCR-6): `name="robots"` is
 * global; any other name that matches a registered bot is bot-scoped.
 */
function parseMetaDirectives($: CheerioAPI): DirectiveEntry[] {
  const entries: DirectiveEntry[] = [];
  $("meta[name]").each((_index, element) => {
    const name = ($(element).attr("name") ?? "").trim().toLowerCase();
    const content = ($(element).attr("content") ?? "").trim().toLowerCase();
    if (name.length === 0 || content.length === 0) return;
    const scope = name === "robots" ? null : name;
    for (const raw of content.split(/[,\s]+/)) {
      const directive = raw.trim();
      if (directive.length > 0)
        entries.push({ scope, directive, source: "meta" });
    }
  });
  return entries;
}

/** Collects the page-level directives that apply to one bot into signals. */
function signalsForBot(
  userAgent: string,
  entries: DirectiveEntry[],
): BotSignals {
  const signals: BotSignals = {};
  const needle = userAgent.toLowerCase();
  for (const entry of entries) {
    const global = entry.scope === null;
    const botScoped = entry.scope !== null && entry.scope === needle;
    if (!global && !botScoped) continue;
    const set = (key: "noindex" | "nofollow" | "noai" | "noimageai") => {
      signals[key] ??= entry.source;
    };
    switch (entry.directive) {
      case "noindex":
      case "nofollow":
      case "noimageai":
        set(entry.directive);
        break;
      case "noai":
        // Global noai only flags the bots documented to respect it (RCR-6);
        // a bot-scoped noai always flags that bot.
        if (botScoped || NOAI_RESPECTING.includes(userAgent)) set("noai");
        break;
      case "none":
        set("noindex");
        set("nofollow");
        break;
      default:
        break;
    }
  }
  return signals;
}

/** Access-level resolution from robots.txt (RCR-4, RCR-10, RCR-11). */
function evaluateRobots(
  userAgent: string,
  robots: RobotsTxt,
  path: string,
): { status: BotStatus; matchedRule: string | null } {
  if (robots.groups.length === 0) {
    return { status: "Allowed", matchedRule: null }; // RCR-10
  }
  const group = selectGroup(robots.groups, userAgent);
  if (!group) {
    return { status: "NotMentioned", matchedRule: null }; // default allow, no group
  }
  const match = matchPath(group, path);
  if (!match) {
    return {
      status: "Allowed",
      matchedRule: `${group.userAgents[0]} (default allow)`,
    };
  }
  return match.decision === "allow"
    ? { status: "Allowed", matchedRule: `Allow: ${match.pattern}` }
    : { status: "Blocked", matchedRule: `Disallow: ${match.pattern}` };
}

function recommendationFor(access: Omit<BotAccess, "recommendation">): string {
  const parts: string[] = [];
  switch (access.status) {
    case "Blocked":
      parts.push(`Blocked by robots.txt (${access.matchedRule})`);
      break;
    case "Allowed":
      parts.push("Allowed by robots.txt");
      break;
    case "NotMentioned":
      parts.push(
        `No robots.txt rule for ${access.userAgent} — allowed by default`,
      );
      break;
  }
  if (access.signals.noindex)
    parts.push(`noindex via ${access.signals.noindex}`);
  if (access.signals.nofollow)
    parts.push(`nofollow via ${access.signals.nofollow}`);
  if (access.signals.noai) parts.push("noai — AI training opted out");
  if (access.signals.noimageai)
    parts.push(`noimageai via ${access.signals.noimageai}`);
  return parts.join("; ");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isBlanketDisallowPattern(pattern: string): boolean {
  const norm = pattern.toLowerCase();
  return norm === "/" || norm === "/*" || norm === "/$" || norm === "*";
}

/**
 * A blanket AI block exists when the wildcard group disallows the whole site
 * OR a global noai directive (header or meta) opts everyone out of AI
 * training (geo-crawlers rubric). Bot-scoped directives are not blanket.
 */
function hasBlanketBlock(
  robots: RobotsTxt,
  entries: DirectiveEntry[],
): boolean {
  const wildcard = robots.groups.find((g) => g.userAgents.includes("*"));
  const blanketDisallow =
    wildcard?.disallow.some(isBlanketDisallowPattern) ?? false;
  const blanketNoai = entries.some(
    (e) => e.scope === null && e.directive === "noai",
  );
  return blanketDisallow || blanketNoai;
}

/**
 * AI-files presence (10%): 5 points when robots.txt declares a sitemap
 * (accessible to AI crawlers) plus 5 points when the page links its llms.txt
 * (`<link rel="llms.txt">`, per the llms.txt proposal). The /llms.txt HEAD
 * probe lives in the platform engine (T23); this component only uses the
 * inputs available to the crawler engine.
 */
function aiFilesScore(robots: RobotsTxt, $: CheerioAPI): number {
  let score = 0;
  if (robots.sitemaps.length > 0) score += 5;
  if ($('link[rel="llms.txt"]').length > 0) score += 5;
  return score;
}

function computeComposite(
  perBot: BotAccess[],
  robots: RobotsTxt,
  entries: DirectiveEntry[],
  $: CheerioAPI,
): { compositeScore: number; components: CrawlerAccessComponents } {
  const tier1Total = perBot.filter((b) => b.tier === "Tier1").length;
  const tier2Total = perBot.filter((b) => b.tier === "Tier2").length;
  // RFC 9309 default: no matching rule means allowed — NotMentioned counts as
  // accessible (RCR-10 maps "no rules" to Allowed); only Blocked is a penalty.
  const tier1Accessible = perBot.filter(
    (b) => b.tier === "Tier1" && b.status !== "Blocked",
  ).length;
  const tier2Accessible = perBot.filter(
    (b) => b.tier === "Tier2" && b.status !== "Blocked",
  ).length;

  const tier1Score = tier1Total > 0 ? (tier1Accessible / tier1Total) * 50 : 0;
  const tier2Score = tier2Total > 0 ? (tier2Accessible / tier2Total) * 25 : 0;
  const blanketBonus = hasBlanketBlock(robots, entries) ? 0 : 15;
  const aiFiles = aiFilesScore(robots, $);

  const raw = tier1Score + tier2Score + blanketBonus + aiFiles;
  const compositeScore = Math.min(100, round1(raw));
  const components: CrawlerAccessComponents = {
    tier1: round1(tier1Score),
    tier2: round1(tier2Score),
    blanketBonus,
    aiFiles,
  };
  return { compositeScore, components };
}

/**
 * Computes the crawler access map for a page. `path` defaults to `/` (the
 * site root — the design signature); callers may pass the audited page path
 * to evaluate per-path access (RCR-3).
 */
export function scoreAccess(
  robots: RobotsTxt,
  headers: Headers,
  $: CheerioAPI,
  path = "/",
): CrawlerAccessResult {
  const entries = [
    ...parseHeaderDirectives(headers),
    ...parseMetaDirectives($),
  ];

  const perBot: BotAccess[] = BOTS.map((agent) => {
    const { status, matchedRule } = evaluateRobots(
      agent.userAgent,
      robots,
      path,
    );
    const signals = signalsForBot(agent.userAgent, entries);
    const base = {
      userAgent: agent.userAgent,
      tier: agent.tier,
      status,
      matchedRule,
      impact: agent.impact,
      signals,
    };
    return { ...base, recommendation: recommendationFor(base) };
  });

  const { compositeScore, components } = computeComposite(
    perBot,
    robots,
    entries,
    $,
  );
  return { compositeScore, perBot, components };
}

/**
 * Maps the rich engine output to the shared `CrawlerResult` contract consumed
 * by AuditResult (T25): Allowed -> allowed, Blocked -> blocked,
 * NotMentioned -> unknown.
 */
export function toContractResult(result: CrawlerAccessResult): CrawlerResult {
  const perBot: Record<string, "allowed" | "blocked" | "unknown"> = {};
  for (const entry of result.perBot) {
    perBot[entry.userAgent] = STATUS_TO_CONTRACT[entry.status];
  }
  return { compositeScore: result.compositeScore, perBot };
}
