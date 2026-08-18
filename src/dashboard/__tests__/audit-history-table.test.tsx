import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditHistoryTable } from "@/dashboard/audit-history-table";
import { formatAuditDate } from "@/report/format";
import { auditFixtures } from "./fixtures";

/**
 * U4 — Dashboard history table (DSH-1/DSH-3). Pure presentation: renders the
 * rows in the order received (the RSC owns the newest→oldest ordering via the
 * Prisma query) and maps every severity band to its Spanish label through the
 * shared SeverityBadge.
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
