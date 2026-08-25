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

## Performance — Lighthouse (C15, WU-C3)

_Pendiente: este sprint lo completa WU-C3 (PR 7). Objetivo 95+ en desktop para
landing/pricing/report; desvíos de report/multipage documentados acá._
