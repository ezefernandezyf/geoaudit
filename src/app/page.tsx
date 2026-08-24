import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { auditAction } from "@/lib/audit/actions";
import { AuditForm } from "@/ui/audit-form";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";
import { LANDING_COPY } from "@/lib/copy";
import { severityForScore } from "@/scoring/calculator";

/**
 * Root landing page (U2, LND-1..5, ADF-1/8): Gemini composition verbatim
 * (hex directos, font-serif, surfaces contrastadas) sobre el flujo REAL:
 * hero con AuditForm (botón dentro del input + sample URLs, LND-1), cards
 * 01-05 con la 03 navy y número emerald (LND-2), ScoreHero demo + bandas
 * reales 90/75/60/40 (LND-3), seis plataformas (LND-4) y CTA pricing
 * (LND-5). El copy de usuario viene de src/lib/copy.ts (neutro, ATH-9).
 */

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

/** Benchmark bars of the demo ScoreHero — REAL thresholds (LND-3). */
const BENCHMARK_ROWS: {
  range: string;
  label: string;
  className: string;
}[] = [
  {
    range: "90 - 100",
    label: "Excelente (Top 10%)",
    className: "font-semibold text-[#10b981]",
  },
  {
    range: "75 - 89",
    label: "Bueno (Promedio B2B)",
    className: "font-medium text-[#10b981]",
  },
  {
    range: "60 - 74",
    label: "Regular (Riesgo omisión)",
    className: "font-medium text-[#f59e0b]",
  },
  {
    range: "40 - 59",
    label: "Deficiente",
    className: "font-medium text-[#ef4444]",
  },
  {
    range: "0 - 39",
    label: "Crítico",
    className: "font-medium text-[#ef4444]",
  },
];

/**
 * Demo category breakdown (Gemini mockAudits linear.app verbatim) with bands
 * derived from the REAL severityForScore thresholds (90/75/60/40) — the
 * landing never invents bands (LND-3, design U2).
 */
const DEMO_CATEGORIES: {
  id: string;
  name: string;
  score: number;
  weight: string;
  band: GeminiBand;
  description: string;
}[] = [
  {
    id: "crawlers",
    name: "AI Crawlers & robots.txt",
    score: 95,
    weight: "25%",
    band: severityForScore(95).toLowerCase() as GeminiBand,
    description:
      "Directivas abiertas y óptimas para GPTBot, ClaudeBot, PerplexityBot y Google-Extended.",
  },
  {
    id: "citability",
    name: "Citabilidad & E-E-A-T",
    score: 88,
    weight: "25%",
    band: severityForScore(88).toLowerCase() as GeminiBand,
    description:
      "Documentación técnica con alta densidad factual y firma de ingenieros verificados.",
  },
  {
    id: "schema",
    name: "Structured Data & JSON-LD",
    score: 82,
    weight: "20%",
    band: severityForScore(82).toLowerCase() as GeminiBand,
    description:
      "Schema SoftwareApplication con featureList y precios explícitos.",
  },
  {
    id: "density",
    name: "Densidad de Información & Contexto",
    score: 86,
    weight: "15%",
    band: severityForScore(86).toLowerCase() as GeminiBand,
    description:
      "Textos directos sin jerga publicitaria vacía; definiciones concisas en hero.",
  },
  {
    id: "platforms",
    name: "Alcance Multi-Modelo",
    score: 81,
    weight: "15%",
    band: severityForScore(81).toLowerCase() as GeminiBand,
    description:
      "Aparición constante como recomendación líder en queries de issue tracking.",
  },
];

/** The six AI search platforms audited by the engine (LND-4). */
const PLATFORMS = [
  {
    name: "ChatGPT",
    bot: "GPTBot / OAI-SearchBot",
    company: "OpenAI",
    desc: "Búsqueda web en vivo y navegación del modelo de OpenAI.",
  },
  {
    name: "Claude",
    bot: "Claude-Web",
    company: "Anthropic",
    desc: "Ingesta de documentación y ponderación de fuentes E-E-A-T.",
  },
  {
    name: "Perplexity",
    bot: "PerplexityBot",
    company: "Perplexity AI",
    desc: "Citas directas y enlaces fuente verificados.",
  },
  {
    name: "Gemini",
    bot: "Google-Extended",
    company: "Google",
    desc: "Integración con el ecosistema y respuestas generativas.",
  },
  {
    name: "Google AI Overviews",
    bot: "Googlebot",
    company: "Google Search",
    desc: "Síntesis en la cabecera de los resultados de búsqueda.",
  },
  {
    name: "Bing Copilot",
    bot: "Bingbot",
    company: "Microsoft",
    desc: "Búsqueda enriquecida y asistentes en el ecosistema de Microsoft.",
  },
];

