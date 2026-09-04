# Design: Sprint 16 — Raise GEO Score with landing content

## Technical Approach

Five copy/markup changes, zero engine code. Each targets a specific scoring lever verified against the engine rubrics (`expertise.ts`, `experience.ts`, `citability/constants.ts`). All copy is neutral Spanish except the two locked English loanword headings ("Case Study", "Changelog"). No routing/shell/subprocess boundary → threat matrix N/A.

## Architecture Decisions

| # | Decision | Options | Choice | Rationale |
|---|---|---|---|---|
| D1 | Byline markup + placement | (a) `<p class="byline">` in Footer (root layout, all pages); (b) keep in page.tsx with class; (c) `rel="author"` link | **(a)** | `AUTHOR_SELECTOR` (`.byline, [rel="author"], .author, author`) matches `.byline` alone; `scoreExpertise` reads the FULL DOM (`expertise.ts:67`), so a footer byline is detected on the landing AND every subpage. Footer is stripped from `pageText`/`paragraphTexts` (`BOILERPLATE_SELECTOR` incl. `footer`) and citability (`EXCLUDE_SELECTOR` incl. `footer`) → zero collateral. `rel="author"` requires an anchor (adds a stripped external link, no gain) — rejected. `<time>` stays in FAQ (date is content-specific; byline is shell authorship). |
| D2 | `FOUNDER.sameAs` | (a) shared ref `sameAs: ORG_SAME_AS`; (b) duplicate array literal; (c) standalone Person block | **(a)** | Reuse the SAME const (GitHub/LinkedIn/ezefernandez.com). `sameAsUrls` dedupes → authoritativeness unchanged (+0); the +2 comes only from `isPersonSameAs` on the nested founder node (already banked as Person +5 via `collectTypeNodes` recursion). Standalone Person block adds nothing and risks schema duplication. |
| D3 | Case Study | (a) H2 question + 2-3 neutral-Spanish `<p>` in `LANDING_COPY.caseStudy`; (b) English first-person body | **(a)** | Scope LOCKED: ES body → experience caps 15/25 (first-person/case-phrase triggers are EN-only). Heading "Case Study: ¿…?" earns +5 (`CASE_HEADING_PATTERN`) +20 citability question bonus (H2 ends "?"). (b) would reach 25 but violates the locked ES-body decision. |
| D4 | Changelog | (a) `<ul>` 3 `<li>` semver lines in `LANDING_COPY.changelog`; (b) plain `<p>` | **(a)** | `<ul>` earns `STRUCTURE_LIST_TABLE_BONUS` (+20). Semver strings hit `STAT_PATTERN` (`\bv?\d+\.\d+\.\d+\b`). Each line ~16-23 words so the block clears the 50-word band (3 short lines alone would fall under 50). |
| D5 | PLATFORMS rewrite | (a) keep inline in `page.tsx`, rewrite `desc` only; (b) move to copy.ts | **(a)** | `PLATFORMS` carries `docs` URLs rendered as external citations (LND-12 authoritativeness needs ≥5 abs links) and `name/bot/company` are exact-match tested. Rewrite only `desc`: 2-4 sentences, 50-200 words, explicit-subject lead. **STAT gotcha**: "17 agentes"/"6 plataformas"/"<30 s" do NOT match `STAT_PATTERN` — each card needs a `%`, a 4-digit year (`2026`), or a semver token. |
| D6 | Test co-updates | enumerate + move LND-13 | **see Testing** | FOUNDER `toEqual` (2 files), LND-13 byline assertion moves page→footer, date assertion stays, new section/platform tests. |

## Data Flow

No new flow — static server-render changes only:

```
copy.ts/brand.ts constants ──► page.tsx (sections) / footer.tsx (byline) ──► SSR HTML
                                                                                │
                                        engine scans full DOM: .byline / "Case Study" / "Changelog" / semver
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/ui/footer.tsx` | Modify | Add `<p className="byline">Por <span>{FOUNDER.name}</span>{` · ${SHELL_COPY.byline.role}`}</p>` under copyright; import `FOUNDER` + `SHELL_COPY` |
| `src/lib/copy.ts` | Modify | `SHELL_COPY.byline = { role: "Fundador de Relevy" }`; add `LANDING_COPY.caseStudy` + `changelog`; remove `LANDING_COPY.contentByline` (dead after move) |
| `src/lib/brand.ts` | Modify | `FOUNDER.sameAs = ORG_SAME_AS` |
| `src/app/page.tsx` | Modify | Remove FAQ byline `<p>` (keep `<time>`); add Case Study + Changelog `<section>`s between comparison and FAQ; rewrite 6 `PLATFORMS[].desc` |
| `src/app/__tests__/page.test.tsx` | Modify | Founder `toEqual` += `sameAs`; split LND-13 (keep date, drop name/role); add Case Study/Changelog/platform assertions |
| `src/lib/brand.test.ts` | Modify | `FOUNDER` `toEqual` += `sameAs: ORG_SAME_AS` |
| `src/ui/__tests__/footer.test.tsx` | Modify | Add byline presence + `.byline` class + name/role |

