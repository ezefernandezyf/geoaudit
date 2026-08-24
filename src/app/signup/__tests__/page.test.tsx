import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignupPage from "@/app/signup/page";

/**
 * U2 — ATH-2: /signup renders the restyled page with the same GitHub card
 * (sign-up and login conflue in GitHub OAuth — account creation is automatic
 * on first sign-in).
 */
const nav = vi.hoisted(() => ({ useSearchParams: vi.fn() }));

vi.mock("next/navigation", () => ({ useSearchParams: nav.useSearchParams }));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

describe("SignupPage (ATH-2)", () => {
  it("renders the restyled signup page with the GitHub button", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
    render(<SignupPage />);
    expect(
      screen.getByRole("heading", { name: "Creá tu cuenta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear cuenta con GitHub" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Iniciá sesión/ })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders the brand mark in the auth shell", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
    render(<SignupPage />);
    expect(screen.getAllByText("G")[0]).toBeInTheDocument();
  });
});
