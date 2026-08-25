# Performance & Accessibility Evidence

> Mediciones y desvíos del sprint 8 (Polish & Testing). Este archivo lo alimentan
> **C15 (Performance, WU-C3)** — resultados de Lighthouse — y **C14 (Accesibilidad,
> WU-C2)** — excepciones de contraste documentadas (A11Y-3). Nada se ignora en
> silencio: cualquier violación aceptada figura acá con su justificación.

## Accesibilidad — contraste de color (A11Y-3, C14)

El contraste WCAG 2.2 AA se verifica con `@axe-core/playwright` sobre la landing
en un browser real (jsdom no computa contraste; jest-axe deshabilita `cat.color`).

**Cómo correr el escaneo** (requiere el dev server arriba; en CI sin server el
test se salta, convención skip-if-no-env):

```bash
pnpm dev   # terminal 1
A11Y_CONTRAST_URL=http://localhost:3000 pnpm test src/app/__tests__/a11y-contrast.test.ts
```

**Resultado del último escaneo (WU-C2, feat/s8-wu-c2):**

| Página      | Resultado                    | Fecha      |
| ----------- | ---------------------------- | ---------- |
| Landing `/` | Sin violaciones de contraste | 2026-08-25 |

**Violaciones encontradas y corregidas (2026-08-25):** el escaneo inicial
detectó contraste insuficiente en el ScoreHero (`/100` + filas de benchmark) y
en los textos de los SeverityBadge (emerald/amber/red sobre fondos claros), más
el mismo patrón en `TextField` (error), navbar (pill de plan) y `AggregateHero`
(`/100`). Se aplicó el hex más cercano que cumple AA (4.5:1; 3:1 en texto
grande) sin romper la estética Gemini:

| Componente                                 | Antes (FAIL)                      | Después (PASS)     |
| ------------------------------------------ | --------------------------------- | ------------------ |
| ScoreHero `/100` (sobre `#f8fafc`, grande) | `#10b981` (2.42:1)                | `#047857` (5.24:1) |
| ScoreHero benchmark emerald (blanco)       | `#10b981` (2.53:1)                | `#047857` (5.48:1) |
| ScoreHero benchmark amber (blanco)         | `#f59e0b` (2.14:1)                | `#b45309` (5.02:1) |
| ScoreHero benchmark red (blanco)           | `#ef4444` (3.76:1)                | `#dc2626` (4.83:1) |
| SeverityBadge excellent/good (tint)        | `#10b981` (2.2:1)                 | `#047857` (4.77:1) |
| SeverityBadge fair (tint)                  | `#d97706` (2.94:1)                | `#b45309` (4.65:1) |
| SeverityBadge poor/critical (tint)         | `#ef4444`/`#dc2626` (3.29/4.22:1) | `#b91c1c` (5.66:1) |
| TextField error (blanco)                   | `#ef4444` (3.76:1)                | `#dc2626` (4.83:1) |
| Navbar pill de plan (tint)                 | `#10b981` (2.3:1)                 | `#047857`          |
| AggregateHero `/100` (blanco)              | `#10b981` (2.54:1)                | `#047857` (5.48:1) |

Los fondos tintados, bordes y dots conservan los hex de marca (decorativos
`aria-hidden` — el contraste de texto no aplica).

**Excepciones aceptadas (documentadas, no silenciadas):**

| Elemento | Violación | Justificación                              | Fix / alternativa                                                                                                            |
| -------- | --------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| —        | —         | Ninguna excepción aceptada hasta la fecha. | Si un hex futuro no cumple AA, usar el hex más cercano que cumpla el umbral sin romper la estética Gemini y registrarlo acá. |

