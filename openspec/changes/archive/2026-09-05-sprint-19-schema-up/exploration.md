# Exploration: Sprint 19 — Schema score 62 → ~92 with real data

## Current State

The landing page (relevy.app) is audited by the schema engine (`scoreSchema`, `src/schema/index.ts:54`).
Today it emits exactly 2 JSON-LD blocks (Organization + WebSite, `src/app/page.tsx:63-119`, rendered at
`src/app/page.tsx:227-228`) and scores **62/100**. The 12-criterion rubric math checks out exactly
(`src/schema/index.ts:159-348`): 13+9+0+0+5+0+5+10+0+10+5+5 = 62.

Verified per-criterion mechanics:
- `organization_person` 13/15 — the Organization node is complete but misses `award` (recommended),
  a deliberate LND-7 omission (`src/app/page.tsx:84-87`, `src/lib/brand.ts:74-77`).
- `same_as` 9/15 — `countValidSameAs` (`src/schema/index.ts:101-109`) sums valid http(s) links across
  flattened nodes. `ORG_SAME_AS` (`src/lib/brand.ts:28-32`) has exactly 3 valid links → 3×3 = 9.
  `FOUNDER` shares the same array but is NESTED inside `Organization.founder` → never flattened → no double count.
- `article_author` 0/10 — no Article node (`ARTICLE_TYPES`, `src/schema/index.ts:95-99`).
- `business_type_schema` 0/10 — `detectBusinessType` (`src/schema/classify.ts:70-131`) returns **publisher**
  for the anonymous crawl (only signal: footer `.byline`, `src/ui/footer.tsx:69`, `hasByline` at
  `classify.ts:58-60`), and `primaryTypeFor("publisher") = "Article"` (`src/schema/generate.ts:33-34`).
  No Article node → 0.
- `website_search_action` 5/5, `json_ld_format` 5/5, `server_rendered` 10/10, `valid_json_types` 10/10,
  `knows_about` 5/5, `no_deprecated` 5/5 — confirmed against the code.
- `breadcrumbs` 0/5 — `nodes.some(n => n.type === "BreadcrumbList")` (`src/schema/index.ts:256-264`);
  NO BreadcrumbList exists anywhere in the app (grep: only registry/fixtures/specs).

### Non-obvious discovery: business type is SESSION-DEPENDENT

The classifier (`classify.ts:87-91`) awards `saas +1` when the visible text contains `\bdashboard\b`.
- Anonymous crawl → CTA is "Auditar gratis" → no "dashboard" → signals: saas=0, publisher=1 (byline),
  agency=0 → **publisher** (business_type_schema 0/10).
- Authenticated crawl → CTA is "Ir al dashboard" → saas=1 → tie saas/publisher → **hybrid**
  (business_type_schema 10/10, since `primaryTypeFor("hybrid") = "Organization"`).

Verified with node: `\bcase stud\b` does NOT match "Case Study" ("y" blocks the boundary) → agency=0;
Spanish copy never matches the English saas/login patterns. Adding an Article schema makes publisher
score 2 signals (schema type + byline) → business type becomes STABLE regardless of session.

## Affected Areas

- `src/lib/brand.ts:28-32` — `ORG_SAME_AS`: add 2 more real profiles (lever 1). Flows to `FOUNDER` automatically.
- `src/app/page.tsx:63-119, 660-678` — new `ArticleJsonLd()` block (same inline-SSR pattern) +
  stable id on the Case Study container for the speakable selector.
- `src/lib/copy.ts:308-325` — real `contentDates.datePublished` (2026-08-20) / `dateModified` (2026-08-28)
  and `caseStudy.heading`/`paragraphs` are the honest Article payload.
- `src/app/dashboard/page.tsx`, `src/app/dashboard/audits/[id]/page.tsx`,
  `src/app/dashboard/profile/page.tsx` — optional BreadcrumbList placement (honest hierarchy).
- `src/app/__tests__/page.test.tsx:347-479` — existing JSON-LD assertions use `toBeGreaterThanOrEqual(2)`
  and `toContain` → SAFE to add a 3rd block; new Article assertions needed (strict TDD).
- `src/schema/__fixtures__/ld-rubric-rich.html` — reference fixture: Organization(5 sameAs) + WebSite +
  BreadcrumbList + Article(author+speakable) scores 98.

## Approaches

### Lever 1 — sameAs 9 → 15 (+6)

