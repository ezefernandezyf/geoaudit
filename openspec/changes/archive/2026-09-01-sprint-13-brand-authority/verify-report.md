```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:27f742a6ccf8953a4130fece0af91f578d157d854ca378150e9e23424304fd4a
verdict: pass
blockers: 0
critical_findings: 0
requirements: 27/27
scenarios: 48/48
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:c2925c1f961961399855c2adc4b5a347c3071fcc0e39588570404c4c3203bde4
build_command: pnpm run typecheck && pnpm run lint
build_exit_code: 0
build_output_hash: sha256:d34e2158e6df9f72403b6bdf11253dace9ed48c0dbf64d1b03d5aeab4fd2c053
```

## Verification Report

**Change**: sprint-13-brand-authority
**Version**: v3.0.0 (scoring) / N/A (spec)
**Mode**: Standard

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 9 |
| Tasks complete | 9 (T1–T9) |
| Tasks incomplete | 0 |

### Build & Tests Execution

**Build**: ✅ Passed (typecheck 0 errors; lint 0 errors, 1 pre-existing warning in `coverage/`)

```text
$ tsc --noEmit
TYPECHECK_EXIT=0
$ eslint
  0 errors, 1 warning (coverage/block-navigation.js: unused eslint-disable directive)
LINT_EXIT=0
```

**Tests**: ✅ 1008 passed / ❌ 0 failed / ⚠️ 4 skipped (117 files passed, 1 skipped)

```text
$ vitest run
Test Files  117 passed | 1 skipped (118)
     Tests  1008 passed | 4 skipped (1012)
   Duration  54.23s
```

**Coverage**: ➖ Not available (not part of this gate; no coverage threshold required)

### Spec Compliance Matrix

