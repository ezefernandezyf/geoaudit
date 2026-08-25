import { CheckCircle2, Sparkles } from "lucide-react";
import { REPORT_COPY } from "@/lib/copy";
import type { GeminiView } from "@/report/presenters/types";
import { CopyCodeButton } from "@/ui/copy-code-button";
import { SeverityBadge } from "@/ui/severity-badge";

/**
 * TopFindings (U5.6, ARU-10, design U5): pure presenter of the view model.
 * Gemini "Hallazgos Técnicos Priorizados" section verbatim rendering
 * `view.findings` (derived by `deriveFindings` from REAL engine data).
 *
 * Honesty rules (APT-10): the impact-score chip is omitted because
 * `Finding.impactScore` is ALWAYS null (the engine does not compute one); a
 * code snippet renders ONLY when a real source exists (`schema.generated`).
 * The copy affordance is the `CopyCodeButton` client island (design RSC
 * split). Pure SSR otherwise.
 */
export function TopFindings({ view }: { view: GeminiView }) {
  const { findings } = view;

  return (
    <section
      aria-label="Hallazgos técnicos"
      className="space-y-4 rounded-xl border border-[#e2e8f0] bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-normal text-[#0f172a]">
            {REPORT_COPY.findings.title}
          </h2>
          <p className="text-xs text-[#64748b]">
            {REPORT_COPY.findings.subtitle}
          </p>
        </div>
        <span className="font-mono text-xs text-[#64748b]">
          {findings.length} {REPORT_COPY.findings.points}
        </span>
      </div>

      {findings.length === 0 ? (
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-8 text-center">
          <CheckCircle2
            className="mx-auto mb-2 h-8 w-8 text-emerald-600"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-[#0f172a]">
            {REPORT_COPY.findings.emptyTitle}
          </p>
          <p className="mt-1 text-xs text-[#64748b]">
            {REPORT_COPY.findings.emptyBody}
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5"
            >
              {/* Finding header */}
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-2.5">
                  <SeverityBadge band={finding.severity} size="sm" />
                  <span className="rounded border border-[#e2e8f0] bg-white px-2 py-0.5 font-mono text-xs text-[#64748b]">
                    {finding.category}
                  </span>
                  <h3 className="font-sans text-sm font-semibold text-[#0f172a]">
                    {finding.title}
                  </h3>
                </div>
              </div>

              <p className="font-sans text-xs leading-relaxed text-[#475569]">
                {finding.description}
              </p>

              {/* Grouped details (ARU-13/14, sprint 8): the aggregated items of
                  a collapsed finding (missing JSON-LD properties, blocked bots). */}
              {finding.details && finding.details.length > 0 ? (
                <ul className="space-y-1.5">
                  {finding.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2 font-mono text-xs text-[#475569]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#10b981]"
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* Recommendation block */}
              <div className="flex items-start gap-2 rounded-lg border border-[#e2e8f0] bg-white p-3 font-sans text-xs text-[#0f172a]">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <div>
                  <strong className="font-semibold text-[#0f172a]">
                    {REPORT_COPY.findings.recommendation}{" "}
                  </strong>
                  <span className="text-[#475569]">
                    {finding.recommendation}
                  </span>
                </div>
              </div>

              {/* Code snippet: ONLY from a real source (schema.generated) */}
              {finding.codeSnippet ? (
                <div className="relative mt-2">
                  <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0f172a] p-3.5 font-mono text-xs text-slate-200">
                    <pre>{finding.codeSnippet}</pre>
                  </div>
                  <CopyCodeButton code={finding.codeSnippet} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
