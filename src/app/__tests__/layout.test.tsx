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

import RootLayout from "@/app/layout";

describe("root layout (DNF-3)", () => {
  it("loads Instrument Serif, Work Sans and JetBrains Mono via next/font", () => {
    render(
      <RootLayout>
        <p>contenido</p>
      </RootLayout>,
    );

    // React mounts <html>/<body> onto the real document (jsdom root hoisting).
    expect(document.body.className).toContain("mock-font-display");
    expect(document.body.className).toContain("mock-font-sans");
    expect(document.body.className).toContain("mock-font-mono");
    expect(document.body.className).toContain("antialiased");
  });

  it("keeps the app language and renders children", () => {
    render(
      <RootLayout>
        <p>contenido</p>
      </RootLayout>,
    );

    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("does not link to /dashboard (D6)", () => {
    render(
      <RootLayout>
        <p>contenido</p>
      </RootLayout>,
    );

    expect(
      screen.queryByRole("link", { name: /dashboard/i }),
    ).not.toBeInTheDocument();
  });
});
