import { describe, expect, it } from "vitest";
import {
  AUDIT_FORM_ERRORS,
  AUTH_COPY,
  CHECKOUT_ERROR_COPY,
  COPY,
  DASHBOARD_COPY,
  FETCH_ERROR_COPY,
  GENERIC_AUDIT_ERROR_COPY,
  LANDING_COPY,
  PRICING_COPY,
  REPORT_COPY,
  SHARE_COPY,
  SHARE_MODAL_ERROR_COPY,
  SHELL_COPY,
} from "@/lib/copy";
// U2.2 source-of-truth: the legacy modules must re-export the SAME objects.
import { AUDIT_FORM_ERRORS as URL_POLICY_ERRORS } from "@/lib/audit/url-policy";
import {
  FETCH_ERROR_COPY as REPORT_FETCH_ERRORS,
  GENERIC_AUDIT_ERROR_COPY as REPORT_GENERIC_ERROR,
} from "@/report/fetch-error-copy";

/**
 * U2.1/U2.2 — centralized neutral-Spanish copy (ATH-9, LGL-4).
 * Every user-facing string lives in src/lib/copy.ts with voseo migrated to
 * neutral Spanish ("Esperá"→"Espere", "Alcanzaste"→"Alcanzó",
 * "Verificá"→"Verifique", "Probá"→"Pruebe", "Necesitás"→"Necesita",
 * "Mejorá"→"Mejore", "Iniciá sesión"→"Inicie sesión",
 * "Creá tu cuenta"→"Cree su cuenta"). url-policy and fetch-error-copy import
 * from copy.ts so the strings are never duplicated (source-of-truth).
 * B10 (sprint 8): remaining tuteo in LANDING_COPY/DASHBOARD_COPY also migrated
 * to usted ("Pega"→"Pegue", "obtén"→"obtenga", "Comienza"→"Comience",
 * "Ingresa"→"Ingrese", "prueba"→"pruebe", "te citan"→"citan … su producto",
 * "Inicia sesión"→"Inicie sesión", "Crea cuenta"→"Cree su cuenta",
 * "Crea tu"→"Cree su").
 */

/** Imperative voseo/tuteo forms that must NEVER appear in centralized copy. */
const VOSEO_PATTERN =
  /Verificá|Probá|Esperá|Alcanzaste|Necesitás|Mejorá|Iniciá|Creá|Accedé|Auditá|tenés|Comenzá|obtené|Ingresá|Analizá|Copiá|Compartí|Descargá|Podés|Querés|Mirá|Fijate|Registrate|Logueáte|Pega|obtén|Comienza|Ingresa|te citan|Inicia sesión|Crea cuenta|Crea tu|prueba/;

