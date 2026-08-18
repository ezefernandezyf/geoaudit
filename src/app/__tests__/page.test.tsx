import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/page";

// The landing page wires AuditForm to auditAction, which now calls auth() for
// the tier pre-check (TLM-3). next-auth/lib/env.js imports next/server
// (unresolvable in vitest), so the module is mocked; the auth behavior itself
// is covered in src/lib/audit/__tests__/actions.test.ts.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

/**
 * U2.T4 — Landing page (ADF-1/ADF-8): hero with the URL form, no /dashboard.
 */
describe("landing page (ADF-1/ADF-8)", () => {
  it("renders the GeoAudit heading", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "GeoAudit",
    );
  });

  it("renders the URL input with an explicit accessible label (ADF-1)", () => {
    render(<Page />);
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("type", "url");
  });

  it("exposes no link to /dashboard (ADF-8)", () => {
    render(<Page />);
    const links = screen.queryAllByRole("link");
    expect(links).toHaveLength(0);
  });
});
