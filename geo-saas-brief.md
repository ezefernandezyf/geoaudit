# GeoAudit — Project Brief (v1.0)

> **Product:** Micro-SaaS de auditoría GEO/SEO automatizada  
> **Owner:** Ezequiel Fernández  
> **Role:** Solo founder + full-stack developer  
> **Date:** August 2026  
> **Stack target:** Next.js 15 App Router + SSR + Stripe + Prisma + PostgreSQL

---

## 1. Executive Summary

**GeoAudit** es una herramienta SaaS que ingresa una URL y genera un reporte completo de visibilidad en AI search (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot). El reporte incluye un puntaje compuesto GEO Score (0-100), hallazgos categorizados por severidad, citability analysis pasaje por pasaje, estado de schema structured data, acceso de AI crawlers, recomendaciones accionables, y generación de schema JSON-LD corregido.

**¿Por qué existe?** Las empresas están perdiendo tráfico de search tradicional y no saben si los AI engines pueden encontrarlas, leerlas y citarlas. No existe una herramienta self-service que les dé un diagnóstico completo en minutos. Las agencias cobran USD 2.000–5.000 por auditoría manual. GeoAudit lo automatiza.

**Diferenciador:** Vos YA hacés esto manualmente con tus skills `geo-audit`, `geo-citability`, `geo-schema`, `geo-technical` y `geo-report`. GeoAudit es la versión SaaS de tu propio workflow de consultoría.

---

## 2. Target Audience

| Segmento | Necesidad | Volumen potencial |
|---|---|---|
| **Agencias SEO/digitales** | Auditar clientes rápido, generar leads con reportes gratuitos, white-label | Alto |
| **Startups SaaS** | Saber si los AI engines pueden citarlos, optimizar documentación y blog para AI search | Medio |
| **E-commerce managers** | Product schema, AI crawler access, visibilidad en Google AI Overviews | Medio |
| **CMOs / Heads of Growth** | Reporte ejecutivo de AI visibility, benchmarking trimestral, ROÍ de GEO | Bajo (alta disposición a pagar) |
| **Freelancers / marketers** | Diagnóstico rápido de su sitio o el de un cliente sin contratar agencia | Alto |

---

## 3. Value Proposition (Landing Page Copy Starters)

- "Find out if ChatGPT, Claude, and Perplexity can cite your website. In 3 minutes."
- "Your SEO is great. But can an AI find you? GeoAudit scores your AI visibility from 0 to 100."
- "The first self-service GEO audit for teams that can't afford a $3.000 agency report."
- "Know exactly what to fix. Get a prioritized action plan with ready-to-paste JSON-LD schema."

---

## 4. Feature Inventory

### 4.1 MVP Features (Must Have)

| Feature | Description | Learning goal |
|---|---|---|
| **Free audit (unauthenticated)** | Ingresa URL → audit instantáneo (limitado a 1 página, resultado público) | SSR + Server Actions |
| **GEO Score 0–100** | Composite score con 6 dimensiones ponderadas | Server Components data fetching |
| **AI Crawler Access Map** | Tabla de 8+ AI crawlers, si están bloqueados, con código robots.txt sugerido | Static analysis |
| **Citability Analysis** | Top 3 most-citable + bottom 3 least-citable content blocks con rewrite suggestions | Dynamic scoring engine |
| **Schema Detection** | Qué schemas están presentes, cuáles faltan, qué está mal, JSON-LD corregido generado | Prisma + Postgres persist |
| **Quick Wins List** | Top 5 acciones que se pueden hacer en < 4 horas con impacto estimado | Server Component rendering |
| **Auth (NextAuth/Auth.js)** | Sign up con email + password, OAuth (GitHub, Google) | NextAuth integration |
| **Stripe Free Tier** | Free = 1 audit/mes (1 página). Pro = 10 audits/mes (5 páginas c/u, USD 9/mes). Enterprise = ilimitado (USD 49/mes) | Stripe Checkout + Portal + webhooks |
| **Dashboard** | Historial de audits, scores en el tiempo, export PDF | Protected SSR routes, ISR |
| **PDF Export** | Reporte profesional descargable (usando tu know-how de `geo-report`) | API route + Puppeteer/pandoc |

