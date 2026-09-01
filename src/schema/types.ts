/**
 * Engine-local schema I/O types (design: engine-local types keep engines
 * self-contained and avoid contract-bloat). Cross-engine shapes live in
 * `src/lib/contracts/` - this engine maps to `SchemaResult` there via
 * `toContractResult` (see index.ts).
 *
 * Pipeline: extract (RSC-1) -> parse (RSC-2/RSC-12) -> validate (RSC-3..RSC-7)
 * -> classify (RSC-8) -> generate (RSC-9) -> rubric score + contract mapping.
 */

import { load } from "cheerio";

/**
 * Cheerio does not re-export its node types and `domhandler` is not a direct
 * dependency (pnpm strict layout), so the element type is derived from the
 * `load()` signature instead of a transitive import (same pattern as
 * `src/citability/types.ts` and `src/eeat/types.ts`).
 */
export type AnyNode = Exclude<
  NonNullable<Parameters<typeof load>[0]>,
  string | Buffer | unknown[]
>;

/** One `<script type="application/ld+json">` element (RSC-1). */
export interface RawBlock {
  /** 0-based position in document order. */
  index: number;
  /** Exact text content of the script element, unmodified. */
  raw: string;
}

/** A per-block JSON.parse failure (RSC-2/RSC-12): never thrown, always collected. */
export interface ParseWarning {
  index: number;
  message: string;
}

/** A successfully parsed JSON-LD block. */
export interface ParsedBlock {
  index: number;
  raw: string;
  /**
   * `JSON.parse` result - an object, a top-level array, or an @graph wrapper
   * (RSC-10). Nodes inside arrays/@graph are flattened at validation time.
   */
  data: unknown;
}

export interface ParseResult {
  blocks: ParsedBlock[];
  warnings: ParseWarning[];
  /** "no_structured_data" when zero blocks were found (RSC-11); null otherwise. */
  reason: "no_structured_data" | null;
}

/** Simplified business-type classification (RSC-8). */
export type BusinessType =
  "saas" | "local" | "ecommerce" | "publisher" | "agency" | "hybrid";

/** One validation finding on a node or block (RSC-3..RSC-7). */
export interface SchemaIssue {
  /** Owning block index; null when the issue is not block-scoped. */
  blockIndex: number | null;
  /**
   * Stable machine key: `unknown_type`, `missing_required`,
   * `missing_recommended`, `missing_sameAs`, `invalid_sameAs`,
   * `deprecated_howto`, `deprecated_faqpage`.
   */
  key: string;
  severity: "Error" | "Warning" | "Info";
  message: string;
  /** Schema.org @type the issue refers to; null when unknown. */
  type: string | null;
  /** Property the issue refers to; null when not property-scoped. */
  property: string | null;
}

/** One flattened JSON-LD node validated against the type registry. */
export interface ValidatedNode {
  blockIndex: number;
  /** Resolved @type name (first string when @type is an array). */
  type: string;
  /** The full node as parsed (all original properties preserved). */
  raw: Record<string, unknown>;
  /** False when the type is not in the registry (still included, RSC-3). */
  known: boolean;
  /** Canonical registry key ("organization", ...) when known; null otherwise. */
  registryType: string | null;
  issues: SchemaIssue[];
}

export interface ValidationResult {
  nodes: ValidatedNode[];
  issues: SchemaIssue[];
}

/** One row of the 12-criterion scoring rubric (sums to 100). */
export interface RubricCriterion {
  key: string;
  label: string;
  points: number;
  max: number;
}

export interface SchemaRubric {
  /** Sum of the criterion points, 0-100. */
  score: number;
  criteria: RubricCriterion[];
}

export interface SchemaEngineResult {
  /** Parsed JSON-LD records as detected (array/@graph wrappers flattened to records). */
  detected: Record<string, unknown>[];
  warnings: ParseWarning[];
  nodes: ValidatedNode[];
  issues: SchemaIssue[];
  businessType: BusinessType;
  /** Corrected JSON-LD (RSC-9); always generated for a known business type. */
  generated: Record<string, unknown> | null;
  rubric: SchemaRubric;
  /** Rubric score 0-100 (12-criterion rubric). */
  score: number;
  reason: "no_structured_data" | null;
}
