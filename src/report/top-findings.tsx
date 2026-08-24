import type {
  CitabilityResult,
  CrawlerResult,
  SchemaResult,
} from "@/lib/contracts/audit-result";

export type TopFindingsProps = {
  /** Citability passages (top3/bottom3) and actionable suggestions. */
  citability: CitabilityResult;
  /** Schema validation issues (strings from the contract). */
  schema: SchemaResult;
  /** Per-bot access map — blocked bots are the actionable finding. */
  crawlers: CrawlerResult;
};

function SuggestionsList({
  suggestions,
}: {
  suggestions: CitabilityResult["suggestions"];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary">
        Sugerencias de contenido
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {suggestions.map(({ block, key }) => (
          <li
            key={`${block}:${key}`}
            className="flex flex-wrap items-baseline gap-x-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
          >
            <span className="font-medium text-text-primary">{block}</span>
            <code className="font-mono text-xs text-text-secondary">{key}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * TopFindings (ARU-8): the most actionable findings of the MVP report —
 * citability top3/bottom3 passages + suggestions, schema issues and blocked
 * AI bots. Degraded sections carry empty lists and render nothing fake; with
 * nothing to show, an honest empty state is rendered.
 */
export function TopFindings({
  citability,
  schema,
  crawlers,
}: TopFindingsProps) {
  const blockedBots = Object.entries(crawlers.perBot)
    .filter(([, status]) => status === "blocked")
    .map(([bot]) => bot);

  const hasCitability =
    citability.top3.length > 0 ||
    citability.bottom3.length > 0 ||
    citability.suggestions.length > 0;
  const hasSchema = schema.issues.length > 0;
  const hasBots = blockedBots.length > 0;

  return (
    <section aria-label="Hallazgos" className="w-full">
      <h2 className="font-display text-2xl tracking-tight text-navy">
        Hallazgos
      </h2>
      {!hasCitability && !hasSchema && !hasBots ? (
        <p className="mt-4 text-sm text-text-secondary">
          Sin hallazgos destacados.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {hasCitability ? (
            <div className="flex flex-col gap-4">
              {citability.top3.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Pasajes más citables
                  </h3>
                  <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
                    {citability.top3.map((passage) => (
                      <li key={passage} className="text-sm text-text-primary">
                        {passage}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {citability.bottom3.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    A mejorar
                  </h3>
                  <ul className="mt-2 flex flex-col gap-2">
                    {citability.bottom3.map((passage) => (
                      <li key={passage} className="text-sm text-text-primary">
                        {passage}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {citability.suggestions.length > 0 ? (
                <SuggestionsList suggestions={citability.suggestions} />
              ) : null}
            </div>
          ) : null}
          {hasSchema ? (
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Advertencias de schema
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {schema.issues.map((issue) => (
                  <li
                    key={issue}
                    className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-text-primary"
                  >
                    <code className="font-mono text-xs">{issue}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {hasBots ? (
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Bots bloqueados
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {blockedBots.map((bot) => (
                  <li
                    key={bot}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                  >
                    <code className="font-mono text-xs font-medium text-text-primary">
                      {bot}
                    </code>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                      bloqueado
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