export default function Home() {
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

      {/* 3. SCORECARD — demo ScoreHero + bandas reales 90/75/60/40 (LND-3) */}
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

        {/* Demo ScoreHero (Gemini composition, real thresholds) */}
        <div className="mb-10 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-6 sm:items-center">
              <div className="flex min-w-[130px] flex-col justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5 sm:min-w-[160px]">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  GEO Score
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-6xl leading-tight text-[#0f172a] sm:text-7xl">
                    92
                  </span>
                  <span className="font-mono text-xl font-bold text-[#10b981]">
                    /100
                  </span>
                </div>
                <div className="mt-3">
                  <SeverityBadge band="excellent" size="sm" />
                </div>
              </div>

              <div className="flex max-w-xl flex-col justify-center space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-[#e2e8f0] bg-[#f1f5f9] px-2.5 py-1 font-mono text-xs font-semibold text-[#0f172a]">
                    linear.app
                  </span>
                  <span className="text-xs text-[#475569]">
                    Auditoría en{" "}
                    <strong className="font-mono font-medium text-[#0f172a]">
                      14s
                    </strong>
                  </span>
                </div>
                <h2 className="font-serif text-lg italic leading-snug text-[#0f172a] sm:text-xl">
                  Excelente visibilidad e indexación en modelos generativos
                </h2>
                <p className="text-xs leading-relaxed text-[#475569]">
                  linear.app tiene una citabilidad sobresaliente en ChatGPT,
                  Claude y Perplexity. Su marcado JSON-LD SoftwareApplication y
                  directivas de robots.txt están en el percentil superior.
                </p>
              </div>
            </div>

            {/* Benchmark — umbrales reales 90/75/60/40 */}
            <div className="flex shrink-0 flex-col justify-center gap-3 text-left md:min-w-[210px] md:border-l md:border-[#e2e8f0] md:pl-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Baremos de Referencia
              </div>
              <div className="space-y-1.5 text-xs">
                {BENCHMARK_ROWS.map((row) => (
                  <div
                    key={row.range}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="font-mono text-[#64748b]">
                      {row.range}
                    </span>
                    <span className={row.className}>{row.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de categorías demo — score, band real y weight */}
        <div className="mb-10 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
              Desglose de ejemplo por categoría
            </h3>
          </div>
          <div className="divide-y divide-[#e2e8f0]">
            {DEMO_CATEGORIES.map((c) => (
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
                  <SeverityBadge band={c.band} size="sm" />
                  <span className="w-12 text-right font-mono text-xs text-[#64748b]">
                    {c.weight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de bandas — thresholds reales 90/75/60/40 */}
        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
              Escala de Bandas y Criterios Técnicos
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
      <section className="border-y border-border bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Ecosistema de búsqueda de IA
            </span>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">
              6 plataformas de búsqueda generativa auditadas
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Analizamos la interacción de cada crawler y motor de respuesta con
              tu contenido.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-display text-xl tracking-tight text-navy">
                    {p.name}
                  </h3>
                  <span className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-secondary">
                    {p.company}
                  </span>
                </div>
                <div className="mb-2 font-mono text-xs font-semibold text-emerald">
                  {p.bot}
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRICING TEASER → /pricing (LND-5) */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm sm:p-12">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Planes y acceso
          </span>
          <h2 className="mb-4 mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">
            Comenzá a monitorear la visibilidad de tu marca en la IA
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-sm text-text-secondary sm:text-base">
            Desde auditorías gratuitas hasta planes profesionales con monitoreo
            continuo, multi-page y reportes compartibles.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Ver Planes y Precios
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
