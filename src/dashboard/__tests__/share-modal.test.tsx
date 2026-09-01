import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareModal } from "@/dashboard/share-modal";
import { SHARE_MODAL_ERROR_COPY } from "@/lib/copy";
import type { ShareLinkAction } from "@/lib/audit/share-actions";

/**
 * U5.9 - ShareModal (ADP-7, design U5): Gemini modal verbatim over the REAL
 * share actions (injected as props): create/revoke via the two Server
 * Actions, copy to clipboard, real share intents (X / LinkedIn / WhatsApp)
 * and the public-view link. No tier gate - every authenticated owner shares
 * (SHR-3).
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

function openModal() {
  fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ShareModal trigger (ADP-7)", () => {
  it("renders the Gemini 'Compartir reporte' trigger that opens the dialog", () => {
    renderModal();

    expect(
      screen.getByRole("button", { name: "Compartir reporte" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    openModal();

    expect(
      screen.getByRole("dialog", { name: "Compartir reporte" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Compartir Reporte Público")).toBeInTheDocument();
  });
});

describe("ShareModal create flow (ADP-7 real actions)", () => {
  it("creates a link via the Server Action and shows the public URL + copy/revoke/social", async () => {
    const createMock = vi.fn(okCreate);
    renderModal({ createAction: createMock });

    openModal();
    fireEvent.click(screen.getByRole("button", { name: "Activar enlace" }));

    expect(
      await screen.findByDisplayValue(
        `${window.location.origin}/share/tok-new`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revocar enlace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ver vista pública/ }),
    ).toHaveAttribute("href", "/share/tok-new");

    const formData = createMock.mock.calls[0][1] as FormData;
    expect(formData.get("auditId")).toBe("audit-1");
  });
});

describe("ShareModal copy action (real clipboard)", () => {
  it("copies the share URL to the clipboard on 'Copiar'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderModal({ initialToken: "tok-1" });
    openModal();

    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/share/tok-1`,
    );
    expect(
      await screen.findByRole("button", { name: "Copiado" }),
    ).toBeInTheDocument();
  });
});

describe("ShareModal social share intents (real actions, ADP-7)", () => {
  it("opens the real X / LinkedIn / WhatsApp intent URLs with the public link", () => {
    const openMock = vi.fn();
    Object.defineProperty(window, "open", {
      value: openMock,
      configurable: true,
      writable: true,
    });

    renderModal({ initialToken: "tok-1" });
    openModal();

    const shareUrl = `${window.location.origin}/share/tok-1`;
    const encoded = encodeURIComponent(shareUrl);

    fireEvent.click(screen.getByRole("button", { name: "Compartir en X" }));
    expect(openMock).toHaveBeenCalledWith(
      `https://twitter.com/intent/tweet?url=${encoded}`,
      "_blank",
      "noopener,noreferrer",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Compartir en LinkedIn" }),
    );
    expect(openMock).toHaveBeenCalledWith(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      "_blank",
      "noopener,noreferrer",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Compartir en WhatsApp" }),
    );
    expect(openMock).toHaveBeenCalledWith(
      `https://wa.me/?text=${encoded}`,
      "_blank",
      "noopener,noreferrer",
    );
  });
});

describe("ShareModal revoke flow (real action)", () => {
  it("revokes the token: URL disappears and 'Activar enlace' returns", async () => {
    const revokeMock = vi.fn(okRevoke);
    renderModal({ initialToken: "tok-1", revokeAction: revokeMock });

    openModal();
    fireEvent.click(screen.getByRole("button", { name: "Revocar enlace" }));

    await waitFor(() =>
      expect(
        screen.queryByDisplayValue(`${window.location.origin}/share/tok-1`),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Activar enlace" }),
    ).toBeInTheDocument();

    const formData = revokeMock.mock.calls[0][1] as FormData;
    expect(formData.get("auditId")).toBe("audit-1");
  });
});

describe("ShareModal error + close (ADP-7)", () => {
  it("renders the action error with role=alert", async () => {
    const deniedCreate: ShareLinkAction = async () => ({
      shareToken: null,
      error: "failed",
      revoked: false,
    });
    renderModal({ createAction: deniedCreate });

    openModal();
    fireEvent.click(screen.getByRole("button", { name: "Activar enlace" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      SHARE_MODAL_ERROR_COPY.failed,
    );
  });

  it("closes the dialog from its 'Cerrar' button", () => {
    renderModal();
    openModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
