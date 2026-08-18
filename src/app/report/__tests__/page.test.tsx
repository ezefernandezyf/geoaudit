import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReportPage from "@/app/report/page";

// The page wires url -> AuditRunner under Suspense; the runner itself is
// async (RSC) and covered by its own tests. Here it is mocked as a sync
// component so the page branch logic is testable in jsdom without streaming.
vi.mock("@/report/audit-runner", () => ({
  AuditRunner: ({ url }: { url: string }) => <div>AuditRunner:{url}</div>,
}));

// The page imports auditAction, which now calls auth() for the tier pre-check
// (TLM-3). next-auth/lib/env.js imports next/server (unresolvable in vitest),
// so the module is mocked; the auth behavior itself is covered in
// src/lib/audit/__tests__/actions.test.ts.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

async function renderPage(params: Record<string, string>) {
  return render(await ReportPage({ searchParams: Promise.resolve(params) }));
}

/**
 * U3.T1 — Report page shell (ARU-1/ARU-2/ARU-5): force-dynamic + nodejs RSC
 * that branches on `searchParams.url`. The decision itself lives in
 * resolve.ts (pure); here we assert the Empty state render, the pre-filled
 * correction input, and the Suspense→AuditRunner wiring for valid URLs.
 */
describe("ReportPage empty state (ARU-5)", () => {
  it("renders the inline form when no url param is present", async () => {
    await renderPage({});
    expect(
      screen.getByText("Ingresá una URL para comenzar el análisis"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("URL del sitio")).toHaveAttribute(
      "type",
      "url",
    );
    expect(screen.queryByText(/^AuditRunner:/)).not.toBeInTheDocument();
  });

  it("pre-fills the input with the invalid value for correction", async () => {
    await renderPage({ url: "not a url" });
    expect(screen.getByLabelText("URL del sitio")).toHaveValue("not a url");
  });

  it("pre-fills the input for a disallowed protocol", async () => {
    await renderPage({ url: "ftp://x" });
    expect(screen.getByLabelText("URL del sitio")).toHaveValue("ftp://x");
  });
});

describe("ReportPage valid URL (ARU-1/ARU-2)", () => {
  it("renders the AuditRunner with the resolved url and no empty state", async () => {
    await renderPage({ url: "https://ejemplo.com" });
    expect(
      screen.getByText("AuditRunner:https://ejemplo.com"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Ingresá una URL para comenzar el análisis"),
    ).not.toBeInTheDocument();
  });
});
