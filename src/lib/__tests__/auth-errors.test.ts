import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/auth-errors";

/**
 * U2 — ATH-5: a failed/denied OAuth attempt surfaces an inline error.
 * Pure mapping from the NextAuth error query-param code to user-facing copy,
 * shared by the /login and /signup cards.
 */
describe("authErrorMessage (ATH-5)", () => {
  it("returns null when there is no error param", () => {
    expect(authErrorMessage(null)).toBeNull();
    expect(authErrorMessage("")).toBeNull();
  });

  it("maps known NextAuth codes to a user-facing message", () => {
    expect(authErrorMessage("AccessDenied")).toContain("canceló");
    expect(authErrorMessage("OAuthAccountNotLinked")).toContain("otra cuenta");
    expect(authErrorMessage("OAuthCallback")).toContain("Inténtelo");
  });

  it("falls back to the default message for unknown codes", () => {
    expect(authErrorMessage("CallbackRouteError")).toContain(
      "No se pudo iniciar sesión",
    );
  });
});