| Requirement | Scenarios | Test | Result |
|-------------|-----------|------|--------|
| BRA-1 Entity presence | Article exists, No article | `src/brand/__tests__/probes.test.ts`, `scoring.test.ts` | ✅ COMPLIANT |
| BRA-2 Disambiguation | Same-name rejected, No candidate matches | `src/brand/__tests__/scoring.test.ts` | ✅ COMPLIANT |
| BRA-3 Entity consistency | Consistent entity, Mismatched label | `src/brand/__tests__/scoring.test.ts` | ✅ COMPLIANT |
| BRA-4 Wikidata completeness | Rich entity, Bare entity | `src/brand/__tests__/scoring.test.ts` | ✅ COMPLIANT |
| BRA-5 Composite score | Full presence ≥70, No presence → 0 | `src/brand/__tests__/scoring.test.ts` | ✅ COMPLIANT |
| BRA-6 Contract shape | (via RAO-10) | `src/lib/contracts/__tests__/audit-result.test.ts` | ✅ COMPLIANT |
| BRA-7 Failure isolation | Wikidata rate-limited | `src/brand/__tests__/probes.test.ts`, `index.test.ts` | ✅ COMPLIANT |
| BRA-8 Cost/determinism | Keyless and bounded (≤4) | `src/brand/__tests__/probes.test.ts` | ✅ COMPLIANT |
| RGS-1 v3 weights | all-80→80, uneven→68, citability dominant | `src/scoring/__tests__/calculator.test.ts` | ✅ COMPLIANT |
| RGS-7 scoringModelVersion | Version field present | `src/scoring/__tests__/calculator.test.ts` | ✅ COMPLIANT |
| RGS-8 Brand note | Note documents re-entry | `src/scoring/__tests__/calculator.test.ts` | ✅ COMPLIANT |
| RGS-9 Missing engine | Schema engine fails | `src/scoring/__tests__/calculator.test.ts` | ✅ COMPLIANT |
| RGS-10 Zero-content | Empty page | `src/scoring/__tests__/calculator.test.ts` | ✅ COMPLIANT |
| RGS-11 Brand dimension | 6 dims, brand fails→excluded, brand=0→64 | `src/scoring/__tests__/calculator.test.ts` | ✅ COMPLIANT |
| RAO-3 Shared DOM | DOM shared across engines | `src/audit/__tests__/shared-dom.test.ts` | ✅ COMPLIANT |
| RAO-10 Typed output | Complete AuditResult shape | `src/audit/__tests__/run-audit.test.ts` | ✅ COMPLIANT |
| RAO-12 Isolation | Citability throws, Brand API fails, All succeed | `src/audit/__tests__/run-audit-edge-cases.test.ts` | ✅ COMPLIANT |
| RAO-14 P99 <8s | Benchmark on fixture | `src/audit/__tests__/run-audit.test.ts` | ✅ COMPLIANT |
| RAO-15 Brand invocation | Every audit (anonymous), failure fallback | `src/audit/__tests__/run-audit.test.ts`, `run-audit-edge-cases.test.ts` | ✅ COMPLIANT |
| RAO-16 Persistence v3 | New persists v3, legacy 2.0.0 reads | `src/lib/contracts/__tests__/audit-result.test.ts` | ✅ COMPLIANT |
| APT-6 Six category scores | Six real scores, shared derivation | `src/report/__tests__/domain-metrics.test.ts`, `toGeminiViewModel.test.ts` | ✅ COMPLIANT |
| APT-11 Brand row honesty | Measured 0 → "sin presencia externa", legacy → "No medido" | `src/report/__tests__/domain-metrics.test.ts`, `src/pdf/__tests__/report-template.test.ts`, `src/ui/__tests__/score-bar.test.tsx` | ✅ COMPLIANT |
| RPL-10 Per-platform scoring | AIO ready, external criteria split | `src/platform/__tests__/per-platform.test.ts` | ✅ COMPLIANT |
| RPL-11 External labeling | 4 keys measured, rest not_measured | `src/platform/__tests__/per-platform.test.ts` | ✅ COMPLIANT |
| LND-11 Citable passages | Answer-first + stats, 50-200 band | `src/lib/__tests__/copy.test.ts` | ✅ COMPLIANT |
| LND-13 Content signals | FAQ≥5 (FAQPage omitted), question H2/H3, dates/byline, alt | `src/lib/__tests__/copy.test.ts`, `src/app/__tests__/page.test.tsx` | ✅ COMPLIANT |
| LND-14 Comparative table | Table ≥3 rows, no invented cells | `src/lib/__tests__/copy.test.ts`, `src/app/__tests__/page.test.tsx` | ✅ COMPLIANT |

**Compliance summary**: 48/48 scenarios compliant

### Correctness (Static Evidence)

