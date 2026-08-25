import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MultiPageForm } from "@/report/multi-page-form";
import { MULTIPAGE_COPY } from "@/lib/copy";
import type {
  MultiPageAction,
  MultiPageFormState,
} from "@/lib/audit/multi-page-actions";

/**
 * U6.1 — MultiPageForm (MPU-1/3, design U6): client island driving the REAL
 * `multiPageAuditAction` through `useActionState`.
 * - MPU-1: submit invokes the injected action with the URL as FormData.
 * - MPU-3: each MultiPageErrorCode maps to neutral Spanish copy rendered with
 *   role="alert".
 * The PRO gate (MPU-2) is owned by the RSC page (U6.2), not this form.
 */
const okAction: MultiPageAction = async () => ({ error: null });

function submitValidUrl(action: MultiPageAction = okAction) {
  render(<MultiPageForm action={action} />);
  fireEvent.change(screen.getByLabelText("URL del sitio"), {
    target: { value: "https://ejemplo.com" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: MULTIPAGE_COPY.form.submitLabel }),
  );
}

describe("MultiPageForm (MPU-1)", () => {
  it("renders a single url input with an explicit label", () => {
    const { container } = render(<MultiPageForm action={okAction} />);
    expect(screen.getByLabelText("URL del sitio")).toHaveAttribute(
      "type",
      "url",
    );
    expect(container.querySelectorAll("input")).toHaveLength(1);
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

describe("MultiPageForm error copy (MPU-3)", () => {
  it.each([
    ["rate-limited", MULTIPAGE_COPY.errors["rate-limited"]],
    ["invalid", MULTIPAGE_COPY.errors.invalid],
    ["auth", MULTIPAGE_COPY.errors.auth],
    ["upgrade", MULTIPAGE_COPY.errors.upgrade],
    ["limit", MULTIPAGE_COPY.errors.limit],
    ["failed", MULTIPAGE_COPY.errors.failed],
  ] as const)("maps the %s error code to neutral copy", async (code, copy) => {
    const rejectingAction: MultiPageAction = async () => ({ error: code });
    submitValidUrl(rejectingAction);
    expect(await screen.findByRole("alert")).toHaveTextContent(copy);
  });

  it("renders no alert when the action succeeds", () => {
    const { container } = render(<MultiPageForm action={okAction} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container.querySelector("[data-error-slot]")?.textContent).toBe("");
  });
});

describe("MultiPageForm client-side validation", () => {
  it("blocks submit and shows the invalid URL error with role=alert", () => {
    const action = vi.fn(okAction);
    render(<MultiPageForm action={action} />);
    fireEvent.change(screen.getByLabelText("URL del sitio"), {
      target: { value: "not a url" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: MULTIPAGE_COPY.form.submitLabel }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Formato de URL inválido",
    );
    expect(action).not.toHaveBeenCalled();
  });
});

describe("MultiPageForm pending state", () => {
  it("sets aria-busy and swaps the submit label while pending", async () => {
    let release!: (state: MultiPageFormState) => void;
    const pendingAction: MultiPageAction = () =>
      new Promise<MultiPageFormState>((resolve) => {
        release = resolve;
      });

    submitValidUrl(pendingAction);

    const form = screen.getByRole("form", {
      name: MULTIPAGE_COPY.form.formAriaLabel,
    });
    await waitFor(() => expect(form).toHaveAttribute("aria-busy", "true"));
    // The Button primitive swaps the label for the app-wide "Analizando…".
    expect(screen.getByRole("button", { name: "Analizando…" })).toBeDisabled();

    await act(async () => {
      release({ error: null });
    });
    await waitFor(() => expect(form).not.toHaveAttribute("aria-busy"));
    expect(
      screen.getByRole("button", { name: MULTIPAGE_COPY.form.submitLabel }),
    ).not.toBeDisabled();
  });
});