### 4.2 V1 Features (Should Have)

| Feature | Description |
|---|---|
| **Multi-page audit** | Crawl hasta 5 páginas por audit, sitemap.xml auto-detect |
| **Competitor comparison** | Compará 2 URLs lado a lado con tabla comparativa |
| **White-label reports** | Custom logo, colores de marca, dominio CNAME (Enterprise tier) |
| **Email delivery** | Enviar reporte por email al terminar (con Resend o SendGrid) |
| **Shareable link** | URL pública del reporte para compartir con clientes |
| **Brand mention scanner** | Detectar presencia en Wikipedia, Reddit, YouTube, LinkedIn, Wikidata |
| **Historical trends** | Dashboard con evolución del GEO Score a lo largo de auditorías repetidas |
| **API** | REST API para integrar en CI/CD o herramientas internas (Enterprise tier) |

### 4.3 V2 Features (Nice to Have)

| Feature | Description |
|---|---|
| **Batch audit** | Subir CSV de URLs, procesar en lote |
| **Scheduled re-audits** | Auditoría automática cada mes, notificación por email |
| **AI recommendations (Groq)** | Usar Groq para generar rewrite suggestions más inteligentes |
| **Chrome Extension** | Auditar la página actual con un click |
| **Slack integration** | Recibir notificaciones de auditorías completadas en Slack |
| **Custom scoring weights** | Permitir al usuario ajustar los pesos de las 6 dimensiones |

---

## 5. Tech Stack & Rationale

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR, RSC, Server Actions, API routes. Lo que PIDE el mercado. |
| **Language** | TypeScript 5 (strict) | Ya lo dominás, el SaaS hereda tus convenciones. |
| **Styling** | Tailwind CSS 4 + DaisyUI 5 | Mismo stack que el portfolio, reutilizás tokens y patterns. |
| **Database** | PostgreSQL + Prisma ORM | Ya lo tenés en EchoLog y Egg. Schema versionado, migraciones. |
| **Auth** | NextAuth.js v5 (Auth.js) | OAuth (GitHub + Google) + credenciales. El estándar para Next.js. |
| **Payments** | Stripe (Checkout + Customer Portal + Webhooks) | El estándar del mercado. Aprendés billing idempotente, webhooks, manejo de suscripciones. |
| **Email** | Resend (React Email) | Moderno, usa JSX para templates. Alternativa: SendGrid (ya conocés EmailJS para forms, pero Resend es mejor para transactional). |
| **PDF** | Puppeteer + HTML template | Mismo approach que `geo-report-pdf` (HTML → Chrome headless → PDF). |
| **Fetching** | Native `fetch` + React `cache()` | Para auditar URLs externas desde Server Components/API routes. |
| **Queue** | Inngest o BullMQ + Redis (V1) | Para audits asíncronos de multi-página. MVP puede ser síncrono. |
| **Validation** | Zod 4 | Ya lo dominás. Schemas para input de URL, config de auditoría, etc. |
| **State** | URL search params + Server Components | No necesitás Zustand para esto. Los filtros/datos viven en el server. |
| **Testing** | Vitest + React Testing Library + Playwright (E2E) | Sumás Playwright E2E — es un skill nuevo y muy demandado. |
| **Deploy** | Vercel (MVP) → Docker + VPS (V1) | Empezás en Vercel que ya conocés. V1 migrás a Docker si querés aprenderlo. |
| **CI/CD** | GitHub Actions | Lint + typecheck + test + deploy preview en PRs. |
| **Monitoring** | Sentry (free tier) | Error tracking server-side y client-side. |

---

## 6. Data Model (Prisma Schema Sketch)

