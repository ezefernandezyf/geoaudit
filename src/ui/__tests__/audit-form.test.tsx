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
 * U2.3 — AuditForm (ADF-1/2/6/7, LND-1): client island reusing TextField +
 * Button with the Gemini hero composition.
 * - LND-1: the submit button sits INSIDE the URL field (rightElement) and
 *   sample URL chips pre-fill the input.
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
  fireEvent.click(screen.getByRole("button", { name: "Auditar URL" }));
}

describe("AuditForm (ADF-1)", () => {
  it("renders a single url input with an explicit label", () => {
    const { container } = render(<AuditForm action={okAction} />);
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("type", "url");
    expect(input).toHaveAttribute("name", "url");
    expect(container.querySelectorAll("input")).toHaveLength(1);
  });

  it("renders exactly one submit button and no other fields", () => {
    const { container } = render(<AuditForm action={okAction} />);
    expect(screen.getByRole("button", { name: "Auditar URL" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(container.querySelectorAll('button[type="submit"]')).toHaveLength(1);
    expect(container.querySelectorAll("input, select, textarea")).toHaveLength(
      1,
    );
  });
});

describe("AuditForm inline button + sample URLs (LND-1)", () => {
  it("places the submit button inside the URL field (not stacked below)", () => {
    render(<AuditForm action={okAction} />);
    const input = screen.getByLabelText("URL del sitio");
    const submit = screen.getByRole("button", { name: "Auditar URL" });
    // The input and the button share the TextField's relative wrapper.
    const wrapper = input.closest(".relative");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.contains(submit)).toBe(true);
  });

  it("renders the sample URL chips as tappable buttons", () => {
    render(<AuditForm action={okAction} />);
    for (const label of [
      "linear.app",
      "acme-store.io",
      "devstack.io",
      "legacyconsulting.com",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("pre-fills the input when a sample URL chip is activated (LND-1)", () => {
    render(<AuditForm action={okAction} />);
    fireEvent.click(screen.getByRole("button", { name: "acme-store.io" }));
    expect(screen.getByLabelText("URL del sitio")).toHaveValue(
      "https://acme-store.io",
    );
  });

  it("clears a client error when a sample URL chip is activated", () => {
    render(<AuditForm action={okAction} />);
    fireEvent.change(screen.getByLabelText("URL del sitio"), {
      target: { value: "not a url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Auditar URL" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "linear.app" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("AuditForm client-side Zod validation (ADF-2)", () => {
  it("blocks submit and shows 'Formato de URL inválido' with role=alert", () => {
    const action = vi.fn(okAction);
    render(<AuditForm action={action} />);
    fireEvent.change(screen.getByLabelText("URL del sitio"), {
      target: { value: "not a url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Auditar URL" }));
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
      "Demasiadas solicitudes. Espere un momento.",
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
    expect(
      screen.getByRole("button", { name: "Auditar URL" }),
    ).not.toBeDisabled();
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
    fireEvent.click(screen.getByRole("button", { name: "Auditar URL" }));
    await act(async () => {
      await Promise.resolve();
    });
    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("url")).toBe("https://ejemplo.com");
  });
});
