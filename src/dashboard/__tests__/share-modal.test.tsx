import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareModal } from "@/dashboard/share-modal";
import { SHARE_MODAL_ERROR_COPY } from "@/lib/copy";
import type { ShareLinkAction } from "@/lib/audit/share-actions";

/**
 * U3.10 — ShareModal (SHR-7, ADP-8, design ShareModal): a dialog that reuses
 * the two share Server Actions (injected as props, the BillingCta →
 * CheckoutButton pattern). It exposes "Copiar enlace" and "Revocar" and is
 * PRO-gated by the page (the page only renders it when gate.allowed).
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

function renderModal({
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
    <ShareModal
      auditId={auditId}
      initialToken={initialToken}
      createAction={createAction}
      revokeAction={revokeAction}
    />,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ShareModal trigger (ADP-8)", () => {
  it("renders a 'Compartir reporte' trigger button that opens the dialog", () => {
    renderModal();

    expect(
      screen.getByRole("button", { name: "Compartir reporte" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));

    expect(
      screen.getByRole("dialog", { name: "Compartir reporte" }),
    ).toBeInTheDocument();
  });
});

describe("ShareModal create flow (SHR-3)", () => {
  it("creates a link on submit and shows the public URL + copy/revoke actions", async () => {
    const createMock = vi.fn(okCreate);
    renderModal({ createAction: createMock });

    fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear link" }));

    expect(
      await screen.findByText(`${window.location.origin}/share/tok-new`),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copiar enlace" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revocar" })).toBeInTheDocument();

    const formData = createMock.mock.calls[0][1] as FormData;
    expect(formData.get("auditId")).toBe("audit-1");
  });
});

describe("ShareModal copy action (SHR-7)", () => {
  it("copies the share URL to the clipboard on 'Copiar enlace'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderModal({ initialToken: "tok-1" });
    fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));

    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/share/tok-1`,
    );
    expect(
      await screen.findByRole("button", { name: "Copiado" }),
    ).toBeInTheDocument();
  });
});

describe("ShareModal revoke flow (SHR-7)", () => {
  it("revokes the token: URL disappears and 'Crear link' returns", async () => {
    const revokeMock = vi.fn(okRevoke);
    renderModal({ initialToken: "tok-1", revokeAction: revokeMock });

    fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocar" }));

    await waitFor(() =>
      expect(
        screen.queryByText(`${window.location.origin}/share/tok-1`),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Crear link" }),
    ).toBeInTheDocument();

    const formData = revokeMock.mock.calls[0][1] as FormData;
    expect(formData.get("auditId")).toBe("audit-1");
  });
});

describe("ShareModal error + close (SHR-7)", () => {
  it("renders the action error with role=alert (TLM-9: FREE denied)", async () => {
    const deniedCreate: ShareLinkAction = async () => ({
      shareToken: null,
      error: "upgrade",
      revoked: false,
    });
    renderModal({ createAction: deniedCreate });

    fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      SHARE_MODAL_ERROR_COPY.upgrade,
    );
  });

  it("closes the dialog from its 'Cerrar' button", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
