import type { RobotsTxt, RuleGroup } from "@/lib/contracts/fetch-types";

/**
 * Hand-rolled RFC 9309 subset parser (design D2 - ~150 lines, zero deps,
 * fully fixture-testable). Returns the shared `RobotsTxt` contract shape;
 * matching semantics (group selection, longest-match, Allow-wins-ties, `$`
 * anchor) are exposed as pure helpers so the access map can compose them.
 *
 * Subset notes:
 * - User-agent tokens and path patterns are matched case-insensitively per
 *   task instruction (a deliberate superset of RFC 9309, which is
 *   case-insensitive on user-agents but case-sensitive on paths).
 * - `Content-Signal:` (IETF draft) is informational and NOT part of the
 *   RobotsTxt contract - expose `parseContentSignal` for it.
 * - Crawl-delay is not in RFC 9309 (removed from 7231) but is parsed per RCR-7.
 */

const KNOWN_SIGNAL_KEYS = [
  "ai-train",
  "search",
  "ai-personalization",
  "ai-retrieval",
] as const;

/** A parsed Content-Signal entry (RCR-7 - informational). */
export interface ContentSignalEntry {
  key: string;
  value: string;
  /** True when the key is known and the value is `yes`/`no` (IETF draft). */
  valid: boolean;
}

/** Result of matching one path against one group's rules (RCR-3). */
export interface PathMatch {
  decision: "allow" | "disallow";
  /** Original pattern text as written in robots.txt (keeps a trailing `$`). */
  pattern: string;
}

interface GroupAcc {
  userAgents: string[];
  allow: string[];
  disallow: string[];
  /** True once a rule line (allow/disallow/crawl-delay) has been seen. */
  hasRules: boolean;
  crawlDelay: number | null;
}

function stripComment(line: string): string {
  const hash = line.indexOf("#");
  return hash === -1 ? line : line.slice(0, hash);
}

function splitDirective(line: string): { key: string; value: string } {
  const colon = line.indexOf(":");
  if (colon === -1) return { key: line.trim().toLowerCase(), value: "" };
  return {
    key: line.slice(0, colon).trim().toLowerCase(),
    value: line.slice(colon + 1).trim(),
  };
}

function collectContentSignalLines(body: string): string[] {
  const values: string[] = [];
  for (const rawLine of body.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim();
    if (line.length === 0) continue;
    const { key, value } = splitDirective(line);
    if (key === "content-signal" && value.length > 0) values.push(value);
  }
  return values;
}

/**
 * Parses `Content-Signal:` directives (IETF draft, RCR-7 - informational only).
 * Each value is a comma-separated list of `key=value` pairs; only `yes`/`no`
 * values for the known keys are considered valid.
 */
export function parseContentSignal(body: string): ContentSignalEntry[] {
  const entries: ContentSignalEntry[] = [];
  for (const value of collectContentSignalLines(body)) {
    for (const pair of value.split(",")) {
      const eq = pair.indexOf("=");
      const key = (eq === -1 ? pair : pair.slice(0, eq)).trim().toLowerCase();
      const rawValue =
        eq === -1
          ? ""
          : pair
              .slice(eq + 1)
              .trim()
              .toLowerCase();
      const valid =
        (KNOWN_SIGNAL_KEYS as readonly string[]).includes(key) &&
        (rawValue === "yes" || rawValue === "no");
      entries.push({ key, value: rawValue, valid });
    }
  }
  return entries;
}