## Interfaces / Contracts

```ts
// brand.ts
export const FOUNDER = {
  "@type": "Person",
  name: "Ezequiel Alejandro Fernandez",
  sameAs: ORG_SAME_AS,
} as const;

// copy.ts
SHELL_COPY.byline = { role: "Fundador de Relevy" };
LANDING_COPY.caseStudy = {
  heading: "Case Study: ¿Cómo mejoramos el GEO Score de nuestro propio sitio?",
  paragraphs: [
    "Relevy auditó su propio sitio con el motor que utiliza para auditar a sus clientes. Sobre un corpus de 14 URLs, Relevy obtuvo 55 puntos, frente a 57 de moz.com y un promedio general de 42,4. El resultado confirma que el motor mide con la misma vara a todos los dominios.",
    "Durante 2026, el GEO Score de Relevy pasó de 47 a 62 puntos aplicando los mismos cambios que recomienda a sus usuarios. Cada auditoría completa el análisis en menos de 30 segundos sobre las 6 plataformas de búsqueda generativa.",
  ],
};
LANDING_COPY.changelog = [
  "v3.1.0 — Calibración de los pesos de las seis dimensiones (24/23/15/12/14/12), bandas 80/65/50/30 y motor de citabilidad v3.1 con piso de unicidad.",
  "v3.0.0 — Incorporación de la sexta dimensión de autoridad de marca, con verificación de Wikipedia y Wikidata en cada auditoría.",
  "v2.0.0 — Primer modelo de puntuación calibrado, con ponderaciones iniciales por dimensión y bandas de severidad.",
];
```

Platform `desc` recipe (D5): lead with platform name / explicit noun (never `Es`/`Su`/pronoun); 2-4 sentences; 50-200 words; one honest stat token (`2026`, `%`, or semver). Example (ChatGPT): "ChatGPT integra búsqueda web en vivo para sus planes Plus y Pro y responde con citas a fuentes consultadas en tiempo real. Su crawler GPTBot rastrea y OAI-SearchBot indexa el contenido cuando robots.txt lo permite. Relevy verifica el acceso de ambos bots en 2026 y mide el impacto sobre la visibilidad en este motor." Keep `name`/`bot`/`company`/`docs` untouched.

## Testing Strategy

| Layer | What | Where |
|-------|------|-------|
| Unit | `FOUNDER` gains `sameAs: ORG_SAME_AS` | `brand.test.ts` (strict `toEqual`) |
| Unit (RTL) | Footer byline `.byline` + name + role | `footer.test.tsx` |
| Unit (RTL) | Case Study H2 exact + between comparison/FAQ; Changelog H2 + 3 versions; platform desc 50-200w/answer-first/stat | `page.test.tsx` |
| Unit (RTL) | LND-13 date stays; byline absent from `<Page/>` | `page.test.tsx` |
| Unit | `VOSEO_PATTERN`, word band, stat pattern on new copy | `copy.test.ts` (caseStudy/changelog); page.test (platform desc) |
| A11y | axe page + full shell; H2 order (comparison → Case Study → Changelog → FAQ) | `a11y.test.tsx` |

Co-update risk: `page.test.tsx:346-349` (founder), `:427-434` (byline split). New copy must avoid exact-match collisions ("92" ban, six domain/FAQ/platform name `getByText` uniqueness — descs are multi-word `<p>` so no collision with H3 exact matches).

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration. Per-item atomic commits; copy+test and brand+test travel together. Re-pin evidence via `pnpm verify:scorehero` (verify phase).

## Open Questions

None — D1–D6 resolved. Risk only: composite may land 67-70 if ES-only bodies cap experience at 15/25 (documented honest shortfall, never fake).
