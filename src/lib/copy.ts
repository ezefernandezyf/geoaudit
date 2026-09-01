import type { FetchErrorCode } from "@/lib/contracts/fetch-types";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";

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

/** Free audit form errors (ADF-7) - neutral Spanish (ATH-9). */
export const AUDIT_FORM_ERRORS = {
  invalidUrl: "Formato de URL inválido",
  protocol: "Solo URLs http/https",
  rateLimited: "Demasiadas solicitudes. Espere un momento.",
  // TLM-5 (sprint 10): the single FREE limit is 10 audits per 30-day window.
  limitReached:
    "Alcanzó el límite de 10 auditorías gratuitas. El contador se reinicia 30 días después de cada auditoría.",
} as const;

/** Anonymous audit limit state (TLM-11, RTL-8) - neutral Spanish (LGL-4). */
export const ANONYMOUS_AUDIT_LIMIT_COPY = {
  title: "Alcanzó el límite de auditorías anónimas",
  body: "Sin una cuenta puede realizar 3 auditorías cada 30 días por IP. Inicie sesión para acceder a 10 auditorías gratuitas por ventana de 30 días, con historial y exportación a PDF.",
} as const;

/** FetchErrorCode → user-facing Spanish copy (ARU-6) - neutral (LGL-4). */
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
  failed: "No pudimos generar el link. Pruebe de nuevo en unos minutos.",
};

type AuthMode = "login" | "signup";

type AuthCopy = {
  heading: string;
  description: string;
  /** Primary action label - MUST read "Continuar con GitHub" (ATH-8). */
  buttonLabel: string;
  /** Question before the switch link (Gemini card footer). */
  switchPrompt: string;
  switchLink: { href: string; label: string };
  /** Terms/privacy note under the primary action (Gemini card). */
  termsNote: string;
  /** Signup-only benefits list (ATH-7). */
  benefits?: { label: string; items: string[] };
  /** Signup-only developer/marketer eyebrow (B10, neutral - no tuteo). */
  developerEyebrow?: string;
};

/** GitHub auth card copy (ATH-8, ATH-9) - neutral Spanish, Gemini wording. */
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
        // TLM-5 (sprint 10): the single FREE limit is 10 audits per 30-day window.
        "10 auditorías GEO mensuales sin costo con desglose por modelo",
        "Historial persistente para comparar mejoras de GEO Score",
        "Diagnóstico preventivo de bloqueos en robots.txt y cabeceras",
        "Generación de enlaces públicos compartibles con token seguro",
      ],
    },
    developerEyebrow: "Cree su cuenta de desarrollador / marketer",
  },
};

/**
 * Shell copy (SHL-6, B10) - global navbar/footer strings in NEUTRAL Spanish
 * (usted), centralized here so the shell never hardcodes tuteo/voseo.
 */
export const SHELL_COPY = {
  /** Anonymous navbar actions (SHL-6). */
  nav: {
    login: "Inicie sesión",
    signup: "Cree su cuenta",
  },
} as const;

/**
 * Landing page copy (LND-1..5, LND-11) - Gemini wording, neutral Spanish.
 */