| Domain | Status | Notes |
|--------|--------|-------|
| brand-authority | ✅ Implemented | `src/brand/{types,scoring,probes,index}.ts`; fórmula 60/25/15 (presence 40+20, completeness 10+5+5+5, consistency 15/7/0); gate `!entityPresence → 0`; P31 accept {Q43229,Q4830453,Q783794,Q6881511} / reject {Q5,Q95074} / bare→P856-only; ≤3 req happy path; `probeBrand` nunca tira (try/catch → `toReason`). |
| geo-score-calculator | ✅ Implemented | `GEO_SCORE_V3_WEIGHTS` 22.4/19.2/16/11.2/11.2/20 (suma 100); `DimensionKey += brand_authority`; `DIMENSIONS` 6; `Partial<Record<DimensionKey,number>>`; `?? 0` guards; brand=0 → nota; default V3. |
| audit-orchestrator | ✅ Implemented | `EngineName/EngineRun/AuditDeps += brand`; `scoreBrandEngine(target.hostname)` (nunca DOM); status "error" → `engineFailures.brand`; bridge `applyBrandCriteria` antes de `platformToContract`; `computeGeoScore` V3 con `brand_authority` (score si success, null si falla); `scoringModelVersion` "3.0.0"; `brandAuthority` siempre presente en v3 (error shape si falla); `auditUnsupportedPage` async y corre brand. |
| audit-presenters | ✅ Implemented | `DOMAIN_ROWS` 6 + `{engine:"brand",label:"Autoridad de marca"}`; `deriveBrandScore` → `number|null` (null si ausente o status≠success, 0 medido se conserva); caso `brand` en `rowScore` ANTES del default; `CategoryScore.score → number|null` + `status → GeminiBand|null`; `ENGINE_WEIGHT` V3 (brand 20); `BRAND_ZERO_DESCRIPTION "Sin presencia externa."`; ScoreBar null → "No medido" sin barra. |
| platform-readiness | ✅ Implemented | `applyBrandCriteria` puro: flipea `chatgpt.wikipedia(15)`/`chatgpt.wikidata(10)`/`chatgpt.entity_consistency(5)`/`perplexity.wikipedia_wikidata(5)` a measured; NUNCA toca `aio`; resto `not_measured` con nota TODO v3; no muta el input. |
| landing-page | ✅ Implemented | 6 features con pesos v3; `features[5]` "Autoridad de marca" (20%); FAQ 6 preguntas reconocibles; `comparison` tabla 5 filas reales; H2/H3 pregunta; datePublished/byline/alt intactos; SIN FAQPage JSON-LD. |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 `src/brand/` = types+probes+scoring+index | ✅ Yes | Estructura mirror schema/platform; JSON fetch propio reusa `assertPublicHost`+`followRedirects`. |
| D2 Fórmula 60/25/15 | ✅ Yes | presence 40+20 anti-disamb; completeness 10+5+5+5; consistency 15/7/0; gate BRA-5. |
| D3 Filtro P31 | ✅ Yes | Q43229/Q4830453/Q783794/Q6881511 aceptadas; Q5/Q95074 rechazadas; bare→P856. |
| D4 Contrato brandAuthorityResultSchema | ✅ Yes | `brandAuthority.optional()` + `scoringModelVersion` union("2.0.0"\|"3.0.0"). |
| D5 Scoring v3 | ✅ Yes | V3 weights; `Partial<Record>`; default V3; notas RGS-8/RGS-11. |
| D6 Derivación 6 filas | ✅ Yes | `deriveBrandScore`; `CategoryScore.score → number|null`; ENGINE_WEIGHT V3. |
| D7 Persistencia sin migración | ✅ Yes | Lectura JSONB sin Zod re-parse; escritura "3.0.0"; legacy "No medido". |
| D8 Wiring 4 keys (nunca aio) | ✅ Yes | Brand points solo en chatgpt/perplexity; sin doble conteo. |
| D9 Orquestador (hostname, aislamiento) | ✅ Yes | brand con `target.hostname`; `emptyBrandResult` + `meta.errors brand:` + null (RGS-9). |
| D10 Landing polish | ✅ Yes | 6 dims; features[5]; FAQ 6; tabla real; headings pregunta; evidencia regenerada. |

### Issues Found

**CRITICAL**: None

**WARNING**: None

**SUGGESTION**:
1. `src/audit/index.ts:226` — la rama degradada de URL inválida (RAO-1) aún escribe `scoringModelVersion: "2.0.0"` mientras todo camino v3 escribe "3.0.0". Es pre-existente, no persiste (no Zod-válido) y no rompe requisito, pero conviene alinearla a "3.0.0" por consistencia.
2. `src/brand/probes.ts:searchWikipedia` — match por título exacto (`title === brand` o `brand (disambiguation)`). Marcas con artículo bajo título distinto (p. ej. "Acme Corporation") no resuelven; heurística MVP documentada en design, no viola BRA-1.
3. `src/brand/scoring.ts:brandFromDomain` — usa el primer label del hostname (`host.split(".")[0]`); dominios compuestos (p. ej. `brand.example.co`) derivan solo "brand". Aceptable para MVP; revisitarlo con datos.

### Verdict

**PASS**

Las 9 tasks están completas, la suite pasa 1008/4 skipped con typecheck y lint en verde, y los 48 escenarios de los 27 requisitos están cubiertos por tests en verde. Ningún requisito rompe. El diff (~3618 líneas) supera el budget de 400 pero corresponde al plan feature-branch-chain aprobado por el usuario; los PRs 3 y 4 (>400 líneas cada uno) merecen revisión atenta, no corrección.
