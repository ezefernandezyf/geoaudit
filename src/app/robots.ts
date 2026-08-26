import type { MetadataRoute } from "next";

/**
 * robots.txt (LND-10, sprint 9). Generated via the Next App Router metadata
 * route so AI crawlers are explicitly allowed — the crawler engine rewards
 * sites whose robots.txt grants access to the AI search surfaces.
 *
 * The allow-list matches the authoritative 17-bot registry in
 * `src/crawlers/bots.ts`: GPTBot, OAI-SearchBot, ClaudeBot / Anthropic-AI,
 * PerplexityBot, Googlebot, Google-Extended, Bingbot and the broader AI
 * ecosystem (Applebot-Extended, CCBot, meta-externalagent, FacebookBot,
 * Omgili, ImagesiftBot, Diffbot, cohere-ai, Bytespider). Explicit `Allow`
 * directives leave no room for a default-deny interpretation.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: "/",
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      {
        userAgent: "Bingbot",
        allow: "/",
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
      },
      {
        userAgent: "CCBot",
        allow: "/",
      },
      {
        userAgent: "meta-externalagent",
        allow: "/",
      },
      {
        userAgent: "FacebookBot",
        allow: "/",
      },
      {
        userAgent: "Omgili",
        allow: "/",
      },
      {
        userAgent: "ImagesiftBot",
        allow: "/",
      },
      {
        userAgent: "Diffbot",
        allow: "/",
      },
      {
        userAgent: "cohere-ai",
        allow: "/",
      },
      {
        userAgent: "Bytespider",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
