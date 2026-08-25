import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardRunnerBar } from "@/dashboard/runner-bar";
import type { AuditAction } from "@/lib/audit/actions";

/**
 * U4.1 — Dashboard runner bar (DSH-8, design U4). Gemini verbatim: the URL
 * input with the "Run Audit" button INSIDE it, plus the user chip (name, plan
 * pill, initials avatar) in the same bar. The input drives the real audit via
 * the injected Server Action.
 */

const okAction: AuditAction = async () => ({ error: null });

const USER = { name: "Marcos Delgado", email: "m@x.com", plan: "pro" };

describe("DashboardRunnerBar (DSH-8)", () => {
  it("renders the URL input with the 'Run Audit' button inside it", () => {
    render(<DashboardRunnerBar action={okAction} user={USER} />);

    const input = screen.getByRole("textbox", { name: "URL del sitio" });
    expect(input).toHaveAttribute("type", "url");
    expect(
      screen.getByRole("button", { name: /Run Audit/i }),
    ).toBeInTheDocument();

    // The button rides inside the input's field (rightElement): same wrapper.
    const wrapper = input.closest("div");
    expect(wrapper).not.toBeNull();
    expect(
      wrapper?.querySelector('button[name=""]') ??
        wrapper?.querySelector("button"),
    ).toBeTruthy();
  });

  it("renders the user chip with name, plan pill and initials", () => {
    render(<DashboardRunnerBar action={okAction} user={USER} />);

    expect(screen.getByText("Marcos Delgado")).toBeInTheDocument();
    expect(screen.getByText("pro Plan")).toBeInTheDocument();
    expect(screen.getByText("MD")).toBeInTheDocument();
  });

  it("submits a valid URL through the injected action", () => {
    const action = vi.fn(okAction);
    render(<DashboardRunnerBar action={action} user={USER} />);

    fireEvent.change(screen.getByRole("textbox", { name: "URL del sitio" }), {
      target: { value: "https://acme.io" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run Audit/i }));

    expect(action).toHaveBeenCalledTimes(1);
  });
});
