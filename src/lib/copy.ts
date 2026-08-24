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
  buttonLabel: string;
  switchLink: { href: string; label: string };
};

/** GitHub auth card copy (ATH-9) — neutral Spanish. */
export const AUTH_COPY: Record<AuthMode, AuthCopy> = {
  login: {
    heading: "Inicie sesión",
    description:
      "Acceda a su historial de auditorías y siga su progreso de visibilidad en IA.",
    buttonLabel: "Iniciar sesión con GitHub",
    switchLink: { href: "/signup", label: "¿No tiene cuenta? Créela" },
  },
  signup: {
    heading: "Cree su cuenta",
    description:
      "Audite sus URLs, guarde sus reportes y siga su evolución en los buscadores con IA.",
    buttonLabel: "Crear cuenta con GitHub",
    switchLink: { href: "/login", label: "¿Ya tiene cuenta? Inicie sesión" },
  },
};

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

/** Typed grouping of every copy domain (design U2). */
export const COPY = {
  auditFormErrors: AUDIT_FORM_ERRORS,
  fetchError: FETCH_ERROR_COPY,
  genericAuditError: GENERIC_AUDIT_ERROR_COPY,
  shareModalErrors: SHARE_MODAL_ERROR_COPY,
  auth: AUTH_COPY,
  landing: LANDING_COPY,
} as const;