> **Nota (WU-C3, 2026-08-25):** el escaneo Lighthouse de C15 encontró excepciones
> nuevas (ScoreBar `/100`, badge "Recomendado", progressbar sin nombre, brand
> link) que C14 no pudo ver — su test de contraste cubre solo la landing y sus
> tests axe renderizan contenido mock. Están documentadas con evidencia y fix
> sugerido en la sección Performance → [Desvíos documentados (PERF-3)](#desvíos-documentados-perf-3)
> de este mismo archivo; quedan como follow-up fuera de WU-C3 para no mezclar
> scope de C14 en el PR de performance.

## Performance — Lighthouse (C15, WU-C3)

Tooling: `lighthouse` (devDep) + script npm `lighthouse` con preset desktop
(`formFactor: desktop`, throttling simulado 40ms RTT / 10 Mbps, sin throttling
de CPU — los mismos valores del flag CLI `--preset=desktop`). Chrome: usa
`CHROME_PATH` si está definido o autodetecta (Chrome del sistema, luego caches
de Playwright/Puppeteer). Los reportes JSON completos se guardan en
`.lighthouse/` (gitignored) como evidencia; este archivo resume los resultados.

**Cómo correr la medición** (requiere el dev server arriba; Lighthouse 13 lanza
Chrome headless por sí mismo):

```bash
pnpm dev            # terminal 1
pnpm lighthouse     # landing + pricing + report
pnpm lighthouse report   # una página puntual
```

Variables de entorno: `LH_BASE_URL` (default `http://localhost:3000`) y
`LH_REPORT_URL` (default `https://example.com` — la URL que la página report
audita en vivo).

**Resultado del último escaneo (WU-C3, 2026-08-25, Chrome 149 headless, desktop
preset):**

| Página   | URL                        | Performance | Accessibility | Best Practices | SEO |
| -------- | -------------------------- | ----------- | ------------- | -------------- | --- |
| Landing  | `/`                        | 99          | 100           | 100            | 100 |
| Pricing  | `/pricing`                 | 100         | 95            | 100            | 100 |
| Report   | `/report?url=example.com`  | 99          | 92            | 100            | 100 |

**PERF-2 (objetivo 95+) — CUMPLIDO en Performance** en las tres páginas
(landing 99, pricing 100, report 99). No hizo falta ningún fix de performance:
la landing y pricing son RSC livianas sin bundles client pesados, y el report
entrega el skeleton al instante (Suspense streaming) mientras el audit corre
server-side, así que el primer paint no espera al resultado.

### Desvíos documentados (PERF-3)

1. **Report — Accessibility 92.** Dos audits reales fallan, ambos en
   `src/ui/score-bar.tsx` (el reporte con datos reales renderiza barras de
   progreso que los tests axe de C14 —con contenido mock— nunca vieron):
   - `aria-progressbar-name` (peso 10): el fill con `role="progressbar"` +
     `aria-valuenow/min/max` no tiene nombre accesible. Fix sugerido:
     `aria-label` descriptivo en el fill (ej. `"Score X/100"`).
   - `color-contrast` (peso 7): la etiqueta `/100` usa `#94a3b8` sobre blanco
     (2.56:1; necesita 4.5:1 a 12px). Fix sugerido: `#64748b` (4.76:1).
2. **Pricing — Accessibility 95.** Un audit falla:
   - `color-contrast` (peso 7): badge "Recomendado" con texto blanco sobre
     `#10b981` (2.53:1; necesita 4.5:1 a 12px) en `src/billing/pricing-cards.tsx`.
     Fix sugerido: fondo `#047857` (blanco 5.48:1) — el emerald de texto que el
     design system ya usa (WU-C2).
3. **`label-content-name-mismatch` (peso 0 — no afecta el score):** el brand
   link del navbar lleva `aria-label="GeoAudit Inicio"` pero su texto visible
   incluye el tagline "AI Visibility Audit", que no está en el nombre
   accesible. Aparece en las tres páginas. Fix sugerido: un `aria-label` que
   contenga el texto visible (ej. `"GeoAudit — AI Visibility Audit"`).
4. **Multipage (`/multipage`) — no medible en este entorno:** la ruta exige
   sesión + plan PRO (feature-gate MPA-8), no hay credenciales locales. Es
   pesada por diseño (hasta 5 audits en vivo + reporte completo por página), así
   que un score <95 es esperable y se documentará cuando se mida con una sesión
   real.
5. **Report — el score de Performance depende de la URL auditada:** el audit
   corre server-side bajo Suspense; con una URL lenta el LCP se corre al tiempo
   del audit y el score cae. example.com es rápida (~2.8s de audit completo, de
   ahí el 99); una URL pesada o con timeout lo llevaría bajo 95. No es un
   defecto de la página: es la naturaleza del reporte en vivo y se documenta, no
   se fuerza.

**Siguiente paso (follow-up, fuera de WU-C3):** los 3 desvíos de a11y tienen
fix de una línea, bajo riesgo y sin tocar lógica de negocio; aplicarlos lleva
Report a ~100 y Pricing a ~100 en Accessibility. Se dejan como follow-up para
mantener el PR de performance (WU-C3) acotado a tooling + medición, sin
reabrir el scope de C14.
