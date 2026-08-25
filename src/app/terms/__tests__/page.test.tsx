import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TermsPage from "@/app/terms/page";
import { LEGAL_COPY } from "@/lib/copy";

/**
 * U4.6 — Terms page (LGL-1, LGL-3, LGL-4): static Server Component, Gemini
 * shell styling (hex), neutral Spanish copy from the single copy source.
 */
describe("TermsPage (LGL-1)", () => {
  it("renders the terms title and updated date", () => {
    render(<TermsPage />);
    expect(
      screen.getByRole("heading", { name: LEGAL_COPY.terms.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(LEGAL_COPY.terms.updated)).toBeInTheDocument();
  });

  it("renders every terms section heading and body (LGL-1)", () => {
    render(<TermsPage />);
    for (const section of LEGAL_COPY.terms.sections) {
      expect(
        screen.getByRole("heading", { name: section.heading }),
      ).toBeInTheDocument();
      expect(screen.getByText(section.body)).toBeInTheDocument();
    }
  });

  it("uses neutral Spanish copy — no voseo forms (LGL-4)", () => {
    render(<TermsPage />);
    const voseo = /hacé|tené|podés|tu cuenta|comenzá|probá|ingresá|mejorá/i;
    expect(screen.queryByText(voseo)).not.toBeInTheDocument();
  });
});
