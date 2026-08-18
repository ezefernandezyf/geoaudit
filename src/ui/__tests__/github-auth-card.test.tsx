import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubAuthCard } from "@/ui/github-auth-card";

/**
 * U2 — ATH-1..ATH-5: shared GitHub OAuth card used by /login and /signup.
 * The button starts the GitHub handshake with the callbackUrl from the query
 * string (default /dashboard) and a denied/failed attempt surfaces an inline
 * role="alert" error. signIn + useSearchParams are mocked; everything else is
 * real rendering.
 */
const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
const nav = vi.hoisted(() => ({ useSearchParams: vi.fn() }));

vi.mock("next-auth/react", () => ({ signIn }));
vi.mock("next/navigation", () => ({ useSearchParams: nav.useSearchParams }));

function setParams(params: Record<string, string>) {
  nav.useSearchParams.mockReturnValue(new URLSearchParams(params));
}

describe("GitHubAuthCard login mode (ATH-1/3/4)", () => {
  beforeEach(() => {
    signIn.mockClear();
    setParams({});
  });

  it("renders heading, GitHub button and signup link", () => {
    render(<GitHubAuthCard mode="login" />);
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

  it("surfaces a denied OAuth attempt with role=alert", () => {
    setParams({ error: "AccessDenied" });
    render(<GitHubAuthCard mode="login" />);
    expect(screen.getByRole("alert")).toHaveTextContent("cancelaste");
  });

  it("renders no alert when there is no error", () => {
    render(<GitHubAuthCard mode="login" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("GitHubAuthCard signup mode (ATH-2)", () => {
  beforeEach(() => signIn.mockClear());

  it("renders signup copy, GitHub button and login link", () => {
    render(<GitHubAuthCard mode="signup" />);
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

  it("starts the same GitHub OAuth flow", () => {
    render(<GitHubAuthCard mode="signup" />);
    fireEvent.click(screen.getByRole("button"));
    expect(signIn).toHaveBeenCalledWith("github", {
      callbackUrl: "/dashboard",
    });
  });
});
