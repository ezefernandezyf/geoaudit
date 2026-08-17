/**
 * Presentation formatting helpers for the report domain (U4). Pure functions —
 * no React, fully unit-testable.
 */

/** Formats an audit duration in ms as seconds with one decimal: 3214 → "3.2 s". */
export function formatDurationMs(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)} s`;
}

/** Formats an audit timestamp as a localized es-AR date (date only, no time). */
export function formatAuditDate(timestampMs: number): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
    new Date(timestampMs),
  );
}
