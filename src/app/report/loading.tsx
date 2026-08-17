import { ReportSkeleton } from "./report-skeleton";

/**
 * Route-segment loading fallback (U3.T2, ARU-3): streams while the page awaits
 * its own async work; the explicit `<Suspense fallback>` on the page covers
 * the runAudit wait. Same skeleton either way.
 */
export default function Loading() {
  return <ReportSkeleton />;
}
