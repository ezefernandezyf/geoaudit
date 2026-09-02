import { z } from "zod";

/**
 * Cross-engine AuditResult contract (D3 shape, RAO-10).
 * Only shapes consumed by >= 2 modules live here; engine-local I/O types stay in
 * each engine's `src/<domain>/types.ts`.
 */

export const severityBandSchema = z.enum([
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Critical",
]);

export type SeverityBand = z.infer<typeof severityBandSchema>;

export const crawlerResultSchema = z.object({
  compositeScore: z.number().min(0).max(100),
  perBot: z.record(z.string(), z.enum(["allowed", "blocked", "unknown"])),
});

export type CrawlerResult = z.infer<typeof crawlerResultSchema>;

export const citabilityResultSchema = z.object({
  pageScore: z.number().min(0).max(100),
  coverage: z.number().min(0).max(100),
  top3: z.array(z.string()),
  bottom3: z.array(z.string()),
  suggestions: z.array(
    z.object({
      block: z.string(),
      key: z.string(),
    }),
  ),
});

export type CitabilityResult = z.infer<typeof citabilityResultSchema>;

export const schemaResultSchema = z.object({
  detected: z.array(z.record(z.string(), z.unknown())),
  issues: z.array(z.string()),
  generated: z.record(z.string(), z.unknown()).nullable(),
  businessType: z.string(),
  /** Rubric score (0-100) from the schema engine (RSC-14). */
  score: z.number().min(0).max(100),
});

export type SchemaResult = z.infer<typeof schemaResultSchema>;

export const platformResultSchema = z.object({
  headers: z.array(z.record(z.string(), z.unknown())),
  meta: z.record(z.string(), z.unknown()),
  og: z.record(z.string(), z.unknown()),
  twitter: z.record(z.string(), z.unknown()),
  ssr: z.record(z.string(), z.unknown()),
  probes: z.record(z.string(), z.unknown()),
  perPlatform: z.record(z.string(), z.unknown()),
});

export type PlatformResult = z.infer<typeof platformResultSchema>;

export const contentResultSchema = z.object({
  experience: z.number().min(0).max(25),
  expertise: z.number().min(0).max(25),
  authoritativeness: z.number().min(0).max(25),
  trustworthiness: z.number().min(0).max(25),
  composite: z.number().min(0).max(100),
  wordCount: z.number().nonnegative(),
  headings: z.number().nonnegative(),
  freshness: z.record(z.string(), z.unknown()),
  topicalAuthority: z.string(),
});

export type ContentResult = z.infer<typeof contentResultSchema>;

/**
 * Brand Authority engine result (BRA-6, design D4). Six engines as of v3.0.0:
 * status "success" with a measured score (0 = no external presence, a real
 * penalty) or "error" with a reason (BRA-7 failure isolation - rate_limit,
 * timeout, ... never a throw).
 */
export const brandAuthorityResultSchema = z.object({
  status: z.enum(["success", "error"]),
  /** Null on success; rate-limit/timeout/block reason on error (BRA-7). */
  reason: z.string().nullable(),
  score: z.number().min(0).max(100),
  signals: z.object({
    entityPresence: z.boolean(),
    entityConsistency: z.boolean(),
    wikidataCompleteness: z.number().min(0).max(100),
  }),
  entity: z.object({
    wikipediaTitle: z.string().nullable(),
    /** Q-number or null. */
    wikidataId: z.string().nullable(),
    wikidataLabel: z.string().nullable(),
  }),
});

export type BrandAuthorityResult = z.infer<typeof brandAuthorityResultSchema>;

export const auditResultSchema = z.object({
  summary: z.object({
    url: z.url("Invalid URL format"),
    geoScore: z.number().min(0).max(100),
    severityBand: severityBandSchema,
    durationMs: z.number().nonnegative(),
  }),
  crawlers: crawlerResultSchema,
  citability: citabilityResultSchema,
  schema: schemaResultSchema,
  platform: platformResultSchema,
  content: contentResultSchema,
  /** Optional so legacy 2.0.0 rows validate (RAO-16); written by v3 audits. */
  brandAuthority: brandAuthorityResultSchema.optional(),
  /** RAO-16/RGS-7: legacy rows keep "2.0.0"; new audits write "3.1.0". The
   * read union widens to 2.0.0 | 3.0.0 | 3.1.0 - no DB migration. */
  scoringModelVersion: z.union([
    z.literal("2.0.0"),
    z.literal("3.0.0"),
    z.literal("3.1.0"),
  ]),
  meta: z.object({
    auditVersion: z.string(),
    startedAt: z.number(),
    completedAt: z.number(),
    errors: z.array(z.string()),
  }),
});

export type AuditResult = z.infer<typeof auditResultSchema>;

/**
 * Multi-page master result light shape (D3, MPA-6) - what the master `Audit`
 * row persists in `result`. Aditive to `auditResultSchema`: single-page
 * results keep their own shape and are untouched (MPA-9). Each `AuditPage`
 * row holds the FULL per-page `AuditResult`; the master keeps only the
 * aggregate + per-page summaries so the master JSON stays small.
 */
export const multiPageResultSchema = z.object({
  aggregate: z.object({
    url: z.string(),
    geoScore: z.number().min(0).max(100),
    severityBand: severityBandSchema,
    durationMs: z.number().nonnegative(),
  }),
  pages: z.array(
    z.object({
      url: z.string(),
      geoScore: z.number().min(0).max(100),
      severityBand: severityBandSchema,
      durationMs: z.number().nonnegative(),
    }),
  ),
});

export type MultiPageResult = z.infer<typeof multiPageResultSchema>;