```prisma
// ─── Users & Auth (NextAuth) ───
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  audits        Audit[]
  subscription  Subscription?
  createdAt     DateTime  @default(now())
}

model Account {
  // NextAuth standard fields
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  // NextAuth standard fields
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  // NextAuth standard fields
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// ─── Subscription (Stripe) ───
model Subscription {
  id                String   @id @default(cuid())
  userId            String   @unique
  stripeCustomerId  String   @unique
  stripeSubscriptionId  String?
  plan              Plan     @default(FREE)
  status            SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd  DateTime?
  auditsUsed        Int      @default(0)
  auditsResetAt     DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}

// ─── Audit ───
model Audit {
  id          String   @id @default(cuid())
  userId      String?
  url         String
  status      AuditStatus @default(PENDING)
  geoScore    Int?        // 0-100
  pagesCrawled Int       @default(1)
  report      AuditReport?  // 1:1 con report
  error       String?      @db.Text
  isPublic    Boolean   @default(false)
  shareToken  String?   @unique  // para shareable links
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum AuditStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

// ─── Audit Report (1:1 con Audit) ───
model AuditReport {
  id          String   @id @default(cuid())
  auditId     String   @unique
  summary     Json     // executive summary + scores
  crawlers    Json     // AI crawler access map
  citability  Json     // citability block analysis
  schema      Json     // schema detection + generated JSON-LD
  platform    Json     // platform-specific optimization scores
  content     Json     // content quality / E-E-A-T
  quickWins   Json     // top 5 quick wins
  actionPlan  Json     // 30-day action plan
  rawData     Json?    // full audit data for re-processing
  createdAt   DateTime @default(now())
  audit Audit @relation(fields: [auditId], references: [id], onDelete: Cascade)
}
```

### Tier Limits (enforced server-side)

| Plan | Audits/mes | Páginas por audit | Features |
|---|---|---|---|
| Free | 1 | 1 | Reporte público, sin PDF, sin white-label |
| Pro (USD 9/mes) | 10 | 5 | PDF export, shareable link, historial |
| Enterprise (USD 49/mes) | Ilimitado | 20 | White-label, API access, competitor compare, PDF custom branding |

---

## 7. User Flows

### 7.1 Unauthenticated User — Free Audit

1. Landing page → input de URL + botón "Scan for free"
2. Server Action valida URL (Zod: `.url()` + HTTPS preferido)
3. Server Component fetchea la página (30s timeout, respeta robots.txt)
4. Corre los 5 análisis en paralelo (server-side, no client):
   - Crawler access checker (parsea robots.txt + headers)
   - Citability analyzer (segmenta contenido, puntúa bloques)
   - Schema detector (parsea JSON-LD, valida, genera corregido)
   - Content E-E-A-T assessor (word count, headings, author signals)
   - Platform readiness (header-level checks)
5. Calcula GEO Score compuesto
6. Renderiza el reporte en una Server Component pública
7. CTA: "Create free account to save this report and unlock PDF export"

### 7.2 Pro User — Authenticated Flow

1. Login → Dashboard (Protected SSR route)
2. Dashboard muestra: historial de audits, score trend, audits usados/quedan
3. "New audit" → input URL + opciones (cuántas páginas, nombre del proyecto)
4. Server Action inicia audit → background job (Inngest/queue en V1, síncrono en MVP)
5. Redirect a página de audit con polling (o streaming con RSC)
6. Reporte completo con PDF export
7. Shareable link público (opcional)
8. Stripe Customer Portal para manage subscription

### 7.3 Stripe Flow

1. User en Free → clicks "Upgrade to Pro" → Stripe Checkout Session (server-side redirect)
2. Stripe webhook `checkout.session.completed` → crea/actualiza Subscription en DB
3. User en Pro → clicks "Manage subscription" → Stripe Customer Portal (server-side redirect)
4. Stripe webhook `customer.subscription.updated` / `customer.subscription.deleted` → actualiza DB
5. Cron job (Vercel Cron) resetea `auditsUsed` mensualmente

