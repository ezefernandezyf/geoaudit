import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { auditAction } from "@/lib/audit/actions";
import { auth } from "@/lib/auth";
import { AuditForm } from "@/ui/audit-form";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";
import { LANDING_COPY } from "@/lib/copy";
import { buildOgMetadata } from "@/lib/og";
import { ScoreHero } from "@/report/score-hero";
import { SCOREHERO_EVIDENCE } from "./score-hero-evidence";

/**
 * Root landing page (U2, LND-1..7, ADF-1/8): Gemini composition verbatim
 * (hex directos, font-serif, surfaces contrastadas) sobre el flujo REAL:
 * hero con AuditForm (botón dentro del input + sample URLs, LND-1), cards
 * 01-05 con la 03 navy y número emerald (LND-2), ScoreHero con evidencia
 * REAL del motor + bandas reales 90/75/60/40 (LND-3/LND-7), seis plataformas
 * (LND-4) y CTA pricing (LND-5). El copy de usuario viene de src/lib/copy.ts
 * (neutro, ATH-9).
 *
 * LND-6 (sprint 8): la página resuelve auth() y adapta el CTA secundario —
 * con sesión muestra "Ir al dashboard" (/dashboard), sin sesión mantiene
 * "Crear cuenta gratis" (/signup). La Home pasa a dinámica (costo aceptado).
 *
 * LND-7 (sprint 8): el ScoreHero muestra la evidencia REAL de
 * src/app/score-hero-evidence.ts (mejor URL verificada por runAudit con su
 * band honesta) — nunca un número inventado.
 */

export const dynamic = "force-dynamic";

/**
 * LND-8 (sprint 8, C16): landing OpenGraph/Twitter metadata via the shared
 * helper — reuses the page title/description and the shared 1200×630 og.png.
 */
export const metadata = buildOgMetadata({
  title: "Auditoría de visibilidad en motores de IA",
  description:
    "Audite su sitio y obtenga un GEO Score de 0 a 100 con diagnóstico de presencia en ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews y Bing Copilot.",
  path: "/",
});

/** Real severity bands 90/75/60/40 (LND-3) — Gemini table composition. */
const BAND_ROWS: {
  band: GeminiBand;
  range: string;
  description: string;
}[] = [
  {
    band: "excellent",
    range: "90 - 100",
    description:
      "Visibilidad sobresaliente en buscadores con IA y citas frecuentes.",
  },
  {
    band: "good",
    range: "75 - 89",
    description: "Buena base, con oportunidades puntuales de mejora.",
  },
  {
    band: "fair",
    range: "60 - 74",
    description: "Presencia parcial que conviene reforzar en varios dominios.",
  },
  {
    band: "poor",
    range: "40 - 59",
    description: "Baja citabilidad; hay trabajo estructural por delante.",
  },
  {
    band: "critical",
    range: "0 - 39",
    description:
      "Problemas de acceso o contenido que bloquean a los motores de IA.",
  },
];

/** The six AI search platforms audited by the engine (LND-4) — Gemini verbatim. */
const PLATFORMS = [
  {
    name: "ChatGPT",
    bot: "GPTBot / OAI-SearchBot",
    company: "OpenAI",
    desc: "Búsqueda web en vivo para usuarios Plus/Pro y navegación de GPT-4o.",
  },
  {
    name: "Claude",
    bot: "ClaudeBot / Anthropic-AI",
    company: "Anthropic",
    desc: "Ingesta de documentación técnica y ponderación de fuentes E-E-A-T.",
  },
  {
    name: "Perplexity",
    bot: "PerplexityBot",
    company: "Perplexity AI",
    desc: "Citas directas y enlaces fuente verificados en tiempo real.",
  },
  {
    name: "Gemini",
    bot: "Google-Extended",
    company: "Google",
    desc: "Integración en ecosistema Workspace y consultas directas en Gemini Live.",
  },
  {
    name: "Google AI Overviews",
    bot: "Googlebot Smartphone",
    company: "Google Search",
    desc: "Tarjetas de síntesis y carruseles en la cabecera del buscador tradicional.",
  },
  {
    name: "Bing Copilot",
    bot: "Bingbot / IndexNow",
    company: "Microsoft",
    desc: "Búsqueda enriquecida con feeds de productos y documentación en Edge.",
  },
];

