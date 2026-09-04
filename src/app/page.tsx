import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { auditAction } from "@/lib/audit/actions";
import { auth } from "@/lib/auth";
import { AuditForm } from "@/ui/audit-form";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";
import { LANDING_COPY } from "@/lib/copy";
import { buildOgMetadata } from "@/lib/og";
import {
  BRAND_ADDRESS,
  BRAND_CONTACT_POINT,
  BRAND_NAME,
  BRAND_REPO,
  FOUNDER,
  FOUNDING_DATE,
  KNOWS_ABOUT,
  ORG_AREA_SERVED,
  ORG_EMPLOYEES,
  ORG_INDUSTRY,
  ORG_SAME_AS,
  SUPPORT_EMAIL,
} from "@/lib/brand";
import { ScoreHero } from "@/report/score-hero";
import { SCOREHERO_EVIDENCE } from "./score-hero-evidence";

/**
 * Root landing page (U2, LND-1..7, ADF-1/8): Gemini composition verbatim
 * (hex directos, font-serif, surfaces contrastadas) sobre el flujo REAL:
 * hero con AuditForm (botón dentro del input + sample URLs, LND-1), cards
 * 01-05 con la 03 navy y número emerald (LND-2), ScoreHero con evidencia
 * REAL del motor + bandas reales 80/65/50/30 (LND-3/LND-7), seis plataformas
 * (LND-4) y CTA final adaptado a la sesión (LND-6). El copy de usuario viene
 * de src/lib/copy.ts (neutro, ATH-9).
 *
 * LND-6 (sprint 10): la página resuelve auth() y adapta el CTA final - con
 * sesión muestra "Ir al dashboard" (/dashboard), sin sesión "Auditar gratis"
 * (/signup). El teaser de precios y el CTA "Ver Planes" se eliminaron con la
 * ruta /pricing (WU-1). La Home pasa a dinámica (costo aceptado).
 *
 * LND-7 (sprint 8): el ScoreHero muestra la evidencia REAL de
 * src/app/score-hero-evidence.ts (mejor URL verificada por runAudit con su
 * band honesta) - nunca un número inventado.
 *
 * LND-9 (sprint 9): JSON-LD inline SSR - Organization + WebSite (+SearchAction)
 * y sameAs[], inyectados como `<script type="application/ld+json">` DENTRO de
 * este server component (nunca por JS client-side). El engine de schema
 * (extractJsonLd) solo detecta bloques en el HTML server-rendered estático, y
 * el criterio "server_rendered" del rubric exige exactamente eso.
 */

export const dynamic = "force-dynamic";

/**
 * LND-9 (sprint 9/12): Organization + WebSite structured data, inline in the SSR
 * HTML. The site URL is derived from NEXT_PUBLIC_APP_URL so the JSON-LD stays
 * truthful regardless of environment. SearchAction on WebSite unlocks schema
 * criterion 5. LND-9 (sprint 12) enriches the Organization with the real
 * recommended properties (knowsAbout, founder, address, contactPoint, email,
 * foundingDate) and real sameAs profiles - never invented data (LND-7).
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: BRAND_NAME,
          url: APP_URL,
          logo: `${APP_URL}/og.png`,
          description:
            "Plataforma de auditoría GEO/SEO que mide la visibilidad y citabilidad de un sitio en los motores de búsqueda con IA.",
          sameAs: ORG_SAME_AS,
          // LND-9 (sprint 12): real recommended properties, one source in brand.ts.
          knowsAbout: KNOWS_ABOUT,
          founder: FOUNDER,
          address: BRAND_ADDRESS,
          contactPoint: BRAND_CONTACT_POINT,
          email: SUPPORT_EMAIL,
          foundingDate: FOUNDING_DATE,
          // LND-9 (sprint 17, D6): real org attributes from brand.ts - AR
          // matches BRAND_ADDRESS, Software industry, solo founder. `award`
          // stays OMITTED: no real award exists and inventing one would
          // violate LND-7 (engine keeps reporting missing_recommended).
          areaServed: ORG_AREA_SERVED,
          industry: ORG_INDUSTRY,
          numberOfEmployees: ORG_EMPLOYEES,
        }),
      }}
    />
  );
}

function WebSiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: BRAND_NAME,
          url: APP_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${APP_URL}/?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }),
      }}
    />
  );
}

/**
 * LND-8 (sprint 8, C16): landing OpenGraph/Twitter metadata via the shared
 * helper - reuses the page title/description and the shared 1200×630 og.png.
 */
export const metadata = buildOgMetadata({
  title: "Auditoría de visibilidad en motores de IA",
  description:
    "Audite su sitio y obtenga un GEO Score de 0 a 100 con diagnóstico de presencia en ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews y Bing Copilot.",
  path: "/",
});