---

## 8. Audit Engine Design

### 8.1 Dimensions & Weights

| Dimension | Weight | What it measures |
|---|---|---|
| AI Citability | 25% | Si el contenido tiene answer blocks, self-contained passages, estadísticas, datos únicos |
| Brand Authority | 20% | Presencia en Wikipedia, Reddit, YouTube, LinkedIn, Wikidata, GitHub |
| Content E-E-A-T | 20% | Author bylines, source citations, content depth, freshness, originalidad |
| Technical GEO | 15% | AI crawler access, llms.txt, SSR status, Core Web Vitals (LCP/INP/CLS básico) |
| Schema & Structured Data | 10% | JSON-LD completo, validado, sameAs links, business-type-specific schemas |
| Platform Optimization | 10% | Readiness para Google AIO, ChatGPT, Perplexity, Gemini, Copilot |

**Composite Score:** weighted average of all 6. Rounded. Capped at 100.

### 8.2 Crawler Access Map

Check robots.txt + HTTP response headers for these user agents:
`GPTBot`, `CCBot`, `anthropic-ai`, `Claude-Web`, `Googlebot`, `Google-Extended`, `Bingbot`, `PerplexityBot`, `Applebot-Extended`, `meta-externalagent`, `cohere-ai`, `Bytespider`, `Omgili`, `Omgilibot`, `ImagesiftBot`, `Diffbot`, `FacebookBot`

Output: tabla con status (Allowed / Blocked / Not explicitly mentioned), impacto (Critical / High / Medium), y recomendación.

### 8.3 Citability Engine

Algoritmo de scoring por content block:
1. Fetchear HTML → extraer main content (excluir nav, footer, sidebar, ads)
2. Segmentar por headings (H2, H3) en content blocks
3. Para cada block, calcular 5 sub-scores:
   - **Answer Block Quality (30%)**: ¿empieza con definición? ¿respuesta en primeras 2 frases?
   - **Self-Containment (25%)**: ¿nombra el sujeto explícitamente? ¿entendible sin contexto?
   - **Structural Readability (20%)**: ¿usa listas, tablas, párrafos cortos?
   - **Statistical Density (15%)**: ¿cuántos datos concretos, números, fuentes nombradas?
   - **Uniqueness (10%)**: ¿contiene datos propios, investigación original, o insights no replicables?
4. Block score = weighted average. Page score = average of all blocks.
5. Output: top 3 strongest blocks + bottom 3 weakest blocks con rewrite suggestions.

Rewrite suggestions usan templates:
- "Add a definition pattern: '[Subject] is [definition].'"
- "Move the answer to the first sentence."
- "Add at least one named statistic with source and year."

### 8.4 Schema Engine

1. Parsear HTML → extraer todos los `<script type="application/ld+json">` blocks
2. Validar JSON sintácticamente
3. Validar contra Schema.org type hierarchy (Organization, Article, Product, FAQPage, WebSite, BreadcrumbList, LocalBusiness, SoftwareApplication)
4. Detectar propiedades requeridas faltantes
5. Detectar `sameAs` links faltantes o rotos
6. Generar JSON-LD corregido usando template per business type
7. Detectar esquemas deprecados (HowTo snippets, FAQ rich results restrictions, etc.)

### 8.5 Content E-E-A-T Engine

1. Detectar: author bylines, author pages, author schema
2. Medir: word count, heading depth, content freshness (dateModified)
3. Verificar: source citations (hrefs a fuentes externas con autoridad)
4. Evaluar: about page quality, team page, credentials

### 8.6 Platform Engine

1. Verificar headers: `X-Robots-Tag`, `Content-Type`, canonicals
2. Detectar SSR (si el HTML servido tiene contenido o es shell vacío)
3. Medir: meta tags, Open Graph, Twitter Cards
4. Verificar: llms.txt, sitemap.xml, robots.txt

---

## 9. Report Output