export const LANDING_COPY = {
  hero: {
    badge: "GEO Engine",
    badgeDivider: "|",
    badgeSuffix: "Auditoría de visibilidad en motores de IA",
    title: "¿Cómo lo citan los motores de IA?",
    // LND-11 (sprint 9): answer-first subtitle with a concrete stat - the
    // first sentence states the claim so the passage is self-contained. The
    // stats are REAL product facts (6 engines, 5 dimensions, weights sum 100).
    subtitleLead: `${BRAND_NAME} es una plataforma de auditoría GEO que analiza su sitio en 6 motores de búsqueda con IA.`,
    subtitleHighlight:
      " El GEO Score pondera 5 dimensiones que suman el 100 % del resultado.",
    subtitleTail: " Entrega un puntaje de 0 a 100 en menos de 30 segundos.",
    sampleLabel: "O pruebe un ejemplo real:",
  },
  auditForm: {
    inputLabel: "URL del sitio",
    placeholder: "https://tudominio.com",
    submitLabel: "Auditar URL",
    formAriaLabel: "Auditoría GEO",
  },
  // LND-11 (sprint 9): feature cards are answer-first passages (claim in the
  // first sentence) with concrete stats and 50-200 self-contained words - the
  // extraction band the citability engine rewards. Every figure is a REAL
  // product fact: engine registry (17 agents), scoring weights, rubric counts.
  features: [
    {
      number: "01",
      title: "Acceso de bots",
      body: `${BRAND_NAME} verifica si robots.txt, encabezados HTTP y metaetiquetas permiten el acceso de los crawlers de IA. El engine detecta bloqueos en 17 agentes, incluidos GPTBot, ClaudeBot y PerplexityBot, y mide su impacto real en la visibilidad del sitio. El acceso de bots pondera el 20 % del GEO Score y es la puerta de entrada a los motores de búsqueda con IA.`,
    },
    {
      number: "02",
      title: "Citabilidad",
      body: `La citabilidad mide qué tan probable es que los motores de IA citen textualmente los pasajes de su página como fuente canónica. ${BRAND_NAME} analiza pasajes answer-first de 50 a 200 palabras con definiciones y cifras concretas, las unidades que los modelos extraen con mayor frecuencia. La citabilidad pondera el 28 % del GEO Score, la dimensión con mayor peso del engine.`,
    },
    {
      number: "03",
      title: "E-E-A-T",
      body: `${BRAND_NAME} evalúa experiencia, experticia, autoridad y confiabilidad del contenido para la ponderación de fuentes. Señales verificables como autoría, fechas de publicación, enlaces de contacto y citas a dominios de autoridad suman hasta 24 puntos por dimensión. E-E-A-T pondera el 24 % del GEO Score y favorece al contenido con señales de confianza explícitas.`,
    },
    {
      number: "04",
      title: "Datos estructurados",
      body: `${BRAND_NAME} detecta y valida el JSON-LD y Schema.org que los LLMs usan para corroborar entidades y hechos. El engine puntúa 12 criterios, desde Organization y WebSite hasta SearchAction, y premia el marcado renderizado en el servidor. Los datos estructurados ponderan el 14 % del GEO Score y aportan precisión a las citas de entidades.`,
    },
    {
      number: "05",
      title: "Plataforma",
      body: `${BRAND_NAME} evalúa readiness, SSR, OpenGraph y headers para cada motor de búsqueda generativa. La dimensión pondera el 14 % del GEO Score y verifica que el sitio sea legible sin JavaScript. Un sitio con SSR y metadatos completos queda preparado para las 6 plataformas auditadas por el engine, sin depender de la ejecución de scripts en el navegador.`,
    },
  ],
  sections: {
    howItWorksEyebrow: "Metodología de análisis",
    howItWorksTitle: `Cómo analiza ${BRAND_NAME} tu visibilidad sintética`,
    scorecardEyebrow: "Scorecard Unificado",
    scorecardTitle: "El GEO Score: un estándar de 0 a 100",
    scorecardLead:
      "Cada puntuación se traduce en una banda de severidad con impacto directo en la visibilidad.",
    // LND-7 (sprint 8): the ScoreHero shows a REAL verified audit - the
    // category breakdown renders only from the evidence (score-hero-evidence.ts).
    scorecardCategoryTitle: "Desglose por categoría",
    scorecardBandsTitle: "Escala de Bandas y Criterios Técnicos",
    platformsEyebrow: "Ecosistema de Búsqueda de IA",
    platformsTitle: "6 plataformas de búsqueda generativa auditadas",
    platformsLead: `${BRAND_NAME} analiza la interacción de cada crawler y motor de respuesta con el contenido web en las 6 plataformas que concentran la búsqueda asistida por IA en 2026.`,
    // LND-6 (sprint 10): final CTA - the /pricing teaser is gone (route
    // deleted). Anonymous → signup/audit ("Auditar gratis"); authenticated →
    // dashboard ("Ir al dashboard").
    ctaEyebrow: "Comience gratis",
    ctaTitle: "Audite su sitio hoy y vea cómo lo citan los motores de IA",
    ctaSubtitle:
      "Cree su cuenta y acceda a 10 auditorías GEO gratuitas por ventana de 30 días, con historial, auditoría multi-página y exportación a PDF.",
    ctaPrimary: "Auditar gratis",
    ctaLoggedIn: "Ir al dashboard",
  },
} as const;

/**
 * Dashboard copy (DSH-8..DSH-11, design U4) - Gemini runner bar + history
 * wording, neutral Spanish.
 */
export const DASHBOARD_COPY = {
  pageTitle: "Panel de auditorías",
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
    body: "Ingrese la URL de su producto o sitio web para generar su primer GEO Score y diagnóstico de visibilidad en IA.",
    cta: "Auditar mi primera URL",
  },
} as const;

/**
 * Profile page copy (PRF-1..6, design U4) - account surface on
 * /dashboard/profile, neutral Spanish, Gemini shell wording.
 */
export const PROFILE_COPY = {
  eyebrow: "Cuenta",
  title: "Perfil de usuario",
  subtitle:
    "Administre su cuenta, plan y datos de uso de auditoría en un solo lugar.",
  identity: {
    tierLabel: "Plan actual",
    usageTitle: "Auditorías usadas",
    usageCaption: "del límite de su plan",
  },
  // WU-5 (sprint 10): `manage` (billing portal: portalCta/portalBlurb) and the
  // upgrade texts (upgradeCta/upgradeBlurb) are gone - everything is FREE.
  support: {
    title: "Soporte",
    blurb:
      "¿Problemas con su cuenta o con sus auditorías? Escríbanos y lo ayudamos a la brevedad.",
    emailLabel: "Correo de soporte",
    email: SUPPORT_EMAIL,
  },
} as const;

