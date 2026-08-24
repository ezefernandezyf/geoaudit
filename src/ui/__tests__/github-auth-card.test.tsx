import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubAuthCard } from "@/ui/github-auth-card";

/**
 * U2 — ATH-1..ATH-9: shared GitHub OAuth card used by /login and /signup,
 * restyled Gemini verbatim (direct hex, centered card, "Continuar con GitHub"
 * — ATH-8) with neutral copy from COPY.auth. The button starts the GitHub
 * handshake with the callbackUrl from the query string (default /dashboard)
 * and a denied/failed attempt surfaces an inline role="alert" error. signIn +
 * useSearchParams are mocked; everything else is real rendering.
 */
const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
const nav = vi.hoisted(() => ({ useSearchParams: vi.fn() }));

vi.mock("next-auth/react", () => ({ signIn }));
vi.mock("next/navigation", () => ({ useSearchParams: nav.useSearchParams }));

function setParams(params: Record<string, string>) {
  nav.useSearchParams.mockReturnValue(new URLSearchParams(params));
}

describe("GitHubAuthCard login mode (ATH-1/3/4/8)", () => {
  beforeEach(() => {
    signIn.mockClear();
    setParams({});
  });

  it("renders the Gemini card with heading, GitHub button and signup link", () => {
    const { container } = render(<GitHubAuthCard mode="login" />);
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
    // U2.10 token→hex: Gemini direct hex on the primary action.
    expect(container.querySelector("button")).toHaveClass("bg-[#0f172a]");
  });

  it("starts GitHub OAuth with the default callbackUrl", () => {
    render(<GitHubAuthCard mode="login" />);
    fireEvent.click(screen.getByRole("button"));
    expect(signIn).toHaveBeenCalledWith("github", {
      callbackUrl: "/dashboard",
    });
  });

  it("passes the callbackUrl preserved from the query string", () => {
    setParams({ callbackUrl: "/dashboard/history" });
    render(<GitHubAuthCard mode="login" />);
    fireEvent.click(screen.getByRole("button"));
    expect(signIn).toHaveBeenCalledWith("github", {
      callbackUrl: "/dashboard/history",
    });
  });

  it("surfaces a denied OAuth attempt with role=alert and neutral copy", () => {
    setParams({ error: "AccessDenied" });
    render(<GitHubAuthCard mode="login" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "canceló la autorización",
    );
  });

  it("renders no alert when there is no error", () => {
    render(<GitHubAuthCard mode="login" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not list signup benefits in login mode", () => {
    render(<GitHubAuthCard mode="login" />);
    expect(
      screen.queryByText("Beneficios incluidos en su cuenta:"),
    ).not.toBeInTheDocument();
  });
});

describe("GitHubAuthCard signup mode (ATH-2/7/8)", () => {
  beforeEach(() => signIn.mockClear());

  it("renders signup copy, GitHub button, benefits and login link", () => {
    render(<GitHubAuthCard mode="signup" />);
    expect(
      screen.getByRole("heading", { name: "Cree su cuenta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continuar con GitHub" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicie sesión" })).toHaveAttribute(
      "href",
      "/login",
    );
    // ATH-7: signup benefits listed with checkmarks.
    expect(
      screen.getByText("Beneficios incluidos en su cuenta:"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "3 auditorías GEO mensuales sin costo con desglose por modelo",
      ),
    ).toBeInTheDocument();
  });

  it("starts the same GitHub OAuth flow", () => {
    render(<GitHubAuthCard mode="signup" />);
    fireEvent.click(screen.getByRole("button"));
    expect(signIn).toHaveBeenCalledWith("github", {
      callbackUrl: "/dashboard",
    });
  });
});