### 9.1 Web Report (Server Component)

Layout de 6 secciones:
1. **Header**: GEO Score grande + badge de severidad + URL + fecha
2. **Score Breakdown**: tabla de 6 dimensiones con scores y pesos
3. **Crawler Access Map**: tabla color-coded (verde = allowed, rojo = blocked)
4. **Citability Analysis**: top 3 + bottom 3 con excerpt y rewrite suggestion
5. **Schema Report**: tabla de schemas detectados, issues, JSON-LD generado (collapsible code blocks)
6. **Action Plan**: quick wins + 30-day plan, organizado por severidad y timeline

### 9.2 PDF Report (API Route)

Mismo contenido que el web report pero formateado para PDF:
- Puppeteer/Chrome headless: `GET /api/report/[id]/pdf` → render HTML → print to PDF
- Template HTML con CSS print styles
- Cover page con GEO Score badge
- Page breaks entre secciones
- Color-coded tables

### 9.3 Shareable Link

- URL pública: `geoaudit.app/report/[shareToken]`
- Sin auth requerida
- Opcional: el usuario puede desactivar el link desde su dashboard
- Meta tags para preview social (OG image con GEO Score)

---

## 10. Routes Map (Next.js App Router)

```
/                               → Landing page (static, ISR)
/pricing                        → Pricing page (static, ISR)
/blog                           → Blog (opcional, contenido GEO/SEO)
/audit/[shareToken]             → Reporte público compartible (SSR)
/dashboard                      → Dashboard protegido (SSR + auth)
/dashboard/audits               → Historial de audits (SSR + auth)
/dashboard/audits/[id]          → Detalle de audit (SSR + auth)
/dashboard/settings             → Account settings, manage subscription (SSR + auth)
/api/audit                      → POST: create new audit (API route o Server Action)
/api/audit/[id]                 → GET: poll audit status
/api/webhooks/stripe            → Stripe webhook receiver
/api/auth/[...nextauth]         → NextAuth handler
/api/report/[id]/pdf            → PDF generation
/api/og                         → OG image generation (@vercel/og)
```

---

## 11. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **P99 latency (MVP)** | < 8 segundos para single-page audit (síncrono) |
| **P99 latency (V1)** | < 30 segundos para 5-page audit (background job + polling) |
| **Mobile** | Responsive, no mobile-first (audience usa desktop para leer reportes) |
| **Accessibility** | WCAG 2.2 AA (como tu portfolio) |
| **i18n** | Inglés solamente (MVP). Español en V1. |
| **Error handling** | Friendly error states para: URL inválida, timeout, sitio bloqueado, sitio caído |
| **Rate limiting** | 1 audit/30s por IP en free tier. 10 audits/min para authenticated. |
| **Robots.txt compliance** | Respetar robots.txt del sitio auditado (30s timeout, no crawlear disallowed paths) |
| **Content types** | Solo HTML. Skipear PDFs, imágenes, binarios. |
| **Page limit per audit** | 1 (free) / 5 (pro) / 20 (enterprise) |
| **Timeout per page** | 30 segundos |
| **Uptime** | 99% (Vercel hobby + Supabase free tier es suficiente para MVP) |

---

## 12. Design System

### 12.1 Brand

- **Name**: GeoAudit
- **Tagline**: "Know if AI can see you."
- **Tone**: Data-driven but warm. Confident, not arrogant. Trustworthy, not boring.
- **Color palette**: Dark navy + emerald green + amber accent. 
  - Primary: `#0f172a` (slate-900, dark navy) 
  - Accent: `#10b981` (emerald-500, scores, CTAs)
  - Warning: `#f59e0b` (amber-500, medium issues)
  - Danger: `#ef4444` (red-500, critical issues)
  - Surface: `#1e293b` (slate-800, cards/panels)
- **Typography**: 
  - Headings: Instrument Serif (misma que tu portfolio, continuidad visual)
  - Body: Work Sans (misma que tu portfolio)
  - Code/Monospace: JetBrains Mono (para JSON-LD blocks)
