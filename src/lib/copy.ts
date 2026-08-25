import type { FetchErrorCode } from "@/lib/contracts/fetch-types";

/**
 * Centralized user-facing copy (design U2, ATH-9, LGL-4).
 *
 * Single source of truth for every UI string, in NEUTRAL Spanish (voseo
 * migrated: "Esperá"→"Espere", "Alcanzaste"→"Alcanzó", "Verificá"→"Verifique",
 * "Probá"→"Pruebe", "Necesitás"→"Necesita", "Mejorá"→"Mejore",
 * "Iniciá sesión"→"Inicie sesión", "Creá tu cuenta"→"Cree su cuenta").
 *
 * Legacy modules (`url-policy`, `fetch-error-copy`, `share-modal`,
 * `github-auth-card`) re-export from here so strings are never duplicated;
 * the migrated objects are grouped under the typed `COPY` export.
 */

/** Fetch failure codes the fetch layer can emit (shared with report domain). */
type FetchFailureCode = FetchErrorCode | "unsupported_content_type";

/** Free audit form errors (ADF-7) — neutral Spanish (ATH-9). */
export const AUDIT_FORM_ERRORS = {
  invalidUrl: "Formato de URL inválido",
  protocol: "Solo URLs http/https",
  rateLimited: "Demasiadas solicitudes. Espere un momento.",
  limitReached:
    "Alcanzó el límite de 3 auditorías gratuitas. El contador se reinicia 30 días después de cada auditoría.",
} as const;

/** FetchErrorCode → user-facing Spanish copy (ARU-6) — neutral (LGL-4). */
export const FETCH_ERROR_COPY: Record<FetchFailureCode, string> = {
  SSRF_BLOCKED: "El sitio bloqueó el acceso automatizado al contenido.",
  TIMEOUT:
    "El sitio tardó demasiado en responder. Verifique que la URL sea correcta.",
  NETWORK_ERROR:
    "No se pudo establecer la conexión con el sitio. Pruebe nuevamente en unos minutos.",
  DNS_FAILURE: "El dominio no existe o no se puede resolver.",
  HTTP_STATUS:
    "El sitio respondió con un error. Pruebe visitarlo directamente.",
  TOO_LARGE: "El sitio es demasiado pesado para analizarlo.",
  TOO_MANY_REDIRECTS: "El sitio tiene demasiadas redirecciones.",
  unsupported_content_type: "El sitio no devuelve contenido HTML analizable.",
};

/** Fallback copy for errors that carry no known fetch failure code. */
export const GENERIC_AUDIT_ERROR_COPY =
  "No pudimos analizar el sitio. Pruebe nuevamente.";

/** ShareModal error codes → neutral Spanish copy (SHR-3, design ShareModal). */
export const SHARE_MODAL_ERROR_COPY: Record<string, string> = {
  auth: "Necesita iniciar sesión para compartir.",
  "not-found": "No encontramos la auditoría.",
  upgrade: "Compartir es una función PRO. Mejore su plan para activarla.",
  failed: "No pudimos generar el link. Pruebe de nuevo en unos minutos.",
};

type AuthMode = "login" | "signup";

type AuthCopy = {
  heading: string;
  description: string;
  /** Primary action label — MUST read "Continuar con GitHub" (ATH-8). */
  buttonLabel: string;
  /** Question before the switch link (Gemini card footer). */
  switchPrompt: string;
  switchLink: { href: string; label: string };
  /** Terms/privacy note under the primary action (Gemini card). */
  termsNote: string;
  /** Signup-only benefits list (ATH-7). */
  benefits?: { label: string; items: string[] };
};

/** GitHub auth card copy (ATH-8, ATH-9) — neutral Spanish, Gemini wording. */
export const AUTH_COPY: Record<AuthMode, AuthCopy> = {
  login: {
    heading: "Inicie sesión",
    description:
      "Acceda a su historial de auditorías y siga su progreso de visibilidad en IA.",
    buttonLabel: "Continuar con GitHub",
    switchPrompt: "¿No tiene cuenta?",
    switchLink: { href: "/signup", label: "Cree una" },
    termsNote:
      "Al continuar, acepta nuestros términos de servicio y políticas de privacidad de datos técnicos.",
  },
  signup: {
    heading: "Cree su cuenta",
    description:
      "Audite sus URLs, guarde sus reportes y siga su evolución en los buscadores con IA.",
    buttonLabel: "Continuar con GitHub",
    switchPrompt: "¿Ya tiene una cuenta registrada?",
    switchLink: { href: "/login", label: "Inicie sesión" },
    termsNote:
      "Al continuar, acepta nuestros términos de servicio y políticas de privacidad de datos técnicos.",
    benefits: {
      label: "Beneficios incluidos en su cuenta:",
      items: [
        "3 auditorías GEO mensuales sin costo con desglose por modelo",
        "Historial persistente para comparar mejoras de GEO Score",
        "Diagnóstico preventivo de bloqueos en robots.txt y cabeceras",
        "Generación de enlaces públicos compartibles con token seguro",
      ],
    },
  },
};

/**
 * Pricing page copy (PRC-5/7, design U3) — Gemini wording, neutral Spanish.
 *
 * `header` is the Gemini verbatim intro ("Planes Transparentes" eyebrow +
 * serif H1 + subtitle with "Sin sorpresas"); `faq` answers the billing
 * questions (cycle, cancellation, plan changes) plus real product questions
 * (GEO Score, platforms, multi-page, PDF).
 */
