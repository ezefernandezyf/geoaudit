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

/** Checkout/Portal action error codes → neutral Spanish copy (PRC-4, B8). */
export const CHECKOUT_ERROR_COPY: Record<string, string> = {
  auth: "Necesita iniciar sesión para gestionar su plan.",
  "invalid-plan": "Plan no válido.",
  config: "No pudimos iniciar el pago. Pruebe de nuevo en unos minutos.",
  "no-subscription": "No tiene una suscripción activa.",
};

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
  /** Signup-only developer/marketer eyebrow (B10, neutral — no tuteo). */
  developerEyebrow?: string;
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
    developerEyebrow: "Cree su cuenta de desarrollador / marketer",
  },
};

/**
 * Shell copy (SHL-6, B10) — global navbar/footer strings in NEUTRAL Spanish
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
      "¿Cómo citan los motores de IA su producto cuando los usuarios buscan su categoría?",
    subtitleLead: "Pegue su URL y obtenga en segundos un ",
    subtitleHighlight: "GEO Score 0-100",
    subtitleTail:
      " con diagnóstico detallado de presencia en ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews y Bing Copilot.",
    sampleLabel: "O pruebe un ejemplo real:",
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
    // LND-7 (sprint 8): the ScoreHero shows a REAL verified audit — the
    // category breakdown renders only from the evidence (score-hero-evidence.ts).
    scorecardCategoryTitle: "Desglose por categoría",
    scorecardBandsTitle: "Escala de Bandas y Criterios Técnicos",
    platformsEyebrow: "Ecosistema de Búsqueda de IA",
    platformsTitle: "6 plataformas de búsqueda generativa auditadas",
    platformsLead:
      "Analizamos la interacción de cada crawler y motor de respuesta con el contenido web.",
    pricingEyebrow: "Planes y Acceso",
    pricingTitle: "Comience a monitorear la visibilidad de su marca en la IA",
    pricingSubtitle:
      "Desde 3 auditorías gratuitas hasta planes profesionales con monitoreo continuo, multi-page y reportes compartibles.",
    pricingCta: "Ver Planes y Precios",
    pricingSecondaryCta: "Crear cuenta gratis",
    // LND-6 (sprint 8): the secondary CTA for an authenticated visitor.
    pricingSecondaryCtaLoggedIn: "Ir al dashboard",
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
    body: "Ingrese la URL de su producto o sitio web para generar su primer GEO Score y diagnóstico de visibilidad en IA.",
    cta: "Auditar mi primera URL",
  },
} as const;

/**
 * Profile page copy (PRF-1..6, design U4) — account surface on
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
  manage: {
    upgradeCta: "Mejorar a Pro",
    upgradeBlurb:
      "Obtenga más auditorías, multi-página, PDF y links de compartición.",
    portalCta: "Gestionar suscripción",
    portalBlurb:
      "Administre su método de pago, facturas o cancele su plan desde el portal.",
  },
  support: {
    title: "Soporte",
    blurb:
      "¿Problemas con su cuenta o facturación? Escríbanos y lo ayudamos a la brevedad.",
    emailLabel: "Correo de soporte",
    email: "soporte@geoaudit.app",
    pricingLink: "Ver planes y precios",
    pricingHref: "/pricing",
  },
} as const;

/**
 * Legal page copy (LGL-1..4, design U4) — /terms + /privacy static content,
 * neutral Spanish (no voseo, LGL-4). Keyed by page; each entry carries the
 * Gemini header block and the body sections rendered as heading + paragraph.
 */
export const LEGAL_COPY = {
  terms: {
    eyebrow: "Legal",
    title: "Términos de Servicio",
    updated: "Última actualización: agosto de 2026",
    intro:
      "Al utilizar GeoAudit acepta estos términos. Le recomendamos leerlos detenidamente antes de usar el servicio.",
    sections: [
      {
        heading: "1. Uso del servicio",
        body: "GeoAudit ofrece auditorías de visibilidad en motores de búsqueda con IA. El usuario se compromete a utilizarlo de forma lícita y a no abusar del servicio ni intentar vulnerar su seguridad.",
      },
      {
        heading: "2. Cuenta y responsabilidad",
        body: "El usuario es responsable de mantener la confidencialidad de su cuenta y de todas las actividades que ocurran bajo ella. Debe notificar de inmediato cualquier uso no autorizado.",
      },
      {
        heading: "3. Planes y facturación",
        body: "Los planes de pago se facturan mensualmente y se renuevan de forma automática. El usuario puede cancelar en cualquier momento y conservará el acceso hasta el final del período pagado.",
      },
      {
        heading: "4. Propiedad intelectual",
        body: "El servicio y su contenido son propiedad de GeoAudit. El usuario conserva los derechos sobre el contenido de sus propios sitios y sobre los reportes generados para sus dominios.",
      },
      {
        heading: "5. Limitación de responsabilidad",
        body: "El servicio se ofrece 'tal cual'. GeoAudit no garantiza resultados específicos de posicionamiento ni se hace responsable por decisiones tomadas en base a los reportes.",
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
    intro:
      "Esta política describe cómo GeoAudit recopila, utiliza y protege su información personal al usar el servicio.",
    sections: [
      {
        heading: "1. Datos que recopilamos",
        body: "Recopilamos los datos de cuenta (nombre, correo) y la información técnica de las URLs que audita, incluidos los reportes generados a partir de su análisis.",
      },
      {
        heading: "2. Uso de los datos",
        body: "Utilizamos sus datos para proveer el servicio, procesar pagos, mejorar nuestros análisis y enviarle comunicaciones relacionadas con su cuenta.",
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
        body: "Ante cualquier consulta sobre esta política, escríbanos a soporte@geoaudit.app y responderemos a la brevedad.",
      },
    ],
  },
} as const;

/**
 * Report copy (U5, ARU-10/11/12, design U5) — Gemini verbatim section
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
 * Public share page copy (U5.10, SHR-7..9, design U5) — Gemini SharePage
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
 * Multi-page audit copy (U6, MPU-1/2/3, design U6) — Gemini trigger page
 * wording, neutral Spanish (usted). `MultiPageErrorCode` → neutral copy for
 * the `useActionState` trigger form (MPU-3).
 */
export const MULTIPAGE_COPY = {
  header: {
    eyebrow: "Auditoría Multi-Página (Pro)",
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
    upgrade:
      "La auditoría multi-página es una función PRO. Mejore su plan para activarla.",
    limit:
      "Alcanzó el límite de auditorías de su plan. Espere al próximo ciclo para continuar.",
    failed:
      "No pudimos completar la auditoría multi-página. Pruebe nuevamente en unos minutos.",
  },
  gate: {
    title: "La auditoría multi-página es una función PRO",
    body: "Analice múltiples rutas de su sitio en una sola auditoría y obtenga un reporte agregado de visibilidad de IA.",
    cta: "Mejorar a PRO",
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
  checkoutErrors: CHECKOUT_ERROR_COPY,
  shareModalErrors: SHARE_MODAL_ERROR_COPY,
  auth: AUTH_COPY,
  shell: SHELL_COPY,
  landing: LANDING_COPY,
  pricing: PRICING_COPY,
  dashboard: DASHBOARD_COPY,
  profile: PROFILE_COPY,
  legal: LEGAL_COPY,
  report: REPORT_COPY,
  share: SHARE_COPY,
  multipage: MULTIPAGE_COPY,
} as const;