- **Design tokens**: heredar de tu portfolio lo que aplique, extender con lo nuevo

### 12.2 Key Screens (MVP)

1. **Landing page**: Hero con input de URL + CTA "Scan your site". Sección "How it works" (3 steps). Pricing table. Social proof (si lo tenés).
2. **Loading state**: Skeleton audit con pulso animado en cada sección mientras fetchea.
3. **Report page**: Layout de 6 secciones (descripto en §9.1).
4. **Dashboard**: Cards de audits recientes. Score sparkline. Upgrade banner para free users.
5. **Pricing page**: 3 columnas (Free, Pro, Enterprise). CTA "Start free" / "Upgrade to Pro".
6. **Auth pages**: Sign up, Sign in, Forgot password (NextAuth built-in o custom).

---

## 13. Deployment Architecture

### MVP (Vercel + Supabase + Stripe)

```
Client (Browser)
  │
  ├── Next.js App Router (Vercel)
  │     ├── Server Components (RSC)
  │     ├── Server Actions (mutations)
  │     └── API Routes (webhooks, PDF, OG image)
  │
  ├── Supabase (PostgreSQL)
  │     └── Prisma ORM
  │
  ├── Stripe (payments)
  │     ├── Checkout Sessions
  │     ├── Customer Portal
  │     └── Webhooks → /api/webhooks/stripe
  │
  └── Vercel Cron (monthly audit resets)
```

### V1 (Docker + VPS — opcional)

``` 
Docker Compose
  ├── nextjs-app (production build)
  ├── postgres (o external Supabase)
  ├── redis (para BullMQ queues)
  └── nginx (reverse proxy + SSL)
```

---

## 14. Scope Boundaries

### IN scope (MVP)

- Auditoría de 1 página por URL (MVP, gratis)
- Auditoría de 5 páginas (Pro, con sitemap crawl básico)
- 6 dimensiones de scoring con pesos fijos
- 8+ AI crawlers en access map
- Schema detection + generación JSON-LD corregido
- Citability block analysis con top 3/bottom 3
- Quick wins + 30-day action plan
- PDF export (Pro+)
- Shareable link (Pro+)
- Auth con NextAuth (email + GitHub OAuth)
- Stripe Checkout + Customer Portal + webhooks
- Dashboard con historial de audits y score trend
- Reporte público para free tier
- Robots.txt respect

### OUT of scope (MVP — para V1/V2)

- Multi-page crawl más allá de 5 páginas (Enterprise)
- Background jobs asíncronos (MVP usa procesamiento síncrono server-side)
- Groq AI para rewrite suggestions (MVP usa templates estáticos)
- Competitor comparison (V1)
- White-label / custom branding (V1)
- Email delivery de reportes (V1, con Resend)
- Batch audit con CSV (V2)
- Scheduled re-audits (V2)
- Chrome Extension (V2)
- API REST pública (V2)
- i18n / multi-language (V1: español)
- Docker deployment (V1 — opcional)

---

## 15. Learning Goals Mapped to Features

