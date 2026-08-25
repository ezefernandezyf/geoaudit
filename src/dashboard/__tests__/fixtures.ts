import type { DashboardAudit } from "@/dashboard/types";

/**
 * Dashboard fixtures (U4, DSH-1..DSH-4). Deterministic rows with one audit per
 * severity band so trend colors and badges are all exercised; the long list
 * covers the trend's "most recent bars" cap.
 */
export const auditFixtures: DashboardAudit[] = [
  {
    id: "a1",
    url: "https://example.com",
    geoScore: 87,
    severityBand: "Excellent",
    createdAt: new Date("2026-08-10T12:00:00.000Z"),
  },
  {
    id: "a2",
    url: "https://ejemplo.org/blog",
    geoScore: 62,
    severityBand: "Good",
    createdAt: new Date("2026-08-03T12:00:00.000Z"),
  },
  {
    id: "a3",
    url: "https://tienda.com",
    geoScore: 41,
    severityBand: "Fair",
    createdAt: new Date("2026-07-27T12:00:00.000Z"),
  },
  {
    id: "a4",
    url: "https://legacy.net",
    geoScore: 23,
    severityBand: "Poor",
    createdAt: new Date("2026-07-15T12:00:00.000Z"),
  },
  {
    id: "a5",
    url: "https://old.com",
    geoScore: 9,
    severityBand: "Critical",
    createdAt: new Date("2026-07-01T12:00:00.000Z"),
  },
];

/** A multi-page audit row (DSH-10) to prove the "Multi-Page" chip renders. */
export const multiPageFixture: DashboardAudit = {
  id: "a6",
  url: "https://acme-store.io",
  geoScore: 54,
  severityBand: "Fair",
  isMultiPage: true,
  createdAt: new Date("2026-06-20T12:00:00.000Z"),
};

/** 12 audits (newest first) to prove the trend renders at most 10 bars. */
export const manyAuditFixtures: DashboardAudit[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `m${index + 1}`,
    url: `https://sitio-${index + 1}.com`,
    geoScore: 98 - index * 6,
    severityBand: index % 2 === 0 ? "Excellent" : "Good",
    createdAt: new Date(Date.UTC(2026, 7, 10 - index)),
  }),
);
