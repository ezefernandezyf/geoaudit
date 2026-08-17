import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuditForm } from "@/ui/audit-form";
import { AUDIT_FORM_ERRORS } from "@/lib/audit/url-policy";
import type { AuditAction, AuditFormState } from "@/lib/audit/actions";

/**
 * U2.T3 — AuditForm (ADF-1/2/6/7): client component reusing TextField + Button.
 * - ADF-1: single <input type="url"> + explicit label, no other fields.
 * - ADF-2: client-side Zod validation before submit, inline error.
 * - ADF-6: aria-busy on the form + disabled submit with "Analizando…" pending.
 * - ADF-7: server-side errors rendered with role="alert".
 */
const okAction: AuditAction = async () => ({ error: null });

function submitValidUrl(action: AuditAction = okAction) {
  render(<AuditForm action={action} />);
  fireEvent.change(screen.getByLabelText("URL del sitio"), {
    target: { value: "https://ejemplo.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Auditar" }));
}

describe("AuditForm (ADF-1)", () => {
  it("renders a single url input with an explicit label", () => {
    const { container } = render(<AuditForm action={okAction} />);
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("type", "url");
    expect(input).toHaveAttribute("name", "url");
    expect(container.querySelectorAll("input, select, textarea")).toHaveLength(
      1,
    );
  });

  it("renders exactly one submit button and no other fields", () => {
    const { container } = render(<AuditForm action={okAction} />);
    expect(screen.getByRole("button", { name: "Auditar" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(
      container.querySelectorAll("input, select, textarea, button"),
    ).toHaveLength(2);
  });
});

describe("AuditForm client-side Zod validation (ADF-2)", () => {
  it("blocks submit and shows 'Formato de URL inválido' with role=alert", () => {
    const action = vi.fn(okAction);
    render(<AuditForm action={action} />);
    fireEvent.change(screen.getByLabelText("URL del sitio"), {
      target: { value: "not a url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Auditar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Formato de URL inválido",
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("does not show an alert when the value is valid", () => {
    const { container } = render(<AuditForm action={okAction} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container.querySelector("[data-error-slot]")?.textContent).toBe("");
  });
});

describe("AuditForm server error display (ADF-7)", () => {
  it("renders the server-side protocol error with role=alert", async () => {
    const rejectingAction: AuditAction = async () => ({
      error: "Solo URLs http/https",
    });
    submitValidUrl(rejectingAction);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Solo URLs http/https",
    );
  });

  it("renders the rate-limit error from the action with role=alert (ADF-9)", async () => {
    const limitedAction: AuditAction = async () => ({
      error: AUDIT_FORM_ERRORS.rateLimited,
    });
    submitValidUrl(limitedAction);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demasiadas solicitudes. Esperá un momento.",
    );
  });

  it("passes the submitted URL to the action as FormData", async () => {
    const action = vi.fn(okAction);
    submitValidUrl(action);
    await act(async () => {
      await Promise.resolve();
    });
    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("url")).toBe("https://ejemplo.com");
  });
});

describe("AuditForm pending state (ADF-6)", () => {
  it("sets aria-busy and disables the submit with 'Analizando…' while pending", async () => {
    let release!: (state: AuditFormState) => void;
    const pendingAction: AuditAction = () =>
      new Promise<AuditFormState>((resolve) => {
        release = resolve;
      });

    submitValidUrl(pendingAction);

    // React 19 sets isPending inside a transition — flush it asynchronously.
    const form = screen.getByRole("form", { name: "Auditoría GEO" });
    await waitFor(() => expect(form).toHaveAttribute("aria-busy", "true"));
    const button = screen.getByRole("button", { name: "Analizando…" });
    expect(button).toBeDisabled();

    await act(async () => {
      release({ error: null });
    });
    await waitFor(() => expect(form).not.toHaveAttribute("aria-busy"));
    expect(screen.getByRole("button", { name: "Auditar" })).not.toBeDisabled();
  });
});

describe("AuditForm defaultValue (ARU-5)", () => {
  it("pre-fills the URL input with the given default value", () => {
    render(<AuditForm action={okAction} defaultValue="ftp://x" />);
    expect(screen.getByLabelText("URL del sitio")).toHaveValue("ftp://x");
  });

  it("submits the pre-filled value when the user does not edit it", async () => {
    const action = vi.fn(okAction);
    render(<AuditForm action={action} defaultValue="https://ejemplo.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Auditar" }));
    await act(async () => {
      await Promise.resolve();
    });
    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("url")).toBe("https://ejemplo.com");
  });
});
