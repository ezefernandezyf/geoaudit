import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuditHistoryTable } from "@/dashboard/audit-history-table";
import { formatAuditDate } from "@/report/format";
import { auditFixtures, multiPageFixture } from "./fixtures";

// The table uses useRouter().refresh() for the refresh action (DSH-11).
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

/**
 * U4.3 - Dashboard history table (DSH-1/3/7/10/11, design U4). Gemini verbatim
 * header bar + rows with a "Multi-Page" chip, a refresh action and a
 * "SCANNING..." skeleton row during an in-flight audit.
 */
describe("AuditHistoryTable (DSH-1)", () => {
  it("renders audits newest→oldest in the order received", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(auditFixtures.length + 1); // + header row

    expect(
      within(rows[1]).getByText("https://example.com"),
    ).toBeInTheDocument();
    expect(
      within(rows[2]).getByText("https://ejemplo.org/blog"),
    ).toBeInTheDocument();
    expect(within(rows[3]).getByText("https://tienda.com")).toBeInTheDocument();
    expect(within(rows[4]).getByText("https://legacy.net")).toBeInTheDocument();
    expect(within(rows[5]).getByText("https://old.com")).toBeInTheDocument();
  });

  it("shows URL, GEO score, band label and date per row", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    const first = within(screen.getAllByRole("row")[1]);

    expect(first.getByText("https://example.com")).toBeInTheDocument();
    expect(first.getByText("87")).toBeInTheDocument();
    expect(first.getByText("Excelente")).toBeInTheDocument();
    expect(
      first.getByText(formatAuditDate(auditFixtures[0].createdAt.getTime())),
    ).toBeInTheDocument();
  });

  it("maps every severity band to its Spanish label", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    expect(screen.getAllByText("Excelente")).toHaveLength(1);
    expect(screen.getAllByText("Bueno")).toHaveLength(1);
    expect(screen.getAllByText("Regular")).toHaveLength(1);
    expect(screen.getAllByText("Deficiente")).toHaveLength(1);
    expect(screen.getAllByText("Crítico")).toHaveLength(1);
  });
});

describe("AuditHistoryTable (DSH-3)", () => {
  it("offers a re-audit link per row pointing at /report?url=", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    const links = screen.getAllByRole("link", { name: "Re-auditar" });
    expect(links).toHaveLength(auditFixtures.length);
    expect(links[0]).toHaveAttribute(
      "href",
      `/report?url=${encodeURIComponent("https://example.com")}`,
    );
    expect(links[1]).toHaveAttribute(
      "href",
      `/report?url=${encodeURIComponent("https://ejemplo.org/blog")}`,
    );
  });
});

/**
 * U1 - Detail navigation (DSH-7): every history row links to its own detail
 * page, so the dashboard becomes the entry point to `/dashboard/audits/[id]`.
 */
describe("AuditHistoryTable (DSH-7)", () => {
  it("links every row's URL to its detail page", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);

    const links = screen.getAllByRole("link", { name: "https://example.com" });
    expect(links[0]).toHaveAttribute("href", "/dashboard/audits/a1");
    expect(
      screen.getByRole("link", { name: "https://ejemplo.org/blog" }),
    ).toHaveAttribute("href", "/dashboard/audits/a2");
    expect(
      screen.getByRole("link", { name: "https://tienda.com" }),
    ).toHaveAttribute("href", "/dashboard/audits/a3");
    expect(
      screen.getByRole("link", { name: "https://legacy.net" }),
    ).toHaveAttribute("href", "/dashboard/audits/a4");
    expect(
      screen.getByRole("link", { name: "https://old.com" }),
    ).toHaveAttribute("href", "/dashboard/audits/a5");
  });

  it("keeps the re-audit link alongside the detail link", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    const row = screen.getAllByRole("row")[1];

    expect(
      // URL cell links to the detail page…
      row.querySelector('a[href="/dashboard/audits/a1"]'),
    ).toBeInTheDocument();
    // …while the Re-auditar action stays per row.
    expect(row.querySelector('a[href^="/report?url="]')).toBeInTheDocument();
  });
});

/**
 * U3.9 - History search (DSH-9): a client search input filters the table by
 * URL substring, and clearing it restores the full list.
 */
describe("AuditHistoryTable search (DSH-9)", () => {
  it("renders a search input for filtering by URL", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    expect(
      screen.getByRole("searchbox", { name: "Filtrar por URL" }),
    ).toBeInTheDocument();
  });

  it("filters rows by URL substring (case-insensitive)", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Filtrar por URL" }),
      { target: { value: "EJEMPLO" } },
    );

    expect(screen.getByText("https://ejemplo.org/blog")).toBeInTheDocument();
    expect(screen.queryByText("https://example.com")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 match
  });

  it("clearing the input restores the full list", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    const input = screen.getByRole("searchbox", { name: "Filtrar por URL" });

    fireEvent.change(input, { target: { value: "tienda" } });
    expect(screen.getByText("https://tienda.com")).toBeInTheDocument();
    expect(screen.queryByText("https://example.com")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(auditFixtures.length + 1);
  });
});

/**
 * U4.3 - Multi-Page chip (DSH-10): a persisted multi-page audit row shows the
 * "Multi-Page" chip.
 */
describe("AuditHistoryTable Multi-Page chip (DSH-10)", () => {
  it("renders a 'Multi-Page' chip on multi-page rows", () => {
    render(<AuditHistoryTable audits={[...auditFixtures, multiPageFixture]} />);
    expect(screen.getByText("Multi-Page")).toBeInTheDocument();
  });

  it("does not render the chip on single-page rows", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    expect(screen.queryByText("Multi-Page")).not.toBeInTheDocument();
  });
});

/**
 * U4.3 - Refresh + scanning row (DSH-11): a refresh action exists in the
 * header bar, and a "SCANNING..." row appears while an audit is in flight.
 */
describe("AuditHistoryTable refresh + scanning (DSH-11)", () => {
  it("renders a header-bar refresh button that calls router.refresh", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    const refresh = screen.getByRole("button", { name: "Refrescar historial" });
    fireEvent.click(refresh);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("renders a 'SCANNING...' row when isScanning is true", () => {
    render(
      <AuditHistoryTable
        audits={auditFixtures}
        isScanning
        scanningUrl="https://acme.io/pricing"
      />,
    );
    expect(screen.getByText("SCANNING...")).toBeInTheDocument();
    expect(screen.getByText("En Proceso")).toBeInTheDocument();
    expect(screen.getByText("https://acme.io/pricing")).toBeInTheDocument();
  });

  it("does not render the scanning row when not scanning", () => {
    render(<AuditHistoryTable audits={auditFixtures} />);
    expect(screen.queryByText("SCANNING...")).not.toBeInTheDocument();
  });
});
