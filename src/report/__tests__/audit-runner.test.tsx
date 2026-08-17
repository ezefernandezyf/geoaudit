import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runAudit } from "@/audit";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { AuditRunner } from "@/report/audit-runner";

vi.mock("@/audit", () => ({ runAudit: vi.fn() }));

const runAuditMock = vi.mocked(runAudit);

/**
 * U3.T1 (ARU-6 pull-forward) — minimal AuditRunner: calls runAudit(url),
 * renders a "reporte próximo" placeholder with the basic meta (URL + estado)
 * and maps fetch failures to friendly Spanish copy. The full scorecard render
 * is U4.T1.
 */
describe("AuditRunner placeholder (U3.T1)", () => {
  beforeEach(() => {
    runAuditMock.mockReset();
  });

  it("calls runAudit with the url prop", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    await AuditRunner({ url: "https://example.com/" });
    expect(runAuditMock).toHaveBeenCalledWith("https://example.com/");
  });

  it("renders the URL and the severity band state from the result", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    render(await AuditRunner({ url: "https://example.com/" }));

    expect(screen.getByText("https://example.com/")).toBeInTheDocument();
    // SeverityBadge ES label for the "Fair" band of the fixture.
    expect(screen.getByText("Regular")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
  });

  it("renders a placeholder note that the full report is coming", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    render(await AuditRunner({ url: "https://example.com/" }));

    expect(screen.getByText(/reporte completo/i)).toBeInTheDocument();
  });

  it("lists meta.errors when the audit is degraded (ARU-7)", async () => {
    const degraded = {
      ...auditResultFixture,
      meta: {
        ...auditResultFixture.meta,
        errors: ["citability: boom"],
      },
    };
    runAuditMock.mockResolvedValue(degraded);
    render(await AuditRunner({ url: "https://example.com/" }));

    expect(screen.getByText("citability: boom")).toBeInTheDocument();
  });
});

describe("AuditRunner fetch failure (ARU-6)", () => {
  beforeEach(() => {
    runAuditMock.mockReset();
  });

  it("renders the timeout copy and a Reintentar link when runAudit throws TIMEOUT", async () => {
    runAuditMock.mockRejectedValue(
      new Error(
        "audit page fetch failed for https://lento.com/: TIMEOUT: aborted",
      ),
    );
    render(await AuditRunner({ url: "https://lento.com/" }));

    expect(
      screen.getByText(
        "El sitio tardó demasiado en responder. Verificá que la URL sea correcta.",
      ),
    ).toBeInTheDocument();
    const retry = screen.getByRole("link", { name: "Reintentar" });
    expect(retry).toHaveAttribute(
      "href",
      "/report?url=https%3A%2F%2Flento.com%2F",
    );
  });

  it("renders the DNS failure copy", async () => {
    runAuditMock.mockRejectedValue(
      new Error(
        "audit page fetch failed for https://noexiste.com/: DNS_FAILURE: nxdomain",
      ),
    );
    render(await AuditRunner({ url: "https://noexiste.com/" }));

    expect(
      screen.getByText("El dominio no existe o no se puede resolver."),
    ).toBeInTheDocument();
  });

  it("renders the HTTP error copy", async () => {
    runAuditMock.mockRejectedValue(
      new Error("audit page fetch failed for https://x.com/: HTTP_STATUS: 500"),
    );
    render(await AuditRunner({ url: "https://x.com/" }));

    expect(
      screen.getByText(
        "El sitio respondió con un error. Probá visitarlo directamente.",
      ),
    ).toBeInTheDocument();
  });

  it("rethrows unexpected errors so the error boundary handles them (ARU-4)", async () => {
    runAuditMock.mockRejectedValue(new Error("engine exploded"));
    await expect(AuditRunner({ url: "https://x.com/" })).rejects.toThrow(
      "engine exploded",
    );
  });
});
