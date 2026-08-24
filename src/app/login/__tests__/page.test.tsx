import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";

/**
 * U2 — ATH-6/8/9: /login renders the Gemini centered auth card with neutral
 * copy (no default NextAuth styling, direct hex). The shared card needs mocked
 * useSearchParams + signIn; the page wiring itself is what's under test.
 */
const nav = vi.hoisted(() => ({ useSearchParams: vi.fn() }));

vi.mock("next/navigation", () => ({ useSearchParams: nav.useSearchParams }));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

describe("LoginPage (ATH-6/8/9)", () => {
  it("renders the centered Gemini card with neutral auth copy", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
    const { container } = render(<LoginPage />);
    expect(container.querySelector("main")).toHaveClass("bg-[#f8fafc]");
    expect(
      screen.getByRole("heading", { name: "Inicie sesión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continuar con GitHub" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cree una" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
