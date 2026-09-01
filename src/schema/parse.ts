import type { ParsedBlock, ParseResult, ParseWarning, RawBlock } from "./types";

/** Stable reason string for pages without structured data (RSC-11). */
export const NO_STRUCTURED_DATA_REASON = "no_structured_data";

/**
 * JSON-LD parsing (RSC-2, RSC-12, RSC-11).
 *
 * Each block is `JSON.parse`d independently. Per-block failures are collected
 * as warnings carrying the block index - never thrown - and valid blocks are
 * still processed (RSC-12). Zero successfully parsed blocks produce reason
 * "no_structured_data" (RSC-11).
 */
export function parseBlocks(rawBlocks: RawBlock[]): ParseResult {
  const blocks: ParsedBlock[] = [];
  const warnings: ParseWarning[] = [];

  for (const block of rawBlocks) {
    const text = block.raw.trim();
    if (text.length === 0) {
      warnings.push({ index: block.index, message: "empty JSON-LD block" });
      continue;
    }
    try {
      blocks.push({
        index: block.index,
        raw: block.raw,
        data: JSON.parse(text) as unknown,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "parse failure";
      warnings.push({
        index: block.index,
        message: `invalid JSON: ${detail}`,
      });
    }
  }

  return {
    blocks,
    warnings,
    reason: blocks.length === 0 ? NO_STRUCTURED_DATA_REASON : null,
  };
}

/**
 * Flattens parsed JSON-LD into the individual node records (RSC-10): top-level
 * arrays and `@graph` children are unwrapped recursively; plain objects are
 * returned as-is. Non-record values (strings, numbers) are skipped.
 */
export function flattenToRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenToRecords(item));
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const graph = record["@graph"];
    if (Array.isArray(graph)) {
      return graph.flatMap((item) => flattenToRecords(item));
    }
    if (graph !== null && typeof graph === "object") {
      return flattenToRecords(graph);
    }
    return [record];
  }
  return [];
}

/**
 * Resolves the @type of a node: the first string when @type is an array,
 * the string itself when scalar, or null when absent.
 */
export function resolveTypeName(
  record: Record<string, unknown>,
): string | null {
  const type = record["@type"];
  if (typeof type === "string") return type;
  if (Array.isArray(type)) {
    const first = type.find(
      (entry): entry is string => typeof entry === "string",
    );
    return first ?? null;
  }
  return null;
}

/**
 * Collects every @type name found in parsed blocks, recursively through
 * arrays and @graph (RSC-8 on-page signal source). Nested types (e.g. an
 * author Person inside an Article) are included.
 */
export function collectTypeNames(blocks: ParsedBlock[]): string[] {
  const names: string[] = [];
  for (const block of blocks) {
    collectTypeNamesFromValue(block.data, names);
  }
  return names;
}

function collectTypeNamesFromValue(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectTypeNamesFromValue(item, out);
    return;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const type = record["@type"];
    if (typeof type === "string") out.push(type);
    else if (Array.isArray(type)) {
      for (const entry of type) {
        if (typeof entry === "string") out.push(entry);
      }
    }
    const graph = record["@graph"];
    if (graph !== undefined) {
      collectTypeNamesFromValue(graph, out);
    } else {
      for (const child of Object.values(record)) {
        collectTypeNamesFromValue(child, out);
      }
    }
  }
}