function parseCrawlDelayValue(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Parses a robots.txt body into the shared `RobotsTxt` contract shape.
 * Empty/comment-only bodies yield an empty structure (RCR-10 - the caller
 * treats "no rules" as all-allowed). Group assembly: consecutive user-agent
 * lines extend the current group; a user-agent line after rules starts a new
 * group; rule lines before any user-agent line are ignored (RFC 9309).
 */
export function parseRobotsTxt(body: string): RobotsTxt {
  const groups: GroupAcc[] = [];
  let current: GroupAcc | null = null;
  const sitemaps: string[] = [];

  for (const rawLine of body.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim();
    if (line.length === 0) continue;
    const { key, value } = splitDirective(line);

    switch (key) {
      case "user-agent": {
        const tokens = value
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        if (tokens.length === 0) break;
        if (current !== null && current.hasRules) {
          groups.push(current);
          current = null;
        }
        if (current === null) {
          current = {
            userAgents: [],
            allow: [],
            disallow: [],
            hasRules: false,
            crawlDelay: null,
          };
        }
        current.userAgents.push(...tokens);
        break;
      }
      case "allow":
      case "disallow": {
        if (current === null) break; // rules without a user-agent line are ignored
        current.hasRules = true;
        (key === "allow" ? current.allow : current.disallow).push(value);
        break;
      }
      case "crawl-delay": {
        if (current === null) break;
        current.hasRules = true;
        const delay = parseCrawlDelayValue(value);
        if (delay !== null && current.crawlDelay === null)
          current.crawlDelay = delay;
        break;
      }
      case "sitemap": {
        if (value.length > 0) sitemaps.push(value);
        break;
      }
      default:
        break; // host, content-signal, unknown -> ignored here
    }
  }
  if (current !== null) groups.push(current);

  const wildcard = groups.find((g) => g.userAgents.includes("*"));
  const firstWithDelay = groups.find((g) => g.crawlDelay !== null);
  const crawlDelay = wildcard?.crawlDelay ?? firstWithDelay?.crawlDelay ?? null;

  const plain: RuleGroup[] = groups.map((g) => ({
    userAgents: g.userAgents,
    allow: g.allow,
    disallow: g.disallow,
  }));

  return { groups: plain, sitemaps, crawlDelay };
}

/**
 * Selects the applicable group for a user agent (RCR-3): an exact token match
 * (case-insensitive) wins over the `*` wildcard group; null when neither exists.
 */
export function selectGroup(
  groups: RuleGroup[],
  userAgent: string,
): RuleGroup | null {
  const needle = userAgent.toLowerCase();
  const exact = groups.find((g) =>
    g.userAgents.some((ua) => ua.toLowerCase() === needle),
  );
  if (exact) return exact;
  return groups.find((g) => g.userAgents.includes("*")) ?? null;
}

/** Effective matched length of a pattern against a lowercased path, or null. */
function matchLength(pattern: string, lowerPath: string): number | null {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const lower = body.toLowerCase();
  if (lower === "*" || lower === "") return 0; // universal pattern
  if (anchored) return lowerPath === lower ? body.length : null;
  return lowerPath.startsWith(lower) ? body.length : null;
}

/**
 * Evaluates a path against one group's rules (RCR-3): among all matching rules
 * the longest pattern wins; on equal length Allow wins over Disallow; no match
 * means the default is allow (returns null). Patterns are matched
 * case-insensitively and `$` anchors match the exact path end.
 */
export function matchPath(group: RuleGroup, path: string): PathMatch | null {
  const lowerPath = path.toLowerCase();
  const candidates: Array<{
    decision: "allow" | "disallow";
    pattern: string;
    len: number;
  }> = [];

  for (const pattern of group.allow) {
    const len = matchLength(pattern, lowerPath);
    if (len !== null) candidates.push({ decision: "allow", pattern, len });
  }
  for (const pattern of group.disallow) {
    const len = matchLength(pattern, lowerPath);
    if (len !== null) candidates.push({ decision: "disallow", pattern, len });
  }
  if (candidates.length === 0) return null;

  const maxLen = Math.max(...candidates.map((c) => c.len));
  const winners = candidates.filter((c) => c.len === maxLen);
  const allowWinner = winners.find((w) => w.decision === "allow");
  const chosen = allowWinner ?? winners[0];
  return { decision: chosen.decision, pattern: chosen.pattern };
}