export const PRICING_COPY = {
  header: {
    eyebrow: "Planes Transparentes",
    title: "Optimiza la citabilidad de tu producto en la era de la IA",
    subtitle:
      "Auditorías técnicas diseñadas para equipos de producto, fundadores y agencias SEO. Sin sorpresas.",
  },
  faq: {
    title: "Preguntas Frecuentes",
    items: [
      {
        q: "¿Cómo funciona la facturación?",
        a: "Los planes Pro y Enterprise se facturan mensualmente y se renuevan de forma automática hasta que los cancele. Sin cargos ocultos.",
      },
      {
        q: "¿Puedo cancelar en cualquier momento?",
        a: "Sí. Puede cancelar cuando quiera desde su cuenta y el acceso se mantiene hasta el final del período pagado, sin penalizaciones ni cláusulas de permanencia.",
      },
      {
        q: "¿Puedo cambiar de plan?",
        a: "Sí. Puede cambiar de plan en cualquier momento; los cambios se aplican con prorrateo automático sobre el período en curso.",
      },
      {
        q: "¿Qué es el GEO Score?",
        a: "El GEO Score es una métrica de 0 a 100 que resume qué tan visible y citable es su sitio en los motores de búsqueda con IA.",
      },
      {
        q: "¿Qué plataformas analiza?",
        a: "Analizamos ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews y Bing Copilot.",
      },
      {
        q: "¿Puedo auditar varias páginas?",
        a: "Sí. Los planes Pro y Enterprise incluyen auditorías multi-página para monitorear varias URLs en cada ciclo.",
      },
      {
        q: "¿Cómo funciona el PDF?",
        a: "Cada auditoría puede exportarse a un reporte PDF listo para compartir con clientes o equipos.",
      },
    ],
  },
} as const;

/** Landing page copy (LND-1..5) — Gemini wording, neutral Spanish. */
export const LANDING_COPY = {
  hero: {
    badge: "GEO Engine",
    badgeDivider: "|",
    badgeSuffix: "Auditoría de visibilidad en motores de IA",
    title:
      "¿Cómo te citan los motores de IA cuando los usuarios buscan tu categoría?",
    subtitleLead: "Pega tu URL y obtén en segundos un ",
    subtitleHighlight: "GEO Score 0-100",
    subtitleTail:
      " con diagnóstico detallado de presencia en ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews y Bing Copilot.",
    sampleLabel: "O prueba un ejemplo real:",
  },
  auditForm: {
    inputLabel: "URL del sitio",
    placeholder: "https://tudominio.com",
    submitLabel: "Auditar URL",
    formAriaLabel: "Auditoría GEO",
  },
  sections: {
    howItWorksEyebrow: "Metodología de análisis",
    howItWorksTitle: "Cómo analiza GeoAudit tu visibilidad sintética",
    scorecardEyebrow: "Scorecard Unificado",
    scorecardTitle: "El GEO Score: un estándar de 0 a 100",
    scorecardLead:
      "Cada puntuación se traduce en una banda de severidad con impacto directo en la visibilidad.",
    platformsEyebrow: "Ecosistema de Búsqueda de IA",
    platformsTitle: "6 plataformas de búsqueda generativa auditadas",
    platformsLead:
      "Analizamos la interacción de cada crawler y motor de respuesta con el contenido web.",
    pricingEyebrow: "Planes y Acceso",
    pricingTitle: "Comienza a monitorear la visibilidad de tu marca en la IA",
    pricingSubtitle:
      "Desde 3 auditorías gratuitas hasta planes profesionales con monitoreo continuo, multi-page y reportes compartibles.",
    pricingCta: "Ver Planes y Precios",
    pricingSecondaryCta: "Crear cuenta gratis",
  },
} as const;

/**
 * Dashboard copy (DSH-8..DSH-11, design U4) — Gemini runner bar + history
 * wording, neutral Spanish.
 */
export const DASHBOARD_COPY = {
  runner: {
    placeholder: "https://tudominio.com",
    submitLabel: "Run Audit",
    inputLabel: "URL del sitio",
    formAriaLabel: "Auditoría GEO",
  },
  history: {
    header: "Historial Reciente de Análisis",
    showingCount: "Mostrando",
    records: "registros",
    columns: {
      resource: "Resource URL / Dominio",
      score: "Score",
      severity: "Severidad",
      timestamp: "Timestamp",
    },
    reAudit: "Re-auditar",
    scanning: "SCANNING...",
    inProgress: "En Proceso",
    emptySearch: "No se encontraron auditorías que coincidan con",
  },
  trend: {
    title: "Tendencia de Visibilidad",
    subtitle: "Últimos 12 ciclos de auditoría e inspección",
    aiOverviews: "AI OVERVIEWS",
    aggregateLabel: "Aggregate GEO Score",
  },
  empty: {
    title: "No hay auditorías registradas",
    body: "Ingresa la URL de tu producto o sitio web para generar tu primer GEO Score y diagnóstico de visibilidad en IA.",
    cta: "Auditar mi primera URL",
  },
} as const;

/** Typed grouping of every copy domain (design U2). */
export const COPY = {
  auditFormErrors: AUDIT_FORM_ERRORS,
  fetchError: FETCH_ERROR_COPY,
  genericAuditError: GENERIC_AUDIT_ERROR_COPY,
  shareModalErrors: SHARE_MODAL_ERROR_COPY,
  auth: AUTH_COPY,
  landing: LANDING_COPY,
  pricing: PRICING_COPY,
  dashboard: DASHBOARD_COPY,
} as const;
