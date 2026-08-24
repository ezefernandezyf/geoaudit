import { describe, expect, it } from "vitest";
import {
  AUDIT_FORM_ERRORS,
  AUTH_COPY,
  COPY,
  FETCH_ERROR_COPY,
  GENERIC_AUDIT_ERROR_COPY,
  LANDING_COPY,
  SHARE_MODAL_ERROR_COPY,
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
 */

/** Imperative voseo forms that must NEVER appear in centralized copy. */
const VOSEO_PATTERN =
  /Verificá|Probá|Esperá|Alcanzaste|Necesitás|Mejorá|Iniciá|Creá|Accedé|Auditá|tenés|Comenzá|obtené|Ingresá|Analizá|Copiá|Compartí|Descargá|Podés|Querés|Mirá|Fijate|Registrate|Logueáte/;

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
    expect(SHARE_MODAL_ERROR_COPY.upgrade).toBe(
      "Compartir es una función PRO. Mejore su plan para activarla.",
    );
    expect(SHARE_MODAL_ERROR_COPY.failed).toBe(
      "No pudimos generar el link. Pruebe de nuevo en unos minutos.",
    );
  });

  it("keeps AUTH_COPY neutral", () => {
    expect(AUTH_COPY.login.heading).toBe("Inicie sesión");
    expect(AUTH_COPY.login.description).toBe(
      "Acceda a su historial de auditorías y siga su progreso de visibilidad en IA.",
    );
    expect(AUTH_COPY.login.switchLink.label).toBe("¿No tiene cuenta? Créela");
    expect(AUTH_COPY.signup.heading).toBe("Cree su cuenta");
    expect(AUTH_COPY.signup.switchLink.label).toBe(
      "¿Ya tiene cuenta? Inicie sesión",
    );
  });

  it("keeps the landing copy neutral", () => {
    expect(LANDING_COPY.hero.badge).toBe("GEO Engine");
    expect(LANDING_COPY.hero.title).toBe(
      "¿Cómo te citan los motores de IA cuando los usuarios buscan tu categoría?",
    );
    expect(LANDING_COPY.hero.sampleLabel).toBe("O prueba un ejemplo real:");
    expect(LANDING_COPY.sections.pricingTitle).toBe(
      "Comienza a monitorear la visibilidad de tu marca en la IA",
    );
  });

  it("contains no voseo anywhere in COPY", () => {
    expect(JSON.stringify(COPY)).not.toMatch(VOSEO_PATTERN);
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
});