describe("COPY — neutral Spanish (ATH-9, LGL-4)", () => {
  it("keeps AUDIT_FORM_ERRORS neutral", () => {
    expect(AUDIT_FORM_ERRORS.invalidUrl).toBe("Formato de URL inválido");
    expect(AUDIT_FORM_ERRORS.protocol).toBe("Solo URLs http/https");
    expect(AUDIT_FORM_ERRORS.rateLimited).toBe(
      "Demasiadas solicitudes. Espere un momento.",
    );
    expect(AUDIT_FORM_ERRORS.limitReached).toBe(
      "Alcanzó el límite de 3 auditorías gratuitas. El contador se reinicia 30 días después de cada auditoría.",
    );
  });

  it("keeps FETCH_ERROR_COPY neutral", () => {
    expect(FETCH_ERROR_COPY.TIMEOUT).toBe(
      "El sitio tardó demasiado en responder. Verifique que la URL sea correcta.",
    );
    expect(FETCH_ERROR_COPY.NETWORK_ERROR).toBe(
      "No se pudo establecer la conexión con el sitio. Pruebe nuevamente en unos minutos.",
    );
    expect(FETCH_ERROR_COPY.HTTP_STATUS).toBe(
      "El sitio respondió con un error. Pruebe visitarlo directamente.",
    );
    expect(GENERIC_AUDIT_ERROR_COPY).toBe(
      "No pudimos analizar el sitio. Pruebe nuevamente.",
    );
  });

  it("keeps the share-modal error copy neutral", () => {
    expect(SHARE_MODAL_ERROR_COPY.auth).toBe(
      "Necesita iniciar sesión para compartir.",
    );
    expect(SHARE_MODAL_ERROR_COPY.failed).toBe(
      "No pudimos generar el link. Pruebe de nuevo en unos minutos.",
    );
    // The "upgrade" code is gone — sharing is FREE (SHR-3, TLM-5).
    expect(SHARE_MODAL_ERROR_COPY.upgrade).toBeUndefined();
  });

  it("keeps the checkout error copy neutral (B8)", () => {
    expect(CHECKOUT_ERROR_COPY.auth).toBe(
      "Necesita iniciar sesión para gestionar su plan.",
    );
    expect(CHECKOUT_ERROR_COPY["invalid-plan"]).toBe("Plan no válido.");
    expect(CHECKOUT_ERROR_COPY.config).toBe(
      "No pudimos iniciar el pago. Pruebe de nuevo en unos minutos.",
    );
    expect(CHECKOUT_ERROR_COPY["no-subscription"]).toBe(
      "No tiene una suscripción activa.",
    );
  });

  it("keeps AUTH_COPY neutral (ATH-8/9)", () => {
    expect(AUTH_COPY.login.heading).toBe("Inicie sesión");
    expect(AUTH_COPY.login.description).toBe(
      "Acceda a su historial de auditorías y siga su progreso de visibilidad en IA.",
    );
    expect(AUTH_COPY.login.buttonLabel).toBe("Continuar con GitHub");
    expect(AUTH_COPY.login.switchPrompt).toBe("¿No tiene cuenta?");
    expect(AUTH_COPY.login.switchLink.label).toBe("Cree una");
    expect(AUTH_COPY.login.termsNote).toBe(
      "Al continuar, acepta nuestros términos de servicio y políticas de privacidad de datos técnicos.",
    );
    expect(AUTH_COPY.signup.heading).toBe("Cree su cuenta");
    expect(AUTH_COPY.signup.buttonLabel).toBe("Continuar con GitHub");
    expect(AUTH_COPY.signup.switchPrompt).toBe(
      "¿Ya tiene una cuenta registrada?",
    );
    expect(AUTH_COPY.signup.switchLink.label).toBe("Inicie sesión");
    expect(AUTH_COPY.signup.benefits?.label).toBe(
      "Beneficios incluidos en su cuenta:",
    );
    expect(AUTH_COPY.signup.benefits?.items).toEqual([
      "3 auditorías GEO mensuales sin costo con desglose por modelo",
      "Historial persistente para comparar mejoras de GEO Score",
      "Diagnóstico preventivo de bloqueos en robots.txt y cabeceras",
      "Generación de enlaces públicos compartibles con token seguro",
    ]);
  });

  it("keeps the landing copy neutral (B10: no voseo, no tuteo)", () => {
    expect(LANDING_COPY.hero.badge).toBe("GEO Engine");
    expect(LANDING_COPY.hero.title).toBe(
      "¿Cómo citan los motores de IA su producto cuando los usuarios buscan su categoría?",
    );
    expect(LANDING_COPY.hero.subtitleLead).toBe(
      "GeoAudit es una plataforma de auditoría GEO que analiza su sitio en 6 motores de búsqueda con IA.",
    );
    expect(LANDING_COPY.hero.sampleLabel).toBe("O pruebe un ejemplo real:");
    expect(LANDING_COPY.sections.pricingTitle).toBe(
      "Comience a monitorear la visibilidad de su marca en la IA",
    );
    // LND-6 (sprint 8): the authenticated secondary CTA is neutral and links
    // the dashboard, never the signup flow.
    expect(LANDING_COPY.sections.pricingSecondaryCtaLoggedIn).toBe(
      "Ir al dashboard",
    );
  });

  it("keeps the dashboard copy neutral (B10, DSH-4)", () => {
    expect(DASHBOARD_COPY.empty.title).toBe("No hay auditorías registradas");
    expect(DASHBOARD_COPY.empty.body).toBe(
      "Ingrese la URL de su producto o sitio web para generar su primer GEO Score y diagnóstico de visibilidad en IA.",
    );
    expect(DASHBOARD_COPY.empty.cta).toBe("Auditar mi primera URL");
  });

  it("keeps the shell copy neutral (SHL-6, B10)", () => {
    expect(SHELL_COPY.nav.login).toBe("Inicie sesión");
    expect(SHELL_COPY.nav.signup).toBe("Cree su cuenta");
  });

  it("keeps the auth signup developer eyebrow neutral (B10)", () => {
    expect(AUTH_COPY.signup.developerEyebrow).toBe(
      "Cree su cuenta de desarrollador / marketer",
    );
  });

  it("contains no voseo anywhere in COPY", () => {
    expect(JSON.stringify(COPY)).not.toMatch(VOSEO_PATTERN);
  });
});

describe("PRICING_COPY (U3.2, PRC-5/7)", () => {
  it("keeps the Gemini pricing header neutral", () => {
    expect(PRICING_COPY.header.eyebrow).toBe("Planes Transparentes");
    expect(PRICING_COPY.header.title).toBe(
      "Optimiza la citabilidad de tu producto en la era de la IA",
    );
    expect(PRICING_COPY.header.subtitle).toContain("Sin sorpresas");
  });

  it("answers billing cycle, cancellation and plan changes (PRC-7)", () => {
    const faq = PRICING_COPY.faq.items.map((item) => item.q);
    expect(faq).toContain("¿Cómo funciona la facturación?");
    expect(faq).toContain("¿Puedo cancelar en cualquier momento?");
    expect(faq).toContain("¿Puedo cambiar de plan?");
    const answers = PRICING_COPY.faq.items.map((item) => item.a).join(" ");
    expect(answers).toMatch(/se facturan mensualmente/);
    expect(answers).toMatch(/sin penalizaciones/);
    expect(answers).toMatch(/prorrateo automático/);
  });

  it("answers real product questions with neutral copy", () => {
    const faq = PRICING_COPY.faq.items.map((item) => item.q);
    expect(faq).toContain("¿Qué es el GEO Score?");
    expect(faq).toContain("¿Qué plataformas analiza?");
    expect(faq).toContain("¿Puedo auditar varias páginas?");
    expect(faq).toContain("¿Cómo funciona el PDF?");
  });

  it("exposes PRICING_COPY on the grouped COPY object", () => {
    expect(COPY.pricing).toBe(PRICING_COPY);
  });
});

