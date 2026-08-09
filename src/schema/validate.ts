import { flattenToRecords, resolveTypeName } from "./parse";
import { DEPRECATED_SCHEMAS, findRegistryEntry, profileFor } from "./registry";
import type {
  ParsedBlock,
  SchemaIssue,
  ValidatedNode,
  ValidationResult,
} from "./types";

/**
 * JSON-LD validation (RSC-3..RSC-7, RSC-10).
 *
 * Each parsed block is flattened (top-level arrays and @graph children become
 * individual nodes — RSC-10) and every node is validated against the static
 * 8-type registry:
 * - unknown @type  -> flagged, node still included (RSC-3)
 * - missing required/recommended properties per the registry (RSC-4/RSC-5)
 * - sameAs presence/validity on Organization, LocalBusiness and Person (RSC-6)
 * - deprecated type flags: HowTo and FAQPage (RSC-7)
 *
 * Validation never throws: issues are collected and returned with the nodes.
 */

const HTTP_URL_RE = /^https?:\/\//i;

/** A property counts as present when it holds a non-empty value. */
function hasValue(data: Record<string, unknown>, prop: string): boolean {
  const value = data[prop];
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function sameAsIssues(
  blockIndex: number,
  typeName: string,
  data: Record<string, unknown>,
): SchemaIssue[] {
  if (!hasValue(data, "sameAs")) {
    return [
      {
        blockIndex,
        key: "missing_sameAs",
        severity: "Warning",
        type: typeName,
        property: "sameAs",
        message: `Missing sameAs (no platform profile links) for ${typeName}`,
      },
    ];
  }
  const value = data["sameAs"];
  const values = Array.isArray(value) ? value : [value];
  const validCount = values.filter(
    (entry): entry is string =>
      typeof entry === "string" && HTTP_URL_RE.test(entry.trim()),
  ).length;
  if (validCount !== values.length) {
    return [
      {
        blockIndex,
        key: "invalid_sameAs",
        severity: "Warning",
        type: typeName,
        property: "sameAs",
        message: `sameAs contains ${values.length - validCount} non-URL value(s)`,
      },
    ];
  }
  return [];
}

/** sameAs is required on Organization, LocalBusiness and Person (RSC-6). */
function needsSameAsCheck(registryKey: string, matchedType: string): boolean {
  return (
    registryKey === "organization" ||
    registryKey === "local_business" ||
    (registryKey === "article_person" && matchedType === "Person")
  );
}

/** Validates one flattened node against the registry. */
export function validateNode(
  blockIndex: number,
  data: Record<string, unknown>,
): ValidatedNode {
  const typeName = resolveTypeName(data);
  const match = findRegistryEntry(typeName);
  const issues: SchemaIssue[] = [];

  // Deprecated flags apply to known AND unknown types (HowTo is not in the
  // 8-type registry but must still be flagged — RSC-7).
  if (typeName !== null) {
    const deprecated = DEPRECATED_SCHEMAS.find(
      (entry_) => entry_.type.toLowerCase() === typeName.toLowerCase(),
    );
    if (deprecated) {
      issues.push({
        blockIndex,
        key: deprecated.flag,
        severity: "Info",
        type: typeName,
        property: null,
        message: `${typeName}: ${deprecated.note}`,
      });
    }
  }

  if (!match) {
    issues.push({
      blockIndex,
      key: "unknown_type",
      severity: "Warning",
      type: typeName,
      property: null,
      message: `Unknown @type ${typeName === null ? "(none)" : JSON.stringify(typeName)} is not in the schema registry; node included without validation`,
    });
    return {
      blockIndex,
      type: typeName ?? "(none)",
      raw: data,
      known: false,
      registryType: null,
      issues,
    };
  }

  const { entry, matchedType } = match;
  const profile = profileFor(entry, matchedType);

  for (const prop of profile.required) {
    if (!hasValue(data, prop)) {
      issues.push({
        blockIndex,
        key: "missing_required",
        severity: "Error",
        type: matchedType,
        property: prop,
        message: `Missing required property "${prop}" for ${matchedType}`,
      });
    }
  }
  for (const prop of profile.recommended) {
    if (!hasValue(data, prop)) {
      issues.push({
        blockIndex,
        key: "missing_recommended",
        severity: "Warning",
        type: matchedType,
        property: prop,
        message: `Missing recommended property "${prop}" for ${matchedType}`,
      });
    }
  }

  if (needsSameAsCheck(entry.key, matchedType)) {
    issues.push(...sameAsIssues(blockIndex, matchedType, data));
  }

  if (entry.deprecated) {
    issues.push({
      blockIndex,
      key: entry.deprecated.flag,
      severity: "Info",
      type: matchedType,
      property: null,
      message: `${matchedType}: ${entry.deprecated.note}`,
    });
  }

  return {
    blockIndex,
    type: matchedType,
    raw: data,
    known: true,
    registryType: entry.key,
    issues,
  };
}

/** Validates every node of every parsed block (through arrays/@graph). */
export function validateBlocks(parsed: ParsedBlock[]): ValidationResult {
  const nodes: ValidatedNode[] = [];
  const issues: SchemaIssue[] = [];
  for (const block of parsed) {
    for (const record of flattenToRecords(block.data)) {
      const node = validateNode(block.index, record);
      nodes.push(node);
      issues.push(...node.issues);
    }
  }
  return { nodes, issues };
}
