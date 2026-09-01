import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyPage from "@/app/privacy/page";
import { LEGAL_COPY } from "@/lib/copy";

/**
 * U4.7 - Privacy page (LGL-2, LGL-3, LGL-4): static Server Component, Gemini
 * shell styling (hex), neutral Spanish copy from the single copy source.
 */
describe("PrivacyPage (LGL-2)", () => {
  it("renders the privacy title and updated date", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: LEGAL_COPY.privacy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(LEGAL_COPY.privacy.updated)).toBeInTheDocument();
  });

  it("renders every privacy section heading and body (LGL-2)", () => {
    render(<PrivacyPage />);
    for (const section of LEGAL_COPY.privacy.sections) {
      expect(
        screen.getByRole("heading", { name: section.heading }),
      ).toBeInTheDocument();
      expect(screen.getByText(section.body)).toBeInTheDocument();
    }
  });

  it("uses neutral Spanish copy - no voseo forms (LGL-4)", () => {
    render(<PrivacyPage />);
    const voseo = /hacé|tené|podés|tu cuenta|comenzá|probá|ingresá|mejorá/i;
    expect(screen.queryByText(voseo)).not.toBeInTheDocument();
  });
});
