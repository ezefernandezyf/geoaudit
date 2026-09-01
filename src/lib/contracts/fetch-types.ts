import { z } from "zod";
import type { CheerioAPI } from "cheerio";

/**
 * Shared fetch-layer contracts (single source of truth, server + client).
 * Consumed by `src/lib/fetch/*` and the audit orchestrator (RFL-8/RFL-11, RAO-10).
 */

export const fetchErrorCodeSchema = z.enum([
  "SSRF_BLOCKED",
  "TIMEOUT",
  "NETWORK_ERROR",
  "DNS_FAILURE",
  "HTTP_STATUS",
  "TOO_LARGE",
  "TOO_MANY_REDIRECTS",
]);

export const fetchErrorSchema = z.object({
  code: fetchErrorCodeSchema,
  message: z.string(),
});

export type FetchErrorCode = z.infer<typeof fetchErrorCodeSchema>;
export type FetchError = z.infer<typeof fetchErrorSchema>;

/**
 * Parsed page handed from the fetch layer to the audit orchestrator.
 * `$` and `headers` are runtime objects (CheerioAPI / Web Headers) that are not
 * JSON-serializable; they are validated with `z.custom` pass-through checks.
 */
export const parsedPageSchema = z.object({
  html: z.string(),
  $: z.custom<CheerioAPI>(),
  headers: z.custom<Headers>(),
  finalUrl: z.string(),
  charset: z.string(),
  statusCode: z.number(),
  contentType: z.string().nullable(),
});

export type ParsedPage = z.infer<typeof parsedPageSchema>;

/**
 * Typed fetch result - never throws (RFL-11). Discriminated at the type level on
 * `ok`; the failure branch is further discriminated by `reason` (content gate)
 * vs `error` (typed transport error).
 */
export const fetchResultSchema = z.union([
  z.object({ ok: z.literal(true), parsed: parsedPageSchema }),
  z.object({
    ok: z.literal(false),
    reason: z.literal("unsupported_content_type"),
    contentType: z.string().nullable(),
  }),
  z.object({ ok: z.literal(false), error: fetchErrorSchema }),
]);

export type FetchResult = z.infer<typeof fetchResultSchema>;

/** RFC 9309 rule group (RCR-7 ancillary directives live on RobotsTxt). */
export const ruleGroupSchema = z.object({
  userAgents: z.array(z.string()),
  allow: z.array(z.string()),
  disallow: z.array(z.string()),
});

export type RuleGroup = z.infer<typeof ruleGroupSchema>;

export const robotsTxtSchema = z.object({
  groups: z.array(ruleGroupSchema),
  sitemaps: z.array(z.string()),
  crawlDelay: z.number().nullable(),
});

export type RobotsTxt = z.infer<typeof robotsTxtSchema>;
