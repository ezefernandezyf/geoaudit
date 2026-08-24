import { describe, expect, it } from "vitest";
import {
  detectFetchFailureCode,
  FETCH_ERROR_COPY,
  resolveFetchErrorCopy,
} from "@/report/fetch-error-copy";

/**
 * U3.T1 (ARU-6 pull-forward) — FetchErrorCode → Spanish copy. Pure module:
 * detects the failure code embedded in the runAudit throw message and maps it
 * to user-facing copy. Extracted so the mapping is testable without rendering.
 */
describe("detectFetchFailureCode (ARU-6)", () => {
  it("detects a TIMEOUT code in the audit throw message", () => {
    expect(
      detectFetchFailureCode(
        "audit page fetch failed for https://lento.com/: TIMEOUT: request aborted",
      ),
    ).toBe("TIMEOUT");
  });

  it("detects a DNS_FAILURE code", () => {
    expect(
      detectFetchFailureCode(
        "audit page fetch failed for https://noexiste.com/: DNS_FAILURE: no address",
      ),
    ).toBe("DNS_FAILURE");
  });

  it("detects an unsupported_content_type reason (no colon separator)", () => {
    expect(
      detectFetchFailureCode(
        "audit page fetch failed for https://x.com/: unsupported_content_type (text/plain)",
      ),
    ).toBe("unsupported_content_type");
  });

  it("returns null when the message carries no known failure code", () => {
    expect(detectFetchFailureCode("unexpected boom")).toBeNull();
    expect(detectFetchFailureCode("")).toBeNull();
  });

  it("does not match a code that appears as a plain word without separator", () => {
    expect(
      detectFetchFailureCode("the TIMEOUT constant was not involved"),
    ).toBeNull();
  });
});

describe("FETCH_ERROR_COPY (ARU-6)", () => {
  it("maps every known failure code to a non-empty Spanish message", () => {
    const codes = Object.keys(FETCH_ERROR_COPY);
    expect(codes.length).toBeGreaterThanOrEqual(8);
    for (const code of codes) {
      expect(FETCH_ERROR_COPY[code as keyof typeof FETCH_ERROR_COPY]).not.toBe(
        "",
      );
    }
  });

  it("uses the exact ARU-6 copy for a timeout", () => {
    expect(
      resolveFetchErrorCopy(
        new Error(
          "audit page fetch failed for https://lento.com/: TIMEOUT: aborted",
        ),
      ),
    ).toBe(
      "El sitio tardó demasiado en responder. Verifique que la URL sea correcta.",
    );
  });

  it("uses the exact ARU-6 copy for a DNS failure", () => {
    expect(
      resolveFetchErrorCopy(
        new Error(
          "audit page fetch failed for https://noexiste.com/: DNS_FAILURE: nxdomain",
        ),
      ),
    ).toBe("El dominio no existe o no se puede resolver.");
  });

  it("uses the exact ARU-6 copy for an HTTP error status", () => {
    expect(
      resolveFetchErrorCopy(
        new Error(
          "audit page fetch failed for https://x.com/: HTTP_STATUS: 500",
        ),
      ),
    ).toBe("El sitio respondió con un error. Pruebe visitarlo directamente.");
  });

  it("falls back to the generic copy for unknown errors", () => {
    expect(resolveFetchErrorCopy(new Error("engine exploded"))).toBe(
      "No pudimos analizar el sitio. Pruebe nuevamente.",
    );
    expect(resolveFetchErrorCopy("raw string")).toBe(
      "No pudimos analizar el sitio. Pruebe nuevamente.",
    );
  });
});
