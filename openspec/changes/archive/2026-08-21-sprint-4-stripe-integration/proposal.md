# Proposal: Sprint 4 — Stripe Integration

## Intent

Monetizar GeoAudit: suscripciones Stripe (Pro/Enterprise) con pricing page, Checkout redirect, Customer Portal, webhook idempotente, persistencia de `Subscription` y enforcement de límites por tier. `User.tier` ya existe (FREE/PRO); este cambio suma ENTERPRISE y sincroniza tier desde Stripe.

## Scope

### In Scope
- **/pricing** — 3 planes (Free $0 · 3/30d, Pro $9/mes · 10/mes, Enterprise $49/mes · 50/mes) + CTAs.
- **Checkout** — Server Action (`auth()` + `user.id` → get/create customer → `checkout.sessions.create`) y redirect a Stripe.
- **Customer Portal** — Server Action crea portal session y redirige (PRO/Enterprise).
- **Webhook** — `/api/webhooks/stripe` (`runtime: nodejs`, raw body, verificación de firma, idempotente por event id/`stripeSubscriptionId`). Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- **Modelo** — `Subscription` 1:1 `User` (stripeCustomerId unique, stripeSubscriptionId?, plan, status, currentPeriodEnd, auditsUsed, auditsResetAt) + enums `Plan` (FREE/PRO/ENTERPRISE) y `SubscriptionStatus` + migración. `User.tier` gana ENTERPRISE (denormalizado).- **Dominio** — `src/billing/` (stripe client, subscription service, webhook handler) con contracts zod.
- **Tier sync** — `aplicaSubscriptionEvent`: ACTIVE→PRO/ENTERPRISE (según price), canceled/expired→FREE.
- **Enforcement** — `src/lib/audit/tier.ts` por tier (FREE=3/30d moving window, PRO=10/mes, ENTERPRISE=50/mes).
- **CTA Upgrade** en dashboard → "Gestionar suscripción" según tier.

### Out of Scope
- Stripe Elements/embedded checkout (usamos redirect); facturación/recibos; trial; cupones/gifts; migración legacy; E2E Playwright de pago real (solo unit/integration con mocks).

## Non-goals / Constraints
- No tocar el audit engine. FREE sigue = 3/30d.
- Price ids reales en Stripe Dashboard (test mode) → env `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE` (sumar a `.env.example`; ya hay `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`). Dep nueva: `stripe`.
- Webhook verifica firma; no confiar en claims del body sin verificar.
- Strict TDD (`pnpm test`); conventional commits.

## Capabilities

> Contrato con sdd-spec. Baseline = `openspec/specs/`.

### New Capabilities
- `billing`: modelo `Subscription` + enums, stripe client singleton, checkout/portal actions, webhook idempotente con verificación de firma, `aplicaSubscriptionEvent`.
- `pricing`: página `/pricing` con 3 planes + CTAs.

### Modified Capabilities
- `tier-limits`: **TLM-1** `Tier` gana ENTERPRISE; **TLM-2** límites por tier (PRO=10/mes, ENTERPRISE=50/mes, FREE=3/30d).
- `dashboard`: CTA Upgrade que alterna a "Gestionar suscripción" según tier.
- `database-connection`: schema deja de ser auth-only (agrega `Subscription` + `Plan`/`SubscriptionStatus`).

## Approach

- Checkout/Portal = Server Actions; webhook = API route `nodejs` (raw body + `stripe.webhooks.constructEvent`).
- Dominio `src/billing/`: stripe client (singleton lazy), `subscriptionService` (getOrCreateCustomer, createCheckoutSession, createPortalSession), `webhookHandler`.
- `Subscription` 1:1 `User`; tier denormalizado en `User`.
- Idempotencia: dedupe por `stripeSubscriptionId`/event id (guardar evento procesado o unique constraint).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Webhook raw body en serverless (Next 15.5 `route.ts` con `request.text()`) | Med | `runtime: nodejs` + leer body crudo antes de parsear; probar con `stripe listen`. |
| Firma mal verificada → eventos falsos | Low | `constructEvent` con `STRIPE_WEBHOOK_SECRET`; nunca confiar en body. |
| Race/webhook duplicado → doble upgrade | Med | Idempotencia por event id; upsert por `stripeSubscriptionId`. |
| `User.tier` (FREE/PRO) vs `Plan` (3 planes) → dos enums divergentes | Med | Resolver en spec: extender `Tier` a ENTERPRISE o unificar enum. |
| Enforcement dual (FREE moving window vs paid mensual `auditsUsed`/`auditsResetAt`) | Med | Definir reset exacto en spec; FREE conserva TLM-2, paid usa contador mensual. |
| `/pricing` "desde nav" sin nav/header existente | Med | Link mínimo en layout o CTA dashboard; decidir en design. |
| Migración de schema en producción con `Subscription` nuevo | Low | Aditivo; `migrate dev`; rollback sin datos destructivos. |

## Decisions (resueltas con el usuario)
1. **Enum unificado**: un solo enum `Tier` (FREE/PRO/ENTERPRISE) es la fuente única — `User.tier` y `Subscription.plan` usan el MISMO enum. Cero divergencia.
2. **Reset paid = currentPeriodEnd**: el contador mensual (`auditsUsed`/`auditsResetAt`) se resetea cuando `currentPeriodEnd` pasa (ciclo de 30 días de Stripe). FREE conserva moving window 30 días (TLM-2).
3. **Acceso a /pricing**: solo CTA "Upgrade" en dashboard (no se crea nav global en este sprint).

## Rollback Plan

- Cada slice = PR independiente (revert aislado).
- Migración aditiva: `prisma migrate reset` en dev; drop de `Subscription` en Supabase si hace falta (sin baseline destructivo).
- Webhook: borrar endpoint en Stripe Dashboard + remover route; `STRIPE_*` sin set = webhook no-op/fail-safe.
- Enforcement: revertir `tier.ts` a solo-FREE es un cambio de un archivo.

## Review Workload Forecast

| Slice (chained PR) | Contenido | Est. líneas |
|---|---|---|
| U1 schema+billing lib | `Subscription`+enums+migración, contracts zod, stripe client | ~250 |
| U2 checkout+portal | Server Actions + redirects | ~180 |
| U3 webhook+tier sync | route + firma + idempotencia + `aplicaSubscriptionEvent` | ~280 |
| U4 pricing+enforcement | `/pricing`, CTA dashboard, `tier.ts` por tier | ~350 |

**Total estimado**: ~1.060 líneas → `400-line budget risk: High` · `Chained PRs recommended: Yes` · `Decision needed before apply: Yes` (ask-on-risk).

## Success Criteria

- [ ] `/pricing` lista 3 planes; botón crea Checkout Session y redirige.
- [ ] PRO/Enterprise ve "Gestionar suscripción" → Customer Portal.
- [ ] Webhook verifica firma, es idempotente y sincroniza tier (ACTIVE→PRO/ENTERPRISE, cancel→FREE).
- [ ] Límites por tier aplicados (FREE=3/30d, PRO=10/mes, ENTERPRISE=50/mes).
- [ ] `pnpm test` verde; lint + typecheck + build pasan; smoke `pnpm dev`.