1. **Add 2 more real profiles to `ORG_SAME_AS`** (recommended)
   - Pros: real, verifiable, honest (LND-7); automatic propagation to `FOUNDER`; no engine change.
   - Cons: requires Ezequiel to confirm which profiles he actually owns (X/Twitter, YouTube, Instagram,
     Product Hunt, Google Business Profile, Facebook, GitHub org, etc. — handles MUST NOT be invented).
   - Effort: Low
2. **Emit the Article author as a flattened Person node in `@graph`** (same 3 links reused → +9 sameAs → cap 15)
   - Pros: no new profiles needed; data is technically real.
   - Cons: score-gaming — reuses the same 3 links on a 2nd entity purely to inflate the criterion;
     conflicts with the LND-7/spirit of the engine. Flagged for user decision, not recommended.

### Lever 2 — Article + speakable (+25: article 10 + business_type 10 + speakable 5)

1. **`ArticleJsonLd()` inline in `page.tsx`** (recommended, single approach)
   - headline: `caseStudy.heading` (real); datePublished: `contentDates.datePublished` (2026-08-20, already
     visible on the page); author: `FOUNDER` (name + sameAs → `articleAuthorPoints` = 10);
     publisher: Organization (BRAND_NAME + APP_URL); dateModified: `contentDates.dateModified`;
     image: `${APP_URL}/og.png`; url: APP_URL; speakable: SpeakableSpecification with cssSelector.
   - Use `@type: "Article"` (NOT "TechArticle"): `classify.ts:109-115` only fires the publisher signal for
     `article/newsarticle/blogposting`; both satisfy the rubric (`ARTICLE_TYPES`).
   - speakable selector: the Case Study container (`page.tsx:666`) currently has NO id/class → add a stable
     id (e.g. `id="case-study"`) and reference `cssSelector: ["#case-study"]`. Honest: selector must exist
     in the served HTML.
   - Pros: +25 on the landing; stabilizes businessType to publisher; all fields real.
   - Cons: touches UI markup (id) + JSON-LD; needs new tests.
   - Effort: Low-Medium

### Lever 3 — BreadcrumbList (+5)

1. **BreadcrumbList on dashboard pages only** (recommended, honest)
   - `/dashboard` → Home > Dashboard; `/dashboard/audits/[id]` → Home > Dashboard > Auditoría (page already
     has a back-to-history bar); `/dashboard/profile` → Home > Dashboard > Perfil. Shared component, e.g.
     `BreadcrumbListJsonLd({ items })`. No `dashboard/layout.tsx` exists — component goes per-page.
   - Cons: the dogfood landing audit does NOT see it → landing score stays 93, not 98.
2. **Single-item Home BreadcrumbList on the landing**
   - Pros: +5 on the landing audit (→ 98).
   - Cons: a root page has no real breadcrumb trail; weak honesty (LND-7). User decision.
   - Effort: Low

### Lever 4 — award

- Confirmed: NO real award exists; `award` stays omitted (`page.tsx:84-87`, `brand.ts:74-77`).
  `organization_person` stays 13/15 (+2 permanently pending). Document only, no code.

## Recommendation

Execute levers 1 (add 2 real profiles after Ezequiel confirms them), 2 (Article + speakable on the
landing), and 4 (documentation only). For lever 3, add BreadcrumbList on the dashboard pages (honest);
the landing reaches **93** without it, which already clears the ~92 target. The landing score with
breadcrumbs on dashboard: 93; if the user wants 98 on the landing itself, that is a separate honesty
decision (single-item Home breadcrumb) to confirm in proposal.

## Risks

- Business type currently flips publisher(anon)/hybrid(authed): any future CTA copy change can re-flip it.
  Pin with a landing fixture test asserting publisher + rubric 93.
- speakable cssSelector must reference a real element — the id must be added to the Case Study markup or
  the data is dishonest.
- sameAs +2 profiles MUST be real and verified; never invent handles. If no more profiles exist, the
  flattened-Person trick reaches 15 but is score-gaming — user decision.
- Breadcrumbs on dashboard don't move the landing score; landing breadcrumb is an honesty tradeoff.
- Adding a 3rd JSON-LD block: existing tests are safe (`toBeGreaterThanOrEqual(2)`, `toContain`), but
  strict TDD requires new assertions (Article fields, speakable selector presence, no FAQPage regression).

## Ready for Proposal

Yes — all four levers are fully characterized with exact file/line references. The proposal should ask
the user to (1) confirm which 2 real profiles to add to `ORG_SAME_AS`, and (2) decide breadcrumb
placement (dashboard-only vs landing single-item).