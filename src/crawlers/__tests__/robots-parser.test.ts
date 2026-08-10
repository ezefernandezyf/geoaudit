import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  matchPath,
  parseContentSignal,
  parseRobotsTxt,
  selectGroup,
} from "@/crawlers/robots-parser";
import type { PathMatch } from "@/crawlers/robots-parser";
import { robotsTxtSchema } from "@/lib/contracts/fetch-types";
import type { RuleGroup } from "@/lib/contracts/fetch-types";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function robotsFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), "utf8");
}

describe("parseRobotsTxt (RCR-2, RCR-7, RCR-10)", () => {
  it("parses an empty body into an empty RobotsTxt (RCR-10: all allowed)", () => {
    const parsed = parseRobotsTxt(robotsFixture("robots-empty.txt"));
    expect(parsed).toEqual({ groups: [], sitemaps: [], crawlDelay: null });
    expect(robotsTxtSchema.safeParse(parsed).success).toBe(true);
  });

  it("parses a basic group with allow and disallow rules", () => {
    const parsed = parseRobotsTxt(
      "User-agent: GPTBot\nAllow: /public\nDisallow: /private",
    );
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].userAgents).toEqual(["GPTBot"]);
    expect(parsed.groups[0].allow).toEqual(["/public"]);
    expect(parsed.groups[0].disallow).toEqual(["/private"]);
  });

  it("merges consecutive user-agent lines into one group and starts a new group after rules", () => {
    const body = [
      "User-agent: GPTBot",
      "User-agent: OAI-SearchBot",
      "Disallow: /",
      "",
      "User-agent: *",
      "Allow: /",
    ].join("\n");
    const parsed = parseRobotsTxt(body);
    expect(parsed.groups).toHaveLength(2);
    expect(parsed.groups[0].userAgents).toEqual(["GPTBot", "OAI-SearchBot"]);
    expect(parsed.groups[0].disallow).toEqual(["/"]);
    expect(parsed.groups[1].userAgents).toEqual(["*"]);
    expect(parsed.groups[1].allow).toEqual(["/"]);
  });

  it("strips comments, handles CRLF, and accepts case-insensitive keys", () => {
    const parsed = parseRobotsTxt(
      "# leading comment\r\nUser-Agent: gptbot\r\nDisallow: /private # trailing\r\n",
    );
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].userAgents).toEqual(["gptbot"]);
    expect(parsed.groups[0].disallow).toEqual(["/private"]);
  });

  it("parses Crawl-delay and Sitemap from the fixture (RCR-7)", () => {
    const parsed = parseRobotsTxt(
      robotsFixture("robots-crawl-delay-sitemap.txt"),
    );
    expect(parsed.crawlDelay).toBe(5);
    expect(parsed.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
    expect(parsed.groups).toHaveLength(1);
  });

  it("leaves crawlDelay null when no Crawl-delay directive exists", () => {
    const parsed = parseRobotsTxt("User-agent: *\nDisallow: /admin");
    expect(parsed.crawlDelay).toBeNull();
    expect(parsed.sitemaps).toEqual([]);
  });

  it("parses the pathological fixture into the expected groups and ancillary data", () => {
    const parsed = parseRobotsTxt(robotsFixture("robots-pathological.txt"));
    expect(parsed.groups).toHaveLength(2);
    expect(parsed.groups[0].userAgents).toEqual(["*"]);
    expect(parsed.groups[0].disallow).toEqual(["/admin"]);
    expect(parsed.groups[0].allow).toEqual(["/public"]);
    expect(parsed.groups[1].userAgents).toEqual(["gptbot"]);
    expect(parsed.groups[1].disallow).toEqual(["/private"]);
    expect(parsed.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
    expect(parsed.crawlDelay).toBe(2);
  });

  it("ignores rule lines that appear before any user-agent line", () => {
    const parsed = parseRobotsTxt("Disallow: /\nUser-agent: *\nAllow: /");
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].allow).toEqual(["/"]);
    expect(parsed.groups[0].disallow).toEqual([]);
  });
});

