import type { FetchErrorCode } from "@/lib/contracts/fetch-types";

/**
 * A fetch failure that `runAudit` throws for: any typed `FetchErrorCode`
 * (page fetch layer, RFL-11) plus the non-HTML reason that would otherwise be
 * thrown at the audit boundary.
 */
export type FetchFailureCode = FetchErrorCode | "unsupported_content_type";

/**
 * FetchErrorCode → user-facing Spanish copy (ARU-6). Every code the fetch
 * layer can emit maps to a human-readable message; raw codes like TIMEOUT are
 * meaningless to end users. Single source of truth for the report domain.
 */
export const FETCH_ERROR_COPY: Record<FetchFailureCode, string> = {
  SSRF_BLOCKED: "El sitio bloqueó el acceso automatizado al contenido.",
  TIMEOUT:
    "El sitio tardó demasiado en responder. Verificá que la URL sea correcta.",
  NETWORK_ERROR:
    "No se pudo establecer la conexión con el sitio. Probá nuevamente en unos minutos.",
  DNS_FAILURE: "El dominio no existe o no se puede resolver.",
  HTTP_STATUS: "El sitio respondió con un error. Probá visitarlo directamente.",
  TOO_LARGE: "El sitio es demasiado pesado para analizarlo.",
  TOO_MANY_REDIRECTS: "El sitio tiene demasiadas redirecciones.",
  unsupported_content_type: "El sitio no devuelve contenido HTML analizable.",
};

/** Fallback copy for errors that carry no known fetch failure code. */
export const GENERIC_AUDIT_ERROR_COPY =
  "No pudimos analizar el sitio. Probá nuevamente.";

const FETCH_FAILURE_CODES = Object.keys(FETCH_ERROR_COPY) as FetchFailureCode[];

/**
 * Detects the fetch failure code embedded in the `runAudit` throw message
 * (format: `audit page fetch failed for <url>: <CODE>: <detail>`; the
 * unsupported reason uses `<reason> (<contentType>)`). Returns null when the
 * error is not a known fetch failure — callers then rethrow to the boundary.
 */
export function detectFetchFailureCode(
  message: string,
): FetchFailureCode | null {
  const found = FETCH_FAILURE_CODES.find(
    (code) => message.includes(`${code}:`) || message.includes(`${code} (`),
  );
  return found ?? null;
}

/** Maps an unknown error to the Spanish copy of its fetch failure code. */
export function resolveFetchErrorCopy(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code = detectFetchFailureCode(message);
  return code === null ? GENERIC_AUDIT_ERROR_COPY : FETCH_ERROR_COPY[code];
}
