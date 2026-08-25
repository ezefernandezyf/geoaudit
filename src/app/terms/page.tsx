import { LEGAL_COPY } from "@/lib/copy";

/**
 * Terms of Service page (LGL-1, LGL-3, LGL-4, design U4).
 *
 * Static Server Component — no client interactivity (no "use client"). Renders
 * the neutral legal copy from `LEGAL_COPY.terms` inside the shared app shell
 * (navbar + footer come from the root layout) with the Gemini visual language
 * (hex directos). No dynamic data, no business logic.
 */
export default function TermsPage() {
  const copy = LEGAL_COPY.terms;

  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6">
        <header className="flex flex-col gap-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {copy.eyebrow}
          </span>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-[#0f172a] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="font-mono text-xs text-[#64748b]">{copy.updated}</p>
          <p className="font-sans text-base leading-relaxed text-[#475569]">
            {copy.intro}
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl font-normal text-[#0f172a]">
                {section.heading}
              </h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#475569]">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