export default async function Home() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <main className="w-full bg-[#f8fafc]">
      {/* 1. HERO — badge GEO Engine (LND-5) + AuditForm real (LND-1) */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pt-18">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-xs text-[#475569] shadow-xs">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[#10b981]"
          />
          <span className="font-medium text-[#0f172a]">
            {LANDING_COPY.hero.badge}
          </span>
          <span className="text-[#94a3b8]">
            {LANDING_COPY.hero.badgeDivider}
          </span>
          <span>{LANDING_COPY.hero.badgeSuffix}</span>
        </div>

        <h1 className="mx-auto mb-6 max-w-4xl font-serif text-4xl leading-[1.08] tracking-tight text-[#0f172a] sm:text-6xl md:text-7xl">
          {LANDING_COPY.hero.title}
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-[#475569] sm:text-lg">
          {LANDING_COPY.hero.subtitleLead}
          <strong className="font-semibold text-[#0f172a]">
            {LANDING_COPY.hero.subtitleHighlight}
          </strong>
          {LANDING_COPY.hero.subtitleTail}
        </p>

        <div className="mx-auto mb-8 max-w-2xl">
          <AuditForm action={auditAction} />
        </div>
      </section>

      {/* 2. CÓMO FUNCIONA — cards 01-05 contrastadas, card 03 navy (LND-2) */}
      <section className="border-y border-[#e2e8f0] bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
              {LANDING_COPY.sections.howItWorksEyebrow}
            </span>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
              {LANDING_COPY.sections.howItWorksTitle}
            </h2>
            <p className="mt-2 text-sm text-[#475569] sm:text-base">
              Inspección técnica multidimensional en 3 capas de indexación
              generativa.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            {/* Dominio 01 — tarjeta ancha destacada (Gemini col-span-5) */}
            <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-7 lg:col-span-5">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  01
                </div>
                <h3 className="mb-2 font-serif text-2xl tracking-tight text-[#0f172a]">
                  Acceso de bots
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-[#475569]">
                  Verificamos si{" "}
                  <code className="rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 font-mono text-xs text-[#0f172a]">
                    robots.txt
                  </code>
                  , encabezados HTTP y metaetiquetas permiten o bloquean a los
                  crawlers de IA.
                </p>
              </div>
              <div className="space-y-1 rounded-lg border border-[#e2e8f0] bg-white p-3 font-mono text-xs text-[#475569]">
                <div className="flex items-center gap-1.5 font-medium text-[#047857]">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> GPTBot /
                  OAI-SearchBot: 200 OK
                </div>
                <div className="flex items-center gap-1.5 font-medium text-[#047857]">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                  ClaudeBot: Allow index
                </div>
              </div>
            </div>

            {/* Dominios 02-05 — columna derecha (Gemini col-span-7) */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  02
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl tracking-tight text-[#0f172a]">
                    Citabilidad
                  </h3>
                  <p className="text-sm leading-relaxed text-[#475569]">
                    Medimos qué tan probable es que los modelos citen
                    textualmente pasajes de tu página como fuente canónica.
                  </p>
                </div>
              </div>

              {/* Card 03 — navy #0f172a + número emerald (LND-2) */}
              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#1e293b] bg-[#0f172a] p-6 text-white sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 font-mono text-sm font-bold text-slate-950">
                  03
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl text-white">
                    E-E-A-T
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Evaluamos experiencia, experticia, autoridad y confiabilidad
                    del contenido para la ponderación de fuentes.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  04
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl tracking-tight text-[#0f172a]">
                    Datos estructurados
                  </h3>
                  <p className="text-sm leading-relaxed text-[#475569]">
                    Detectamos y validamos el JSON-LD y Schema.org que los LLMs
                    usan para corroborar entidades y hechos.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  05
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl tracking-tight text-[#0f172a]">
                    Plataforma
                  </h3>
                  <p className="text-sm leading-relaxed text-[#475569]">
                    Comprobamos readiness, SSR, OG y headers para cada motor de
                    búsqueda generativa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SCORECARD — ScoreHero con evidencia REAL (LND-7) + bandas reales 90/75/60/40 (LND-3) */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {LANDING_COPY.sections.scorecardEyebrow}
          </span>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
            {LANDING_COPY.sections.scorecardTitle}
          </h2>
          <p className="mt-2 text-sm text-[#475569] sm:text-base">
            {LANDING_COPY.sections.scorecardLead}
          </p>
        </div>

        {/*
          ScoreHero (LND-7): la mejor URL REAL verificada por runAudit, con su
          band honesta — nunca un número inventado. La evidencia vive en
          score-hero-evidence.ts y se fija con `pnpm verify:scorehero`.
        */}
        <div className="mb-10">
          <ScoreHero view={SCOREHERO_EVIDENCE} />
        </div>

        {/*
          Desglose por categoría — solo cuando la evidencia REAL está fijada
          (categoryScores del GeminiView verificado). Mientras la evidencia
          está pendiente (A3.2) no se renderiza nada: no se inventan números
          por dimensión.
        */}
        {SCOREHERO_EVIDENCE.categoryScores.length > 0 ? (
          <div className="mb-10 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                {LANDING_COPY.sections.scorecardCategoryTitle}
              </h3>
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {SCOREHERO_EVIDENCE.categoryScores.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col justify-between gap-2 p-4 transition-colors hover:bg-[#f8fafc] sm:flex-row sm:items-center sm:px-6 sm:py-3.5"
                >
                  <div className="flex min-w-[200px] items-center gap-3">
                    <span className="w-10 font-mono text-xs font-bold text-[#0f172a]">
                      {c.score}
                    </span>
                    <span className="text-sm font-medium text-[#0f172a]">
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SeverityBadge band={c.status} size="sm" />
                    <span className="w-12 text-right font-mono text-xs text-[#64748b]">
                      {c.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Tabla de bandas — thresholds reales 90/75/60/40 */}
        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
              {LANDING_COPY.sections.scorecardBandsTitle}
            </h3>
          </div>
          <div className="divide-y divide-[#e2e8f0]">
            {BAND_ROWS.map((row) => (
              <div
                key={row.band}
                className="flex flex-col justify-between gap-2 p-4 transition-colors hover:bg-[#f8fafc] sm:flex-row sm:items-center sm:px-6 sm:py-3.5"
              >
                <div className="flex min-w-[200px] items-center gap-3">
                  <span className="w-16 font-mono text-xs font-bold text-[#0f172a]">
                    {row.range}
                  </span>
                  <SeverityBadge band={row.band} size="sm" />
                </div>
                <p className="flex-1 text-xs text-[#475569] sm:text-sm">
                  {row.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PLATAFORMAS — 6 motores de IA (LND-4) */}
      <section className="border-y border-[#e2e8f0] bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
              {LANDING_COPY.sections.platformsEyebrow}
            </span>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
              {LANDING_COPY.sections.platformsTitle}
            </h2>
            <p className="mt-2 text-sm text-[#475569]">
              {LANDING_COPY.sections.platformsLead}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5 transition-colors hover:border-[#cbd5e1]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-xl tracking-tight text-[#0f172a]">
                    {p.name}
                  </h3>
                  <span className="rounded border border-[#e2e8f0] bg-white px-2 py-0.5 font-mono text-[11px] text-[#64748b]">
                    {p.company}
                  </span>
                </div>
                <div className="mb-2 font-mono text-xs font-semibold text-[#047857]">
                  {p.bot}
                </div>
                <p className="text-xs leading-relaxed text-[#475569]">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRICING TEASER → /pricing (LND-5) */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm sm:p-12">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {LANDING_COPY.sections.pricingEyebrow}
          </span>
          <h2 className="mb-4 mt-2 font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
            {LANDING_COPY.sections.pricingTitle}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-sm text-[#475569] sm:text-base">
            {LANDING_COPY.sections.pricingSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-[#0f172a] px-6 text-base font-medium text-white transition-all duration-150 hover:bg-[#1e293b] active:scale-[0.98]"
            >
              {LANDING_COPY.sections.pricingCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md border border-[#e2e8f0] bg-white px-6 text-base font-medium text-[#0f172a] transition-all duration-150 hover:border-[#cbd5e1] hover:bg-[#f8fafc] active:scale-[0.98]"
              >
                {LANDING_COPY.sections.pricingSecondaryCtaLoggedIn}
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md border border-[#e2e8f0] bg-white px-6 text-base font-medium text-[#0f172a] transition-all duration-150 hover:border-[#cbd5e1] hover:bg-[#f8fafc] active:scale-[0.98]"
              >
                {LANDING_COPY.sections.pricingSecondaryCta}
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
