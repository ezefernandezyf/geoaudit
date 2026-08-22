import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShareLinkPanel } from "@/dashboard/share-link-panel";
import type {
  ShareLinkAction,
  ShareLinkState,
} from "@/lib/audit/share-actions";

/**
 * U2.7 — share-link panel on the audit detail page (SHR-3/4, TLM-9, design
 * D7). Client component receiving the two Server Actions as props (the
 * BillingCta → CheckoutButton pattern): the audit id travels in hidden inputs,
 * the URL is built client-side from the current origin. UX states: idle
 * (create vs revoke), loading (aria-busy + disabled), success (URL shown),
 * error (role="alert").
 */

const okCreate: ShareLinkAction = async () => ({
  shareToken: "tok-new",
  error: null,
  revoked: false,
});
const okRevoke: ShareLinkAction = async () => ({
  shareToken: null,
  error: null,
  revoked: true,
});

function renderPanel({
  auditId = "audit-1",
  initialToken = null,
  createAction = okCreate,
  revokeAction = okRevoke,
}: {
  auditId?: string;
  initialToken?: string | null;
  createAction?: ShareLinkAction;
  revokeAction?: ShareLinkAction;
} = {}) {
  render(
    <ShareLinkPanel
      auditId={auditId}
      initialToken={initialToken}
      createAction={createAction}
      revokeAction={revokeAction}
    />,
  );
}

describe("ShareLinkPanel idle state", () => {
  it("shows 'Crear link' when no token exists", () => {
    renderPanel();

    expect(
      screen.getByRole("button", { name: "Crear link" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Revocar" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the public URL and 'Revocar' when a token already exists", () => {
    renderPanel({ initialToken: "tok-1" });

    expect(
      screen.getByText(`${window.location.origin}/share/tok-1`),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revocar" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Crear link" }),
    ).not.toBeInTheDocument();
  });
});

describe("ShareLinkPanel create flow (SHR-3)", () => {
  it("submits the audit id and swaps to the URL + revoke on success", async () => {
    const createMock = vi.fn(okCreate);
    renderPanel({ createAction: createMock });

    fireEvent.click(screen.getByRole("button", { name: "Crear link" }));

    expect(
      await screen.findByText(`${window.location.origin}/share/tok-new`),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revocar" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Crear link" }),
    ).not.toBeInTheDocument();

    expect(createMock).toHaveBeenCalledTimes(1);
    const formData = createMock.mock.calls[0][1] as FormData;
    expect(formData.get("auditId")).toBe("audit-1");
  });

  it("renders the action error with role=alert (TLM-9: FREE denied)", async () => {
    const deniedCreate: ShareLinkAction = async () => ({
      shareToken: null,
      error: "upgrade",
      revoked: false,
    });
    renderPanel({ createAction: deniedCreate });

    fireEvent.click(screen.getByRole("button", { name: "Crear link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Compartir es una función PRO. Mejorá tu plan para activarla.",
    );
  });

  it("disables the form while the action is pending (loading state)", async () => {
    let release!: (state: ShareLinkState) => void;
    const pendingCreate: ShareLinkAction = () =>
      new Promise<ShareLinkState>((resolve) => {
        release = resolve;
      });
    renderPanel({ createAction: pendingCreate });

    fireEvent.click(screen.getByRole("button", { name: "Crear link" }));

    const form = screen.getByRole("form", { name: "Crear link de share" });
    await waitFor(() => expect(form).toHaveAttribute("aria-busy", "true"));
    expect(screen.getByRole("button", { name: "Crear link" })).toBeDisabled();

    await act(async () => {
      release({ shareToken: null, error: null, revoked: false });
    });
    await waitFor(() => expect(form).not.toHaveAttribute("aria-busy"));
    expect(
      screen.getByRole("button", { name: "Crear link" }),
    ).not.toBeDisabled();
  });
});

describe("ShareLinkPanel revoke flow (SHR-4)", () => {
  it("nulls the token: URL disappears and 'Crear link' returns", async () => {
    const revokeMock = vi.fn(okRevoke);
    renderPanel({ initialToken: "tok-1", revokeAction: revokeMock });

    fireEvent.click(screen.getByRole("button", { name: "Revocar" }));

    await waitFor(() =>
      expect(
        screen.queryByText(`${window.location.origin}/share/tok-1`),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Crear link" }),
    ).toBeInTheDocument();

    expect(revokeMock).toHaveBeenCalledTimes(1);
    const formData = revokeMock.mock.calls[0][1] as FormData;
    expect(formData.get("auditId")).toBe("audit-1");
  });

  it("renders the revoke error with role=alert", async () => {
    const failedRevoke: ShareLinkAction = async () => ({
      shareToken: null,
      error: "failed",
      revoked: false,
    });
    renderPanel({ initialToken: "tok-1", revokeAction: failedRevoke });

    fireEvent.click(screen.getByRole("button", { name: "Revocar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos generar el link. Probá de nuevo en unos minutos.",
    );
  });
});