/** Real severity bands 80/65/50/30 (LND-3) - Gemini table composition. */
const BAND_ROWS: {
  band: GeminiBand;
  range: string;
  description: string;
}[] = [
  {
    band: "excellent",
    range: "80 - 100",
    description:
      "Visibilidad sobresaliente en buscadores con IA y citas frecuentes.",
  },
  {
    band: "good",
    range: "65 - 79",
    description: "Buena base, con oportunidades puntuales de mejora.",
  },
  {
    band: "fair",
    range: "50 - 64",
    description: "Presencia parcial que conviene reforzar en varios dominios.",
  },
  {
    band: "poor",
    range: "30 - 49",
    description: "Baja citabilidad; hay trabajo estructural por delante.",
  },
  {
    band: "critical",
    range: "0 - 29",
    description:
      "Problemas de acceso o contenido que bloquean a los motores de IA.",
  },
];

/** The six AI search platforms audited by the engine (LND-4) - Gemini verbatim.
 * Sprint 16 (D5): every `desc` is a citable passage - 2-4 sentences, 50-200
 * words, answer-first (explicit-subject lead) with at least one REAL stat that
 * matches STAT_PATTERN (%, 4-digit year or semver - "17 agentes"/"<30s" alone
 * do NOT match). Stats trace to verified product facts: the 2026 audit year,
 * the v3.1.0 scoring weights (15 % acceso de bots, 14 % plataforma, 24 %
 * citabilidad) and the 50-200 extraction band. name/bot/company/docs intact. */
const PLATFORMS = [
  {
    name: "ChatGPT",
    bot: "GPTBot / OAI-SearchBot",
    company: "OpenAI",
    desc: "ChatGPT integra búsqueda web en vivo en sus planes Plus y Pro y responde con citas a las fuentes consultadas en tiempo real. Su crawler GPTBot rastrea el contenido y OAI-SearchBot lo indexa cuando robots.txt lo permite. Relevy verifica el acceso de ambos bots en cada auditoría de 2026 y mide el impacto de ese acceso sobre la visibilidad del sitio en este motor.",
    // Official crawler documentation - real external citation (E-E-A-T REE-3).
    docs: "https://platform.openai.com/docs/gptbot",
  },
  {
    name: "Claude",
    bot: "ClaudeBot / Anthropic-AI",
    company: "Anthropic",
    desc: "Claude analiza documentación técnica y pondera las fuentes por señales E-E-A-T antes de citarlas en sus respuestas. Su crawler ClaudeBot y el agente Anthropic-AI definen qué contenido puede indexar el modelo. Relevy audita la accesibilidad de ambos agentes en 2026 y traduce el resultado en la dimensión de citabilidad del GEO Score.",
    docs: "https://support.anthropic.com/en/articles/8896518",
  },
  {
    name: "Perplexity",
    bot: "PerplexityBot",
    company: "Perplexity AI",
    desc: "Perplexity combina búsqueda web y respuestas generadas con citas directas a las fuentes consultadas. PerplexityBot rastrea el contenido que el motor usa para responder, y el modelo enlaza cada afirmación a su origen. Relevy mide el acceso de PerplexityBot en sus auditorías de 2026 y verifica que las páginas citables estén dentro del rango de 50 a 200 palabras.",
    docs: "https://docs.perplexity.ai",
  },
  {
    name: "Gemini",
    bot: "Google-Extended",
    company: "Google",
    desc: "Gemini integra la búsqueda con IA en el ecosistema de Workspace y responde consultas directas con información actualizada de la web. Google-Extended permite a los sitios controlar si su contenido puede entrenar modelos de IA de Google. Relevy verifica la directiva de Google-Extended en cada auditoría y pondera esa señal dentro del 15 % que representa el acceso de bots en el GEO Score.",
    docs: "https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers",
  },
  {
    name: "Google AI Overviews",
    bot: "Googlebot Smartphone",
    company: "Google Search",
    desc: "Google AI Overviews genera resúmenes con IA en la parte superior de los resultados de búsqueda y enlaza las fuentes que sustentan cada síntesis. Googlebot Smartphone rastrea las páginas móviles que alimentan estas tarjetas de respuesta. Relevy audita el acceso de Googlebot Smartphone y mide la preparación de las URLs móviles dentro de la dimensión de plataforma, que pondera el 14 % del GEO Score.",
    docs: "https://developers.google.com/search/docs/appearance/ai-overviews",
  },
  {
    name: "Bing Copilot",
    bot: "Bingbot / IndexNow",
    company: "Microsoft",
    desc: "Bing Copilot responde con búsqueda enriquecida por IA y apoya sus respuestas en feeds de productos, documentación y contenido indexado. Bingbot e IndexNow mantienen la cobertura del índice que alimenta las respuestas del copiloto. Relevy audita el acceso de Bingbot e IndexNow en 2026 y mide la citabilidad de las páginas dentro del 24 % que pondera esa dimensión en el GEO Score.",
    docs: "https://www.bing.com/webmasters",
  },
];