/**
 * Legal page copy (LGL-1..4, design U4) - /terms + /privacy static content,
 * neutral Spanish (no voseo, LGL-4). Keyed by page; each entry carries the
 * Gemini header block and the body sections rendered as heading + paragraph.
 */
export const LEGAL_COPY = {
  terms: {
    eyebrow: "Legal",
    title: "Términos de Servicio",
    updated: "Última actualización: agosto de 2026",
    intro: `Al utilizar ${BRAND_NAME} acepta estos términos. Le recomendamos leerlos detenidamente antes de usar el servicio.`,
    sections: [
      {
        heading: "1. Uso del servicio",
        body: `${BRAND_NAME} ofrece auditorías de visibilidad en motores de búsqueda con IA. El usuario se compromete a utilizarlo de forma lícita y a no abusar del servicio ni intentar vulnerar su seguridad.`,
      },
      {
        heading: "2. Cuenta y responsabilidad",
        body: "El usuario es responsable de mantener la confidencialidad de su cuenta y de todas las actividades que ocurran bajo ella. Debe notificar de inmediato cualquier uso no autorizado.",
      },
      {
        heading: "3. Plan único gratuito",
        body: `${BRAND_NAME} es un servicio gratuito: cada cuenta puede realizar hasta 10 auditorías por ventana de 30 días. El límite se reinicia 30 días después de cada auditoría.`,
      },
      {
        heading: "4. Propiedad intelectual",
        body: `El servicio y su contenido son propiedad de ${BRAND_NAME}. El usuario conserva los derechos sobre el contenido de sus propios sitios y sobre los reportes generados para sus dominios.`,
      },
      {
        heading: "5. Limitación de responsabilidad",
        body: `El servicio se ofrece 'tal cual'. ${BRAND_NAME} no garantiza resultados específicos de posicionamiento ni se hace responsable por decisiones tomadas en base a los reportes.`,
      },
      {
        heading: "6. Modificaciones",
        body: "Podemos actualizar estos términos periódicamente. Los cambios se publicarán en esta página y entrarán en vigencia al momento de su publicación.",
      },
    ],
  },
  privacy: {
    eyebrow: "Legal",
    title: "Política de Privacidad",
    updated: "Última actualización: agosto de 2026",
    intro: `Esta política describe cómo ${BRAND_NAME} recopila, utiliza y protege su información personal al usar el servicio.`,
    sections: [
      {
        heading: "1. Datos que recopilamos",
        body: "Recopilamos los datos de cuenta (nombre, correo) y la información técnica de las URLs que audita, incluidos los reportes generados a partir de su análisis.",
      },
      {
        heading: "2. Uso de los datos",
        body: "Utilizamos sus datos para proveer el servicio, mejorar nuestros análisis y enviarle comunicaciones relacionadas con su cuenta.",
      },
      {
        heading: "3. Compartición de datos",
        body: "Los enlaces públicos de compartición que usted genera exponen el reporte correspondiente a quien reciba el enlace. No vendemos sus datos personales a terceros.",
      },
      {
        heading: "4. Seguridad",
        body: "Implementamos medidas técnicas y organizativas razonables para proteger su información frente a accesos no autorizados, pérdida o alteración.",
      },
      {
        heading: "5. Sus derechos",
        body: "Puede solicitar acceso, corrección o eliminación de sus datos personales en cualquier momento escribiéndonos al correo de soporte.",
      },
      {
        heading: "6. Contacto",
        body: `Ante cualquier consulta sobre esta política, escríbanos a ${SUPPORT_EMAIL} y responderemos a la brevedad.`,
      },
    ],
  },
} as const;

/**
 * Report copy (U5, ARU-10/11/12, design U5) - Gemini verbatim section
 * wording, neutral Spanish. Consumed by the pure report presenters
 * (ScoreHero, DomainScorecard, PlatformMatrix, TopFindings) and the live
 * report skeleton.
 */
