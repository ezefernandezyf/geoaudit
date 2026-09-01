import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignupPage from "@/app/signup/page";

/**
 * U2 - ATH-6/7/9: /signup renders the Gemini centered card (max-w-lg) with the
 * benefits list and neutral copy. The shared card needs mocked useSearchParams
 * + signIn; the page wiring itself is what's under test.
 */
const nav = vi.hoisted(() => ({ useSearchParams: vi.fn() }));

vi.mock("next/navigation", () => ({ useSearchParams: nav.useSearchParams }));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

describe("SignupPage (ATH-6/7/9)", () => {
  it("renders the centered Gemini card with benefits and neutral copy", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
    const { container } = render(<SignupPage />);
    expect(container.querySelector("main")).toHaveClass("bg-[#f8fafc]");
    expect(
      screen.getByRole("heading", { name: "Cree su cuenta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continuar con GitHub" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Beneficios incluidos en su cuenta:"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicie sesión" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