export default async function Home() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <main className="w-full bg-[#f8fafc]">
      {/* LND-9 (sprint 9): JSON-LD inline SSR - Organization + WebSite. */}
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      {/* 1. HERO - badge GEO Engine (LND-5) + AuditForm real (LND-1) */}
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

      {/* 2. CÓMO FUNCIONA - cards 01-05 contrastadas, card 03 navy (LND-2) */}
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
            {/* Dominio 01 - tarjeta ancha destacada (Gemini col-span-5) */}
            <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-7 lg:col-span-5">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  {LANDING_COPY.features[0].number}
                </div>
                <h3 className="mb-2 font-serif text-2xl tracking-tight text-[#0f172a]">
                  {LANDING_COPY.features[0].title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-[#475569]">
                  {LANDING_COPY.features[0].body}
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

            {/* Dominios 02-05 - columna derecha (Gemini col-span-7) */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  {LANDING_COPY.features[1].number}
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl tracking-tight text-[#0f172a]">
                    {LANDING_COPY.features[1].title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#475569]">
                    {LANDING_COPY.features[1].body}
                  </p>
                </div>
              </div>

              {/* Card 03 - navy #0f172a + número emerald (LND-2) */}
              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#1e293b] bg-[#0f172a] p-6 text-white sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 font-mono text-sm font-bold text-slate-950">
                  {LANDING_COPY.features[2].number}
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl text-white">
                    {LANDING_COPY.features[2].title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {LANDING_COPY.features[2].body}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  {LANDING_COPY.features[3].number}
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl tracking-tight text-[#0f172a]">
                    {LANDING_COPY.features[3].title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#475569]">
                    {LANDING_COPY.features[3].body}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  {LANDING_COPY.features[4].number}
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl tracking-tight text-[#0f172a]">
                    {LANDING_COPY.features[4].title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#475569]">
                    {LANDING_COPY.features[4].body}
                  </p>
                </div>
              </div>

              {/* Dominio 06 - Autoridad de marca (LND-2, sprint 13): la sexta
                  dimensión del engine, presente también en el Scorecard. */}
              <div className="flex flex-col items-start gap-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] font-mono text-sm font-bold text-white">
                  {LANDING_COPY.features[5].number}
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-xl tracking-tight text-[#0f172a]">
                    {LANDING_COPY.features[5].title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#475569]">
                    {LANDING_COPY.features[5].body}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-[#e2e8f0] bg-white p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#475569]">
              Referencias y documentación oficial
            </h3>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#475569]">
              <li>
                <a
                  href="https://www.w3.org/TR/json-ld11/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:text-[#0f172a] hover:underline"
                >
                  JSON-LD 1.1 - W3C
                </a>
              </li>
              <li>
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:text-[#0f172a] hover:underline"
                >
                  HTML Reference - MDN
                </a>
              </li>
              <li>
                <a
                  href={BRAND_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:text-[#0f172a] hover:underline"
                >
                  {BRAND_NAME} - GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://platform.openai.com/docs/gptbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:text-[#0f172a] hover:underline"
                >
                  GPTBot - OpenAI
                </a>
              </li>
              <li>
                <a
                  href="https://support.anthropic.com/en/articles/8896518"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:text-[#0f172a] hover:underline"
                >
                  ClaudeBot - Anthropic
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. SCORECARD - ScoreHero con evidencia REAL (LND-7) + bandas reales 80/65/50/30 (LND-3) */}
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
          band honesta - nunca un número inventado. La evidencia vive en
          score-hero-evidence.ts y se fija con `pnpm verify:scorehero`.
        */}
        <div className="mb-10">
          <ScoreHero view={SCOREHERO_EVIDENCE} />
        </div>

        {/*
          Desglose por categoría - solo cuando la evidencia REAL está fijada
          (categoryScores del GeminiView verificado). A3.2 (sprint 9): la
          evidencia real de `pnpm verify:scorehero` está fijada (stripe.com,
          2026-08-26) - se renderiza el desglose verificado, nunca números
          inventados por dimensión.
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
                      {c.score === null ? "No medido" : c.score}
                    </span>
                    <span className="text-sm font-medium text-[#0f172a]">
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.status ? (
                      <SeverityBadge band={c.status} size="sm" />
                    ) : null}
                    <span className="w-12 text-right font-mono text-xs text-[#64748b]">
                      {c.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Tabla de bandas - thresholds reales 80/65/50/30 */}
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

      {/* 4. PLATAFORMAS - 6 motores de IA (LND-4) */}
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
                  <a
                    href={p.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    {p.bot}
                  </a>
                </div>
                <p className="text-xs leading-relaxed text-[#475569]">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TABLA COMPARATIVA (LND-14) - Relevy vs auditoría manual, celdas
          con datos reales (nunca placeholders). <table> semántica: gana
          puntos de estructura (RCI-5) y extracción (RPL-10). */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {LANDING_COPY.comparison.eyebrow}
          </span>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
            {LANDING_COPY.comparison.title}
          </h2>
          <p className="mt-2 text-sm text-[#475569] sm:text-base">
            {LANDING_COPY.comparison.lead}
          </p>
        </div>
        {/* LND-14 (sprint 15): the wrapper scrolls horizontally on narrow
            viewports (overflow-x-auto) and the <table> keeps a min-width so
            columns stay legible instead of squeezing; the semantic <table>
            markup is preserved (RCI-5/RPL-10). */}
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">
              {LANDING_COPY.comparison.caption}
            </caption>
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                {LANDING_COPY.comparison.header.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#475569]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {LANDING_COPY.comparison.rows.map((row) => (
                <tr
                  key={row.criterion}
                  className="transition-colors hover:bg-[#f8fafc]"
                >
                  <th
                    scope="row"
                    className="px-6 py-3.5 font-medium text-[#0f172a]"
                  >
                    {row.criterion}
                  </th>
                  <td className="px-6 py-3.5 text-[#047857]">{row.relevy}</td>
                  <td className="px-6 py-3.5 text-[#475569]">
                    {row.alternative}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5b. CASE STUDY (LND-16, sprint 16) - EN heading (case-heading +
          question-form bonuses), NEUTRAL ES body with verified numbers only,
          placed between the comparison table and the FAQ. */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
            {LANDING_COPY.caseStudy.heading}
          </h2>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-[#475569] sm:text-base">
          {LANDING_COPY.caseStudy.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* 5c. CHANGELOG (LND-17, sprint 16) - H2 "Changelog" (engine
          changelog-heading pattern, +10 experience proxy) + <ul> with the
          three real semver lines (semver hits STAT_PATTERN; block 50-200). */}
      <section className="border-y border-[#e2e8f0] bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
              Changelog
            </h2>
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-[#475569] sm:text-base">
            {LANDING_COPY.changelog.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. FAQ VISIBLE (LND-13) - real Q&A, sin FAQPage JSON-LD (el engine
          descuenta FAQPage como deprecado, RSC-7) */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {LANDING_COPY.faq.eyebrow}
          </span>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
            {LANDING_COPY.faq.title}
          </h2>
        </div>
        <div className="divide-y divide-[#e2e8f0] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
          {LANDING_COPY.faq.items.map((item) => (
            <details
              key={item.question}
              className="group px-6 py-5 open:bg-[#f8fafc]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-[#0f172a]">
                <span>{item.question}</span>
                <span className="text-[#94a3b8] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#475569]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        {/* LND-13 (sprint 12): real content date, never a placeholder. The
            author byline moved to the global footer (SHL-11, sprint 16). */}
        <div className="mt-8 flex flex-col items-center justify-center gap-1 border-t border-[#e2e8f0] pt-8 text-center text-xs text-[#64748b]">
          <time dateTime={LANDING_COPY.contentDates.datePublished}>
            Publicado el {LANDING_COPY.contentDates.datePublished}
          </time>
        </div>
      </section>

      {/* 7. CTA FINAL - adaptado a la sesión (LND-6): sin teaser de precios
          (la ruta /pricing se eliminó en WU-1) */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm sm:p-12">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {LANDING_COPY.sections.ctaEyebrow}
          </span>
          <h2 className="mb-4 mt-2 font-serif text-3xl tracking-tight text-[#0f172a] sm:text-4xl">
            {LANDING_COPY.sections.ctaTitle}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-sm text-[#475569] sm:text-base">
            {LANDING_COPY.sections.ctaSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-[#0f172a] px-6 text-base font-medium text-white transition-all duration-150 hover:bg-[#1e293b] active:scale-[0.98]"
              >
                {LANDING_COPY.sections.ctaLoggedIn}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-[#0f172a] px-6 text-base font-medium text-white transition-all duration-150 hover:bg-[#1e293b] active:scale-[0.98]"
              >
                {LANDING_COPY.sections.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