export const REPORT_COPY = {
  emptyState: {
    title: "Auditoría GEO",
    body: "Ingrese una URL para comenzar el análisis",
  },
  hero: {
    scoreLabel: "GEO Score",
    auditLabel: "Auditoría en",
    benchmarkTitle: "Baremos de Referencia",
  },
  scorecard: {
    title: "Scorecard por Categoría",
    subtitle: "Evaluación detallada en las 5 dimensiones del algoritmo GEO",
    chip: "5 categorías analizadas",
  },
  matrix: {
    title: "Matriz de Visibilidad por Plataforma de IA",
    subtitle:
      "Directivas de rastreo e índice de citabilidad detectado en los 6 principales motores generativos",
    notMeasured: "No medido",
    access: {
      allowed: "Permitido",
      blocked: "Bloqueado",
      unknown: "Desconocido",
    },
  },
  findings: {
    title: "Hallazgos Técnicos Priorizados",
    subtitle:
      "Acciones de remediación con snippets de código listos para producción",
    points: "puntos de acción",
    emptyTitle: "Configuración técnica sin observaciones críticas",
    emptyBody:
      "Su dominio cumple los estándares óptimos de citabilidad generativa.",
    recommendation: "Recomendación GEO:",
    copyCode: "Copiar",
    copiedCode: "Copiado",
  },
  live: {
    inProgress: "Auditoría en Progreso",
    analyzing: "Analizando",
    subtitle:
      "El motor GEO está ejecutando inspecciones en tiempo real. Duración estimada: 15-30s.",
    preparing: "Preparando Scorecard...",
    wait: "Puede tardar hasta 60 segundos.",
    statuses: {
      done: "Completado",
      current: "Analizando…",
      pending: "En cola",
    },
  },
} as const;

/**
 * Public share page copy (U5.10, SHR-7..9, design U5) - Gemini SharePage
 * verbatim, neutral Spanish (usted).
 */
export const SHARE_COPY = {
  header: {
    sub: "Reporte de Visibilidad de IA",
    verified: "Verificado",
    cta: "Auditar mi URL gratis",
  },
  banner: {
    prefix: "Reporte público generado para",
    idLabel: "ID:",
  },
  footer: {
    title: "¿Quiere saber cómo citan los motores de IA su sitio?",
    body: "Genere un informe idéntico para su dominio en menos de 30 segundos, sin costo.",
    cta: "Comenzar auditoría gratuita",
  },
} as const;

/**
 * Multi-page audit copy (U6, MPU-1/3, design U6) - Gemini trigger page
 * wording, neutral Spanish (usted). `MultiPageErrorCode` → neutral copy for
 * the `useActionState` trigger form (MPU-3). Multi-page is FREE (MPU-2
 * removed): no gate/upgrade copy (TLM-5).
 */
export const MULTIPAGE_COPY = {
  header: {
    eyebrow: "Auditoría Multi-Página",
    title: "Auditoría Multi-Página",
    description:
      "Analice varias rutas de su sitio en una sola auditoría para obtener una vista agregada de su visibilidad de IA.",
  },
  form: {
    inputLabel: "URL del sitio",
    placeholder: "https://ejemplo.com",
    submitLabel: "Iniciar auditoría",
    formAriaLabel: "Auditoría multi-página",
  },
  /** MultiPageErrorCode → neutral Spanish copy (MPU-3). */
  errors: {
    "rate-limited": "Demasiadas solicitudes. Espere un momento.",
    invalid:
      "Formato de URL inválido. Verifique que la URL sea correcta y vuelva a intentarlo.",
    auth: "Necesita iniciar sesión para ejecutar una auditoría multi-página.",
    limit:
      "Alcanzó el límite de auditorías de su plan. Espere al próximo ciclo para continuar.",
    failed:
      "No pudimos completar la auditoría multi-página. Pruebe nuevamente en unos minutos.",
  },
  results: {
    emptyTitle: "Sin auditorías multi-página todavía",
    emptyBody:
      "Ejecute su primera auditoría multi-página para ver el desglose por ruta.",
    selectorTitle: "Rutas y URLs Analizadas",
    selectorSubtitle:
      "Seleccione una URL para inspeccionar su diagnóstico individual",
    totalLabel: "páginas",
    inspectorLabel: "Detalle de Ruta",
    scoreLabel: "GEO Score",
    durationLabel: "Duración",
    /** Honest empty state for legacy multi-page audits without AuditPage rows (MPU-8). */
    detailEmptyTitle: "No hay detalle disponible para esta auditoría",
    detailEmptyBody:
      "Esta auditoría se generó antes de que se persistiera el detalle por página, por lo que no es posible mostrar el reporte completo de cada ruta.",
  },
} as const;

/** Typed grouping of every copy domain (design U2). */
export const COPY = {
  auditFormErrors: AUDIT_FORM_ERRORS,
  fetchError: FETCH_ERROR_COPY,
  genericAuditError: GENERIC_AUDIT_ERROR_COPY,
  shareModalErrors: SHARE_MODAL_ERROR_COPY,
  auth: AUTH_COPY,
  shell: SHELL_COPY,
  landing: LANDING_COPY,
  dashboard: DASHBOARD_COPY,
  profile: PROFILE_COPY,
  legal: LEGAL_COPY,
  report: REPORT_COPY,
  share: SHARE_COPY,
  multipage: MULTIPAGE_COPY,
} as const;
