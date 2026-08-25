import { REPORT_COPY } from "@/lib/copy";
import type { GeminiView } from "@/report/presenters/types";
import { ScoreBar } from "@/ui/score-bar";

/**
 * DomainScorecard (U5.6, ARU-10, design U5): pure presenter of the view
 * model. Gemini "Scorecard por Categoría" section verbatim (hex surfaces,
 * serif heading, mono chip) rendering the five `categoryScores` through the
 * shared `ScoreBar` primitive — the bars color by the REAL lowercase band
 * (`category.status`) and the adapter owns the rowScore derivation. Pure SSR
 * Server Component: view in, markup out.
 */
export function DomainScorecard({ view }: { view: GeminiView }) {
  return (
    <section
      aria-label="Scorecard por categoría"
      className="space-y-4 rounded-xl border border-[#e2e8f0] bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-normal text-[#0f172a]">
            {REPORT_COPY.scorecard.title}
          </h2>
          <p className="text-xs text-[#64748b]">
            {REPORT_COPY.scorecard.subtitle}
          </p>
        </div>
        <span className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 font-mono text-xs text-[#64748b]">
          {REPORT_COPY.scorecard.chip}
        </span>
      </div>

      <div className="space-y-3 pt-2">
        {view.categoryScores.map((category) => (
          <ScoreBar
            key={category.id}
            category={{
              ...category,
              // The view model is honest-nullable (APT-10); ScoreBar's category
              // treats absent metrics as undefined.
              keyMetric: category.keyMetric ?? undefined,
            }}
          />
        ))}
      </div>
    </section>
  );
}