describe("REPORT_COPY / SHARE_COPY (U5, neutral Spanish)", () => {
  it("keeps the report copy neutral and Gemini-verbatim", () => {
    expect(REPORT_COPY.hero.scoreLabel).toBe("GEO Score");
    expect(REPORT_COPY.hero.benchmarkTitle).toBe("Baremos de Referencia");
    expect(REPORT_COPY.scorecard.title).toBe("Scorecard por Categoría");
    expect(REPORT_COPY.matrix.notMeasured).toBe("No medido");
    expect(REPORT_COPY.findings.title).toBe("Hallazgos Técnicos Priorizados");
    expect(REPORT_COPY.live.inProgress).toBe("Auditoría en Progreso");
    expect(REPORT_COPY.emptyState.body).toBe(
      "Ingrese una URL para comenzar el análisis",
    );
  });

  it("keeps the share page copy neutral (SHR-7..9)", () => {
    expect(SHARE_COPY.header.verified).toBe("Verificado");
    expect(SHARE_COPY.header.cta).toBe("Auditar mi URL gratis");
    expect(SHARE_COPY.footer.title).toBe(
      "¿Quiere saber cómo citan los motores de IA su sitio?",
    );
    expect(SHARE_COPY.footer.cta).toBe("Comenzar auditoría gratuita");
  });

  it("exposes report and share copy on the grouped COPY object", () => {
    expect(COPY.report).toBe(REPORT_COPY);
    expect(COPY.share).toBe(SHARE_COPY);
  });
});

describe("COPY — single source of truth (U2.2)", () => {
  it("url-policy re-exports the same AUDIT_FORM_ERRORS object", () => {
    expect(URL_POLICY_ERRORS).toBe(AUDIT_FORM_ERRORS);
  });

  it("fetch-error-copy re-exports the same FETCH_ERROR_COPY and generic copy", () => {
    expect(REPORT_FETCH_ERRORS).toBe(FETCH_ERROR_COPY);
    expect(REPORT_GENERIC_ERROR).toBe(GENERIC_AUDIT_ERROR_COPY);
  });

  it("exposes every expected key on the grouped COPY object", () => {
    expect(Object.keys(COPY.auditFormErrors)).toEqual(
      Object.keys(AUDIT_FORM_ERRORS),
    );
    expect(Object.keys(COPY.fetchError)).toEqual(Object.keys(FETCH_ERROR_COPY));
  });

  it("exposes checkout and shell copy on the grouped COPY object (B8/B10)", () => {
    expect(COPY.checkoutErrors).toBe(CHECKOUT_ERROR_COPY);
    expect(COPY.shell).toBe(SHELL_COPY);
  });
});

describe("LANDING_COPY citable passages (LND-11, sprint 9)", () => {
  /**
   * LND-11: the landing hero/features MUST be answer-first with concrete stats
   * so passages are self-contained and citable by AI systems. Mirrors the
   * citability engine's stat pattern (percentages, currency, 4-digit years).
   */
  const STAT_PATTERN = /[\d,.]+?\s*%|\$\s*[\d,]+|\b(?:20\d{2}|19\d{2})\b/;
  const ANSWER_FIRST_PATTERN =
    /^(?:GeoAudit|El GEO Score|La citabilidad|La plataforma|El engine|Los motores|Los pasajes)/;

  it("hero subtitle is answer-first and carries at least one concrete stat", () => {
    const subtitle =
      `${LANDING_COPY.hero.subtitleLead}${LANDING_COPY.hero.subtitleHighlight}${LANDING_COPY.hero.subtitleTail}`.trim();
    expect(subtitle).toMatch(ANSWER_FIRST_PATTERN);
    expect(subtitle).toMatch(STAT_PATTERN);
    expect(subtitle.length).toBeGreaterThan(80);
  });

  it("each feature card is answer-first, self-contained and has a stat", () => {
    for (const feature of LANDING_COPY.features) {
      expect(feature.title.length).toBeGreaterThan(0);
      expect(feature.body).toMatch(ANSWER_FIRST_PATTERN);
      expect(feature.body).toMatch(STAT_PATTERN);
      // Self-contained extraction band: 50-200 words (RCI-4).
      const words = feature.body.trim().split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(50);
      expect(words).toBeLessThanOrEqual(200);
    }
  });

  it("the platforms lead names the six audited AI engines with a stat", () => {
    expect(LANDING_COPY.sections.platformsLead).toMatch(/\b6\b/);
    expect(LANDING_COPY.sections.platformsLead).toMatch(STAT_PATTERN);
  });
});
