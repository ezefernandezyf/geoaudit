import { DASHBOARD_COPY } from "@/lib/copy";

/**
 * Empty state (DSH-4, design U4): honest copy for a user with zero audits and
 * a single call-to-action. The CTA targets /report, where the inline audit
 * form renders when no url param is present (ARU-5). Copy comes from
 * `DASHBOARD_COPY.empty` (neutral Spanish, no voseo) — the component must
 * NEVER hardcode its own strings (WU-4 regression).
 */
export function DashboardEmptyState() {
  return (
    <section
      aria-labelledby="dashboard-empty-title"
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1f5f9] font-serif text-2xl font-bold text-[#64748b]">
        0
      </div>
      <h2
        id="dashboard-empty-title"
        className="font-serif text-2xl font-normal text-[#0f172a]"
      >
        {DASHBOARD_COPY.empty.title}
      </h2>
      <p className="max-w-md text-xs leading-relaxed text-[#64748b]">
        {DASHBOARD_COPY.empty.body}
      </p>
      <a
        href="/report"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2"
      >
        {DASHBOARD_COPY.empty.cta}
      </a>
    </section>
  );
}