| Skill a aprender | Dónde lo usás en GeoAudit |
|---|---|
| **Next.js App Router** | Toda la app es App Router. Server Components para reportes, Server Actions para crear audits. |
| **RSC / Server Components** | Report page (fetch + render en server), dashboard (protected data fetching). |
| **SSR auténtico** | El HTML del reporte se sirve renderizado desde el server, no con `<div id="root">`. |
| **Server Actions** | "New audit" form submission. Validación con Zod en el server. |
| **Streaming / Suspense** | Loading states para audit (secciones aparecen a medida que se completan). |
| **NextAuth.js v5** | Sign up, sign in, OAuth (GitHub, Google), protected routes con middleware. |
| **Stripe Checkout** | Crear sesiones de checkout, manejar precios, Customer Portal para manage subscription. |
| **Stripe Webhooks** | Recibir eventos de Stripe (`checkout.session.completed`, `customer.subscription.updated`, etc.), verificar firma, actualizar DB idempotentemente. |
| **Prisma + PostgreSQL** | Schema versionado, migraciones, queries en Server Components y API routes. |
| **Zod 4** | Validación de input en Server Actions y API routes. Tipos inferidos. |
| **Playwright E2E** | Tests end-to-end: free audit flow, signup flow, Stripe checkout (modo test), PDF download. |
| **Vercel Cron** | Reset mensual de `auditsUsed` para todos los usuarios. |
| **OG image generation** | `@vercel/og` para preview social de reportes compartibles. |
| **CSS Print styles** | PDF export desde HTML con media queries de print. |
| **Error boundaries** | Manejar fallos de fetch (site caído, timeout, bloqueado) con UI amigable. |
| **Rate limiting** | Proteger `/api/audit` de abuso (usando `@upstash/ratelimit` o middleware propio). |

---

## 16. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| **Free → Pro conversion** | 5% | Stripe Dashboard |
| **Net MRR en mes 3** | USD 90 (10 paying users) | Stripe Dashboard |
| **Audits completados (total)** | 1.000 en los primeros 3 meses | DB query |
| **P99 latency single-page** | < 8s | Vercel Analytics / Sentry |
| **Error rate** | < 2% de audits fallidos | DB `audit.status = FAILED` |
| **Lighthouse score** | ≥ 95 (Performance, Access, Best Practices) | Lighthouse CI en GitHub Actions |
| **Test coverage** | ≥ 80% (unit + integration), E2E para critical paths | Vitest + Playwright |

---

## 17. Milestones & Timeline

> **⚠️ ACTUALIZADO 2026-08-30**: El plan original (Sprints 0-7) se completó y superó. El roadmap VIVO está en `docs/SPRINT-ROADMAP.md` — este §17 queda como referencia histórica del plan original. Decisiones que cambiaron la realidad: producto renombrado a **Relevy** (`relevy.app`), Vercel Free sin monetización (Stripe eliminado en Sprint 10), monetización diferida hasta validar tracción, Cloudflare diferida. Próximos: Sprint 11 = Rebrand & Polish · Sprint 12 = Brand Authority · Sprint 13 = Launch.

### Sprint 0 — Setup & Scaffold (Week 1)
- [ ] `create-next-app` con App Router, TypeScript, Tailwind, ESLint, Prettier
- [ ] Configurar Prisma + Supabase PostgreSQL
- [ ] Configurar NextAuth.js con GitHub OAuth + email/password
- [ ] Configurar Stripe (test mode), crear productos/precios en Stripe Dashboard
- [ ] Configurar GitHub Actions (lint + typecheck + test)
- [ ] Configurar pre-commit hooks (husky + lint-staged)

### Sprint 1 — Core Audit Engine (Week 2–3)
- [ ] Crawler Access Map: parser de robots.txt + HTTP header checker
- [ ] Citability Engine: content segmenter + 5-dimension block scorer
- [ ] Schema Engine: JSON-LD parser + validator + generator
- [ ] Content E-E-A-T Engine: author detection, word count, heading analyzer
- [ ] Platform Engine: header checker + meta tag analyzer
- [ ] GEO Score Calculator: weighted composite + severity label

### Sprint 2 — Free Audit Flow (Week 3–4)
- [ ] Landing page con input de URL
- [ ] Server Action: crear audit, fetchear página, correr 5 engines
- [ ] Report page (Server Component): render completo del reporte
- [ ] Loading states (Suspense + skeleton)
- [ ] Error states (URL inválida, timeout, sitio caído)
- [ ] Rate limiting para `/api/audit`

