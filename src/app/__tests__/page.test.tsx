import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "@/app/page";

describe("root page smoke test (project-setup R7)", () => {
  it("renders the GeoAudit heading", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("GeoAudit");
  });
});
