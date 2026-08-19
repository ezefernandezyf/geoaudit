import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";

/**
 * U2 — ATH-1: /login renders the custom design-system page with the GitHub
 * action (no default NextAuth styling). The shared card needs mocked
 * useSearchParams + signIn; the page wiring itself is what's under test.
 */
const nav = vi.hoisted(() => ({ useSearchParams: vi.fn() }));

vi.mock("next/navigation", () => ({ useSearchParams: nav.useSearchParams }));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

describe("LoginPage (ATH-1)", () => {
  it("renders the custom login page with the GitHub button", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
    render(<LoginPage />);
    expect(
      screen.getByRole("heading", { name: "Iniciá sesión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar sesión con GitHub" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Creala/ })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
