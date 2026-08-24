# DESIGN BRIEF — GeoAudit (para Lovable / Gemini / generador visual)

> **Qué es esto**: brief de diseño para que una IA generativa (Lovable, Gemini, v0, etc.) produzca las pantallas UI de GeoAudit. NO incluye copy final (eso se define después) — este documento es 100% visual: páginas, paleta, tipografía, animación, layout. El output será implementado después en Next.js + Tailwind v4 con el design system real del proyecto.

---

## 0. EL PRODUCTO EN UNA LÍNEA

SaaS de **auditoría GEO/SEO**: el usuario pega una URL → recibe un **GEO Score 0-100** + reporte completo de AI visibility (cómo lo ven ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot).

**Público**: marketers técnicos y dueños de producto que quieren saber si la IA los cita. Gente que entiende de data, no diseñadores — la UI debe ser **trust-first, data-legible, sin ruido**.

**Read de diseño**: *B2B data-heavy SaaS para compradores técnicos, con lenguaje clean/editorial, apoyado en serif de display + sistema de tokens propio, motion funcional mínimo.*

---

## 1. DIRECCIÓN VISUAL (3 dials)

| Dial | Valor | Significado |
|---|---|---|
| **DESIGN_VARIANCE** | 5 | Offset controlado: layouts asimétricos sutiles, NO simetría perfecta genérica |
| **MOTION_INTENSITY** | 3 | Funcional solamente: skeleton pulse, hover 150ms, transiciones de estado |
| **VISUAL_DENSITY** | 6 | Producto de datos: denso pero con jerarquía clara, no cockpit caótico |

**Principio rector**: "Clear over clever." La decoración es un bug. Cada decisión visual debe hacer la data más legible.

**Anti-patrones BANDEADOS** (nunca):
- Dashboards genéricos (metric soup sin jerarquía ni mensaje único)
- Tablas ilegibles (zebra rows, border-b en cada fila)
- Scores sin contexto (un número sin su banda + etiqueta + explicación = UI rota)
- Purple gradients / glassmorphism / AI-default slop
- Librerías de componentes prefabricadas (DaisyUI, shadcn) — componentes propios
- Inter + slate-900 por defecto
- Placeholder-as-label
- Animación decorativa infinita

---

## 2. PALETA DE COLORES (tokens exactos)

### Brand colors
| Token | Hex | Uso |
|---|---|---|
| `navy` | `#0f172a` | Tinta primaria; botones primarios; headings |
| `emerald` | `#10b981` | Positivo/éxito; acentos del GEO Score |
| `amber` | `#f59e0b` | Warning / banda "Fair" |
| `red` | `#ef4444` | Crítico / errores |

### Semantic
| Token | Hex | Uso |
|---|---|---|
| `surface` | `#ffffff` | Fondo página / cards |
| `surface-muted` | `#f8fafc` | Hover, secciones sutiles |
| `text-primary` | `#0f172a` | Texto principal |
| `text-secondary` | `#475569` | Texto secundario |
| `border` | `#e2e8f0` | Hairlines, bordes de cards |
| `border-strong` | `#cbd5e1` | Bordes enfatizados |

**Reglas**:
- NUNCA `#000` ni `#fff` puros — usar `navy` / `surface`
- **Un acento por contexto**. Emerald es el ÚNICO acento positivo; no mezclar azul en un CTA o teal en un badge de la misma sección
- Severity chips: fondo tintado 50-level + texto 700-level (**WCAG AA ≥ 4.5:1**)
- **Light theme only** (dark mode es decisión futura; no mezclar secciones half-dark)

---

## 3. TIPOGRAFÍA

| Rol | Familia | Notas |
|---|---|---|
| Display / headings | **Instrument Serif** | Un solo peso (400) + italic; jerarquía vía tamaño/color, NO peso |
| Body / UI | **Work Sans** | Body, botones, inputs, labels (400/500/600) |
| Code / JSON-LD | **JetBrains Mono** | Bloques de código, JSON-LD preview, metadata técnica |

- Headings: tight leading, `tracking-tight` en display sizes
- Body max ~65ch
- Números de score: tratamiento destacado (puede ser mono para data técnica)

---

## 4. ESPACIO Y FORMA

- **Grid base 4px** (4/8/12/16/24/32/48)
- Cards `p-6` · gaps de sección 24-32px · forms `gap-2`
- **Radii (una sola escala, aplicada en todos lados)**: cards `rounded-xl`, botones/inputs `rounded-md`, severity chips `rounded-full`
- Layouts contenidos (`max-w-*`) · NUNCA `h-screen` → `min-h-dvh`

---

## 5. ANIMACIÓN (funcional, mínima)

- **Skeleton pulse**: LA animación requerida (el audit corre 10-60s) — con `prefers-reduced-motion` respetado
- Micro-interacciones al mínimo: 150ms color/opacity en hover, `scale-[0.98]` en `:active`
- **Todo proceso async con 4 estados**: Loading (skeleton) / Success / Error (inline `role="alert"`) / Empty (explica cómo proceder)
- Sin loops infinitos, sin scroll-jacked motion, sin entrance choreography

---

## 6. LAS 9 PÁGINAS (todas las pantallas del producto)

> Para cada una: estructura, bloques, estados. Sin copy final.

