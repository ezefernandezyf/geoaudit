import { describe, expect, it } from "vitest";
import { urlInputSchema } from "@/lib/contracts/url-input";
import {
  AUDIT_FORM_ERRORS,
  isAllowedProtocol,
  normalizeToHttps,
} from "@/lib/audit/url-policy";
import { auditAction } from "@/lib/audit/actions";
import type { AuditFormState } from "@/lib/audit/actions";

/**
 * U2.T1/U2.T2 — Server Action contract (ADF-3/4/5).
 * - isAllowedProtocol: pure protocol filter, http/https only (ADF-3).
 * - normalizeToHttps: silent http→https upgrade, idempotent (ADF-4).
 * - auditAction: FormData → Zod → filter → normalize → redirect (ADF-5),
 *   inline errors instead of throwing for validation failures.
 *
 * The redirect assertions use the REAL next/navigation redirect, which throws
 * a NEXT_REDIRECT error carrying the target in its digest — no mocks needed.
 */
describe("isAllowedProtocol (ADF-3)", () => {
  it("accepts http and https schemes", () => {
    expect(isAllowedProtocol("http://ejemplo.com")).toBe(true);
    expect(isAllowedProtocol("https://ejemplo.com")).toBe(true);
  });

  it("rejects non-http(s) schemes", () => {
    expect(isAllowedProtocol("ftp://archivos.ejemplo.com")).toBe(false);
    expect(isAllowedProtocol("mailto:hola@ejemplo.com")).toBe(false);
    expect(isAllowedProtocol("file:///etc/passwd")).toBe(false);
    expect(isAllowedProtocol("javascript:alert(1)")).toBe(false);
  });

  it("rejects malformed strings that cannot be parsed as URLs", () => {
    expect(isAllowedProtocol("not a url")).toBe(false);
    expect(isAllowedProtocol("")).toBe(false);
  });
});

describe("normalizeToHttps (ADF-4)", () => {
  it("silently upgrades http to https", () => {
    expect(normalizeToHttps("http://ejemplo.com")).toBe("https://ejemplo.com/");
  });

  it("leaves https untouched (idempotent double normalization)", () => {
    expect(normalizeToHttps("https://ejemplo.com")).toBe(
      "https://ejemplo.com/",
    );
  });

  it("preserves path, query and hash", () => {
    expect(normalizeToHttps("http://ejemplo.com/guia?q=geo#top")).toBe(
      "https://ejemplo.com/guia?q=geo#top",
    );
  });
});

describe("urlInputSchema accepts ftp (protocol filter is mandatory)", () => {
  it("passes ftp:// through Zod — the filter, not the schema, rejects it", () => {
    const result = urlInputSchema.safeParse({
      url: "ftp://archivos.ejemplo.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("auditAction (ADF-5)", () => {
  const fd = (url: string): FormData => {
    const formData = new FormData();
    formData.set("url", url);
    return formData;
  };

  async function expectRedirect(
    formData: FormData,
    expectedTarget: string,
  ): Promise<void> {
    try {
      await auditAction({ error: null }, formData);
      expect.unreachable("auditAction should have redirected");
    } catch (err) {
      const digest = (err as { digest?: string }).digest ?? "";
      expect(digest).toContain("NEXT_REDIRECT");
      expect(digest).toContain(expectedTarget);
    }
  }

  it("redirects to /report?url= for a valid https URL", async () => {
    await expectRedirect(
      fd("https://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );
  });

  it("normalizes http to https before redirecting (ADF-4)", async () => {
    await expectRedirect(
      fd("http://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );
  });

  it("returns an inline error for a non-http(s) protocol (ADF-3)", async () => {
    const state = await auditAction(
      { error: null },
      fd("ftp://archivos.ejemplo.com"),
    );
    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.protocol });
  });

  it("returns an inline error for an invalid URL format", async () => {
    const state = await auditAction({ error: null }, fd("not a url"));
    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.invalidUrl });
  });

  it("returns an inline error when the url field is missing", async () => {
    const state = await auditAction({ error: null }, new FormData());
    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.invalidUrl });
  });

  it("never throws on validation failures — inline state only", async () => {
    const bad: Array<string | null> = ["not a url", "", "ftp://x.com"];
    for (const value of bad) {
      const formData = new FormData();
      if (value !== null) formData.set("url", value);
      const state: AuditFormState = await auditAction(
        { error: null },
        formData,
      );
      expect(state.error).not.toBeNull();
    }
  });
});