describe("parseContentSignal (RCR-7 — informational)", () => {
  it("parses valid key=value pairs from a Content-Signal line", () => {
    const entries = parseContentSignal(
      "Content-Signal: ai-train=no, search=yes",
    );
    expect(entries).toEqual([
      { key: "ai-train", value: "no", valid: true },
      { key: "search", value: "yes", valid: true },
    ]);
  });

  it("flags unknown keys and invalid values as invalid (IETF draft warning)", () => {
    const entries = parseContentSignal(
      "Content-Signal: ai-train=maybe, unknown-key=yes",
    );
    expect(entries).toEqual([
      { key: "ai-train", value: "maybe", valid: false },
      { key: "unknown-key", value: "yes", valid: false },
    ]);
  });

  it("returns an empty list when no Content-Signal line exists", () => {
    expect(parseContentSignal("User-agent: *\nDisallow: /")).toEqual([]);
  });
});

describe("selectGroup (RCR-3 group selection)", () => {
  const groups: RuleGroup[] = [
    { userAgents: ["*"], allow: [], disallow: [] },
    { userAgents: ["GPTBot"], allow: [], disallow: ["/private"] },
  ];

  it("selects the exact-token group over the wildcard group", () => {
    expect(selectGroup(groups, "GPTBot")).toBe(groups[1]);
  });

  it("matches user-agent tokens case-insensitively", () => {
    expect(selectGroup(groups, "gptbot")).toBe(groups[1]);
  });

  it("falls back to the wildcard group when no exact token matches", () => {
    expect(selectGroup(groups, "PerplexityBot")).toBe(groups[0]);
  });

  it("returns null when neither an exact token nor a wildcard group exists", () => {
    expect(selectGroup([groups[1]], "Bingbot")).toBeNull();
  });
});

describe("matchPath (RCR-3 RFC 9309 subset)", () => {
  const group = (allow: string[], disallow: string[]): RuleGroup => ({
    userAgents: ["*"],
    allow,
    disallow,
  });

  it("uses the longest-match rule between same-decision patterns", () => {
    const result = matchPath(group([], ["/a", "/a/b"]), "/a/b/c");
    expect(result).toEqual({ decision: "disallow", pattern: "/a/b" });
  });

  it("lets Allow win ties on equal path length", () => {
    const result = matchPath(group(["/api"], ["/api"]), "/api");
    expect(result).toEqual({ decision: "allow", pattern: "/api" });
  });

  it("honors the $ anchor: matches the exact path end only", () => {
    const g = group([], ["/tmp$"]);
    expect(matchPath(g, "/tmp")).toEqual({
      decision: "disallow",
      pattern: "/tmp$",
    });
    expect(matchPath(g, "/tmp/file")).toBeNull();
  });

  it("matches paths case-insensitively", () => {
    const result = matchPath(group([], ["/Private"]), "/private");
    expect(result).toEqual({ decision: "disallow", pattern: "/Private" });
  });

  it("returns null (default allow) when no rule matches the path", () => {
    expect(matchPath(group([], ["/admin"]), "/")).toBeNull();
  });

  it("treats the * pattern as a universal match that loses to any longer rule", () => {
    const g = group(["/public"], ["*"]);
    expect(matchPath(g, "/public/x")).toEqual({
      decision: "allow",
      pattern: "/public",
    });
    expect(matchPath(g, "/other")).toEqual({
      decision: "disallow",
      pattern: "*",
    });
  });

  it("prefers a longer Allow rule over a shorter Disallow rule", () => {
    const g = group(["/public"], ["/"]);
    expect(matchPath(g, "/public")).toEqual({
      decision: "allow",
      pattern: "/public",
    });
  });

  it("matches prefix rules against subpaths", () => {
    expect(matchPath(group(["/api"], []), "/api/v2/users")).toEqual({
      decision: "allow",
      pattern: "/api",
    });
  });
});

describe("RCR-3 scenario — exact token group beats wildcard for the same path", () => {
  const body =
    "User-agent: GPTBot\nDisallow: /private\n\nUser-agent: *\nAllow: /private";

  it("disallows GPTBot on /private via its exact group", () => {
    const parsed = parseRobotsTxt(body);
    const gptGroup = selectGroup(parsed.groups, "GPTBot");
    const result: PathMatch | null = gptGroup
      ? matchPath(gptGroup, "/private")
      : null;
    expect(result).toEqual({ decision: "disallow", pattern: "/private" });
  });

  it("allows other bots on /private via the wildcard group", () => {
    const parsed = parseRobotsTxt(body);
    const wildcard = selectGroup(parsed.groups, "PerplexityBot");
    const result: PathMatch | null = wildcard
      ? matchPath(wildcard, "/private")
      : null;
    expect(result).toEqual({ decision: "allow", pattern: "/private" });
  });
});