### 1. Landing (pública) — `/`
Página de marketing. Estructura:
- **Hero**: título display serif grande + subtexto corto + CTA primario "Auditar una URL" + input de URL prominente (el producto ES el demo)
- **Sección "Cómo funciona"**: 3 pasos (URL → Audit → Reporte) — NO 3 cards iguales, variar composición
- **Sección GEO Score**: mostrar un scorecard de ejemplo con el score 0-100 + bandas
- **Sección AI visibility**: qué plataformas mide (ChatGPT, Claude, Perplexity, Gemini, AI Overviews, Copilot)
- **CTA final**: pricing teaser → link a /pricing
- States: loading (skeleton del scorecard), error (URL inválida inline), empty

### 2. Login — `/login`
Pantalla centrada minimalista:
- Logo/título + botón "Continuar con GitHub" (primario, prominente)
- Link a /signup
- Error state: mensaje inline si el login falla
- Loading state en el botón

### 3. Signup — `/signup`
Misma familia visual que login:
- Título + botón GitHub + breve valor (qué obtenés)
- Link a /login

### 4. Pricing — `/pricing`
3 planes — **NO 3 cards idénticas**: la jerarquía debe destacar el plan Pro (recomendado):
- **Free** $0 — 3 audits/30 días
- **Pro** $9/mes — 10 audits/mes (**highlighted**: borde emerald, badge "Recomendado", escala levemente mayor)
- **Enterprise** $49/mes — 50 audits/mes
- Cada card: precio grande, lista de features con checkmarks, CTA
- CTA dinámico según sesión: "Empezar" (crea Checkout) o "Gestionar suscripción" (si ya es PRO)
- States: loading en el botón al crear sesión, error inline

### 5. Dashboard (historial) — `/dashboard` (autenticado)
Data view principal:
- **Header**: saludo + CTA de billing (Upgrade si FREE / Gestionar suscripción si PRO)
- **Score trend**: barras CSS puras (últimos audits) — visualización de tendencia, no un chart pesado
- **Historial de audits**: tabla/lista de audits (URL, score con banda, fecha, re-audit) — **con jerarquía**: score grande con chip de banda, sparsed dividers, no zebra
- **Empty state**: si no hay audits — ilustración tipográfica + "auditá tu primera URL" + CTA
- States: loading (skeleton de tabla), error, empty

### 6. Detail page de audit — `/dashboard/audits/[id]` (autenticado)
El reporte individual persistido:
- **Score hero**: GEO Score gigante (número display + banda chip + label)
- **Domain scorecard**: categorías (Crawlers, Citability, Schema, E-E-A-T, Platform) con barras
- **Top findings**: lista de hallazgos priorizada con severidad
- **Report meta**: URL auditada, fecha, duración
- **Panel share**: botón "Crear link" / "Revocar" (PRO) — con URL copiable
- **CTA PDF** (PRO): botón "Exportar PDF"
- States: loading skeleton, error (audit no encontrado → 404 con diseño), empty

### 7. Share público — `/share/[token]` (pública)
El reporte SIN chrome de app (sin nav, sin CTA de billing):
- Mismo Score hero + scorecard + findings
- Header mínimo: "Reporte compartido de GeoAudit" + link al producto
- Sin datos privados visibles

### 8. Report en vivo — `/report?url=` (pública, post-audit)
El reporte recién generado:
- **Skeleton pulse** mientras el audit corre (10-60s) — el momento más importante del producto
- Score hero + domain scorecard + findings + meta
- CTA para autenticarse y guardar el reporte (si anónimo)

### 9. Multi-page report — detail de audit multi-page
Variante del score hero + **filas por página** (hasta 5 URLs con su score individual):
- Aggregate score hero + lista de páginas con score/banda/duración
- Misma familia visual que el single-page

---

## 7. COMPONENTES BASE (primitivas del sistema)

| Componente | Spec |
|---|---|
| **Button** | `primary` (navy bg) / `secondary` (border) / `ghost` · `sm`/`md` · loading state (`aria-busy` + spinner + disabled) |
| **Card** | surface bg, border hairline, rounded-xl, p-6, header/footer slots opcionales |
| **TextField** | `<label>` real SIEMPRE + input + error slot reservado (`role="alert"`) |
| **SeverityBadge** | 5 bandas: Excellent/Good/Fair/Poor/Critical → chip tintado + label ES (Excelente/Bueno/Regular/Deficiente/Crítico) |
| **Skeleton** | pulse placeholder, `role="status"`, `aria-label="Cargando…"`, respeta reduced-motion |
| **ScoreHero** | el número 0-100 como protagonista + banda + contexto |
| **ScoreBar** | barra horizontal por categoría (emerald/good → red/critical) |

---

## 8. INSTRUCCIONES PARA LA IA GENERATIVA

1. **Generá pantallas, no código** — mockups/UI frames de alta fidelidad para las 9 páginas (una imagen por sección si es posible, no boards comprimidos)
2. Usá EXACTAMENTE la paleta de la sección 2 (tokens → hex)
3. Usá Instrument Serif para headings y Work Sans para body (si la herramienta no tiene las fuentes, usá la serif más cercana disponible)
4. **Sin textura decorativa**: sin gradients, sin glassmorphism, sin sombras dramáticas
5. **Data legible primero**: el score siempre con su banda + label, jerarquía clara
6. **Mostrar los 4 estados** (loading/error/empty) en las pantallas donde aplique
7. **Destacar el plan Pro** en pricing (NO 3 cards idénticas)
8. **Dashboard con jerarquía**: score trend + tabla sparsed, no metric soup
9. Mobile: mostrar al menos landing, dashboard y report en viewport móvil (las páginas colapsan a single-column)