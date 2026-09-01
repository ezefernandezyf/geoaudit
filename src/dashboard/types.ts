import type { SeverityBand } from "@/lib/contracts/audit-result";

/**
 * Row contract for the dashboard domain (design U4). A projection of the
 * persisted Audit model: only the fields the dashboard renders. The full
 * `result` JSON stays with the detailed report - the dashboard reads it never.
 */
export type DashboardAudit = {
  id: string;
  url: string;
  geoScore: number;
  severityBand: SeverityBand;
  createdAt: Date;
  /** True when the persisted `result` is the multi-page shape (DSH-10). */
  isMultiPage?: boolean;
};
