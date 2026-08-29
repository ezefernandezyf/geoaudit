import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Crawl/AI assets (LND-10, sprint 9): robots.txt, sitemap.xml and llms.txt
 * must be served at the site root — the platform engine probes each with a
 * HEAD request (probeSite → /sitemap.xml + /llms.txt) and the crawler engine
 * parses /robots.txt, rewarding explicit AI-crawler access.
 */

describe("robots.ts (LND-10)", () => {
  it("allows the Tier-1 AI crawlers explicitly", () => {
    const output = robots();
    const rules = Array.isArray(output.rules) ? output.rules : [output.rules];
    const userAgents = rules
      .map((rule) => rule.userAgent)
      .filter((ua): ua is string => typeof ua === "string");
    for (const bot of [
      "GPTBot",
      "OAI-SearchBot",
      "ClaudeBot",
      "anthropic-ai",
      "PerplexityBot",
      "Googlebot",
      "Google-Extended",
      "Bingbot",
      "CCBot",
    ]) {
      expect(userAgents).toContain(bot);
    }
  });

  it("grants Allow / to every listed agent", () => {
    const output = robots();
    const rules = Array.isArray(output.rules) ? output.rules : [output.rules];
    for (const rule of rules) {
      expect(rule.allow).toBe("/");
    }
  });

  it("references the sitemap URL", () => {
    const output = robots();
    expect(output.sitemap).toContain("/sitemap.xml");
  });
});

describe("sitemap.ts (LND-10)", () => {
  it("lists the public routes", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toHaveLength(3);
    for (const route of ["", "/login", "/signup"]) {
      expect(urls.some((url) => url.endsWith(route))).toBe(true);
    }
  });

  it("prioritizes the landing and stamps a lastModified date", () => {
    const entries = sitemap();
    const landing = entries.find((entry) => entry.priority === 1);
    expect(landing).toBeDefined();
    expect(landing?.url).not.toContain("/pricing");
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.changeFrequency).toBe("monthly");
    }
  });
});

describe("public/llms.txt (LND-10)", () => {
  const LLMS_PATH = join(process.cwd(), "public", "llms.txt");

  it("exists at the site root (served at /llms.txt)", () => {
    expect(existsSync(LLMS_PATH)).toBe(true);
  });

  it("follows the standard format: title, summary and link list", () => {
    const content = readFileSync(LLMS_PATH, "utf8");
    // Standard llms.txt: a # title, a > summary, and markdown links.
    expect(content).toMatch(/^# GeoAudit/m);
    expect(content).toMatch(/^> /m);
    expect(content).toMatch(/\[.*\]\(https?:\/\/.*\)/);
  });

  it("links the public pages", () => {
    const content = readFileSync(LLMS_PATH, "utf8");
    const hrefs = [
      ...content.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/g),
    ].map((match) => match[1]);
    for (const route of ["/", "/login", "/signup"]) {
      expect(hrefs.some((href) => href.endsWith(route))).toBe(true);
    }
  });
});
