import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { auditAction } from "@/lib/audit/actions";
import { AuditForm } from "@/ui/audit-form";
import { Card } from "@/ui/card";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";
import type { SeverityBand } from "@/lib/contracts/audit-result";

/**
 * Root landing page (U2, LND-1..5, ADF-1/8): full marketing landing.
 * The hero drives the REAL audit flow via AuditForm + auditAction (LND-1), the
 * "how it works" section explains the five real domains (LND-2), the scorecard
 * preview shows the real severity bands (LND-3), the platform section names the
 * six supported AI platforms (LND-4), and the closing teaser links to /pricing
 * (LND-5) without inventing features or prices.
 */

/** Band → illustrative range + Spanish label, from the shared P3 contract. */
const BAND_ROWS: {
  band: SeverityBand;
  range: string;
  label: string;
  description: string;
}[] = [
  {
    band: "Excellent",
    range: "90–100",
    label: "Excelente",
    description:
      "Visibilidad sobresaliente en buscadores con IA y citas frecuentes.",
  },
  {
    band: "Good",
    range: "75–89",
    label: "Bueno",
    description: "Buena base, con oportunidades puntuales de mejora.",
  },
  {
    band: "Fair",
    range: "60–74",
    label: "Regular",
    description: "Presencia parcial que conviene reforzar en varios dominios.",
  },
  {
    band: "Poor",
    range: "40–59",
    label: "Deficiente",
    description: "Baja citabilidad; hay trabajo estructural por delante.",
  },
  {
    band: "Critical",
    range: "0–39",
    label: "Crítico",
    description:
      "Problemas de acceso o contenido que bloquean a los motores de IA.",
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
    <main className="w-full">
      {/* 1. HERO — real audit form (LND-1) */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pt-18">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-emerald"
          />
          <span className="font-medium text-text-primary">GEO Engine</span>
          <span className="text-border-strong">|</span>
          <span>Auditoría de visibilidad en motores de IA</span>
        </div>

        <h1 className="mx-auto mb-6 max-w-4xl font-display text-4xl leading-[1.08] tracking-tight text-navy sm:text-6xl md:text-7xl">
          ¿Cómo te citan los motores de IA cuando buscan tu categoría?
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
          Pega tu URL y obtené en segundos un{" "}
          <strong className="font-semibold text-text-primary">
            GEO Score 0-100
          </strong>{" "}
          con diagnóstico detallado de presencia en ChatGPT, Claude, Perplexity,
          Gemini, Google AI Overviews y Bing Copilot.
        </p>

        <div className="mx-auto mb-8 max-w-2xl">
          <AuditForm action={auditAction} />
        </div>
      </section>

      {/* 2. CÓMO FUNCIONA — 5 dominios reales (LND-2) */}
      <section className="border-y border-border bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Metodología de análisis
            </span>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">
              Cómo analiza GeoAudit tu visibilidad sintética
            </h2>
            <p className="mt-2 text-sm text-text-secondary sm:text-base">
              Inspección técnica multidimensional sobre los cinco dominios que
              deciden cómo te citan los motores generativos.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            {/* Dominio 1 — tarjeta ancha destacada */}
            <Card className="flex flex-col justify-between lg:col-span-5">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-white">
                  01
                </div>
                <h3 className="mb-2 font-display text-2xl tracking-tight text-navy">
                  Acceso de bots
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                  Verificamos si{" "}
                  <code className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-text-primary">
                    robots.txt
                  </code>
                  , encabezados HTTP y metaetiquetas permiten o bloquean a los
                  crawlers de IA.
                </p>
              </div>
              <div className="space-y-1 rounded-lg border border-border bg-surface p-3 font-mono text-xs text-text-secondary">
                <div className="flex items-center gap-1.5 font-medium text-emerald">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                  GPTBot / OAI-SearchBot: acceso permitido
                </div>
                <div className="flex items-center gap-1.5 font-medium text-emerald">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                  ClaudeBot: Allow
                </div>
              </div>
            </Card>

            {/* Dominios 2-5 — columna derecha */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              <Card className="flex flex-col items-start gap-4 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-white">
                  02
                </div>
                <div>
                  <h3 className="font-display text-xl tracking-tight text-navy">
                    Citabilidad
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Medimos qué tan probable es que los modelos citen o citen
                    textualmente pasajes de tu página como fuente canónica.
                  </p>
                </div>
              </Card>

              <Card className="flex flex-col items-start gap-4 bg-navy text-white shadow-md sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald font-mono text-sm font-bold text-navy">
                  03
                </div>
                <div>
                  <h3 className="font-display text-xl tracking-tight text-white">
                    E-E-A-T
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Evaluamos experiencia, experticia, autoridad y confiabilidad
                    del contenido para la ponderación de fuentes.
                  </p>
                </div>
              </Card>

              <Card className="flex flex-col items-start gap-4 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-white">
                  04
                </div>
                <div>
                  <h3 className="font-display text-xl tracking-tight text-navy">
                    Datos estructurados
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Detectamos y validamos el JSON-LD y Schema.org que los LLMs
                    usan para corroborar entidades y hechos.
                  </p>
                </div>
              </Card>

              <Card className="flex flex-col items-start gap-4 sm:flex-row">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-white">
                  05
                </div>
                <div>
                  <h3 className="font-display text-xl tracking-tight text-navy">
                    Plataforma
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Comprobamos readiness, SSR, OG y headers para cada motor de
                    búsqueda generativa.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SCORECARD PREVIEW — bandas reales (LND-3) */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Scorecard unificado
          </span>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">
            El GEO Score: un estándar de 0 a 100
          </h2>
          <p className="mt-2 text-sm text-text-secondary sm:text-base">
            Cada puntuación se traduce en una banda de severidad con impacto
            directo en tu visibilidad. Preview ilustrativo de la escala.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border bg-surface-muted px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Escala de bandas y criterios técnicos
            </h3>
          </div>
          <div className="divide-y divide-border">
            {BAND_ROWS.map((row) => (
              <div
                key={row.band}
                className="flex flex-col justify-between gap-2 p-4 transition-colors hover:bg-surface-muted sm:flex-row sm:items-center sm:px-6 sm:py-3.5"
              >
                <div className="flex min-w-[200px] items-center gap-3">
                  <span className="w-16 font-mono text-xs font-bold text-text-primary">
                    {row.range}
                  </span>
                  <SeverityBadge band={row.band.toLowerCase() as GeminiBand} />
                </div>
                <p className="flex-1 text-xs text-text-secondary sm:text-sm">
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
