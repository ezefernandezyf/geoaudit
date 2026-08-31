import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * U1.T3 — Root layout font loading (DNF-3) + no /dashboard link (D6).
 * next/font/google is mocked: it needs the Next build pipeline and would
 * otherwise attempt a network fetch under vitest.
 */
vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({ variable: "mock-font-display" }),
  Work_Sans: () => ({ variable: "mock-font-sans" }),
  JetBrains_Mono: () => ({ variable: "mock-font-mono" }),
}));

// The layout now resolves auth() to feed the Navbar (U2.1/SHL-1). Mock it —
// it imports next/server (unresolvable in vitest). An anonymous session keeps
// the shell free of /dashboard links for anon visitors (D6).
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
// The Navbar renders the client NavLinks island (usePathname) — mock the hook.
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import RootLayout from "@/app/layout";

/** Layout is an async server component (awaits auth()) — render the resolved JSX. */
async function renderLayout(children: React.ReactNode) {
  return render(await RootLayout({ children }));
}

describe("root layout (DNF-3)", () => {
  it("loads Instrument Serif, Work Sans and JetBrains Mono via next/font", async () => {
    await renderLayout(<p>contenido</p>);
    // React mounts <html>/<body> onto the real document (jsdom root hoisting).
    expect(document.body.className).toContain("mock-font-display");
    expect(document.body.className).toContain("mock-font-sans");
    expect(document.body.className).toContain("mock-font-mono");
    expect(document.body.className).toContain("antialiased");
  });

  it("keeps the app language and renders children", async () => {
    await renderLayout(<p>contenido</p>);

    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("does not link to /dashboard (D6)", async () => {
    await renderLayout(<p>contenido</p>);

    expect(
      screen.queryByRole("link", { name: /dashboard/i }),
    ).not.toBeInTheDocument();
  });
});

describe("root layout shell (SHL-1, U2.1)", () => {
  it("wraps children in the global Navbar and Footer", async () => {
    await renderLayout(<p>contenido</p>);

    // Navbar renders the primary Producto link; /pricing is gone (WU-1/2).
    expect(screen.getByRole("link", { name: "Producto" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.queryByRole("link", { name: "Precios" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("GeoAudit AI Visibility Audit"),
    ).toBeInTheDocument();
    // Navbar + Footer both render the brand (Relevy wordmark, SHL-4).
    expect(screen.getAllByText("Relevy").length).toBeGreaterThan(0);
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