### Sprint 3 — Auth & Dashboard (Week 4–5)
- [ ] Sign up / Sign in / Forgot password pages
- [ ] NextAuth middleware (proteger /dashboard/*)
- [ ] Dashboard page: historial de audits, score trend
- [ ] User → Audit relation en DB
- [ ] Tier limits enforcement (free = 1/mes, pro = 10/mes)

### Sprint 4 — Stripe Integration (Week 5–6)
- [ ] Stripe Checkout Session endpoint
- [ ] Stripe Customer Portal redirect
- [ ] Stripe Webhook receiver (verificar firma)
- [ ] Subscription CRUD en DB (crear, actualizar status, actualizar plan)
- [ ] Pricing page con planes
- [ ] Upgrade CTA en dashboard para free users

### Sprint 5 — Pro Features (Week 6–7)
- [ ] Multi-page audit (hasta 5, sitemap crawl básico)
- [ ] PDF export (Puppeteer + HTML template)
- [ ] Shareable link público (shareToken)
- [ ] Dashboard con historial (audits page + detail page)

### Sprint 6 — Polish & Testing (Week 7–8)
- [ ] Playwright E2E tests: free audit, signup, Stripe test checkout, PDF download
- [ ] Responsive design (mobile audit + desktop audit/reporte)
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] Performance optimization (Lighthouse 95+)
- [ ] Error boundary global
- [ ] SEO tags (title, description, OG para landing + pricing)

### Sprint 7 — Launch (Week 8)
- [ ] Stripe production mode
- [ ] Vercel production deploy
- [ ] DNS + custom domain (geoaudit.app o similar)
- [ ] Monitoring (Sentry)
- [ ] Uptime monitoring (Vercel Analytics)
- [ ] Social media launch posts

---

## 18. Questions to Decide Before Sprint 0

1. **¿Dominio?** `geoaudit.app`, `geoaudit.dev`, o subdominio de tu portfolio?
2. **¿Precio Pro?** USD 9/mes es placeholder. Investigá competencia: ¿Sitebulb, Screaming Frog, SEMrush, Ahrefs? Ajustá.
3. **¿Free tier generoso o restrictivo?** 1 audit/mes es restrictivo pero protege el servidor. Si querés growth loop, podrías hacer 3 gratis al signup y después 1/mes.
4. **¿Supabase o PlanetScale o Neon?** Supabase es lo que ya usás. Quedate ahí.
5. **¿Open source?** El core audit engine podría ser open source (como tu CLI geo-seo-opencode) y el SaaS ser la capa comercial. Te da autoridad y visibilidad.
6. **¿Contenido / blog?** Escribir sobre GEO/SEO te posiciona como autoridad. Si lo hacés, es contenido para el SaaS, no para tu portfolio personal.
7. **¿Nombre final?** GeoAudit es placeholder. Alternativas: AIVisible, CiteScore, AIScan, SearchableAI, FoundByAI.

---

## 19. Appendix: Key Files Reference (from your existing stack)

Estos assets de tu portfolio y skills podés reutilizar o adaptar:

| Source | What to reuse |
|---|---|
| `.atl/skill-registry.md` | Pattern para skill registry del SaaS |
| `src/index.css` | Tailwind tokens (colores, animaciones, fonts) |
| `src/routes/AppRoutes.tsx` | Pattern para rutas protegidas |
| `src/i18n.ts` | i18next config (para V1 con español) |
| `src/shared/seo/MetaTags.tsx` | Componente de meta tags adaptado |
| `skills/geo/*` | Lógica de auditoría GEO (el motor conceptual) |
| `skills/geo/scripts/fetch_page.py` | HTTP fetching con timeout (portear a TypeScript) |
| `skills/geo/schema/*.json` | Templates JSON-LD para cada business type |
| `skills/geo-report/` | Template de reporte cliente → base para PDF y web report |
| `skills/geo-citability/` | Algoritmo de scoring → portear a TypeScript |
| `skills/geo-schema/` | Schema detection + validación → portear a TypeScript |

---

**Status:** Ready for Sprint 0  
**Next step:** Decidir dominio, nombre final, y precios. Luego `create-next-app` y arrancar.
