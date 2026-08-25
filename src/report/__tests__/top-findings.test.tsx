import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import { TopFindings } from "@/report/top-findings";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { geminiViewFixture } from "@/report/__tests__/view-fixtures";

/**
 * U5.6 — TopFindings (ARU-10): pure presenter of the view model. Gemini
 * "Hallazgos Técnicos Priorizados" section rendering `view.findings`
 * (deriveFindings over real engine data). Honesty (APT-10): NO impact-score
 * chip (always null) and a code snippet ONLY from a real source
 * (schema.generated JSON-LD).
 */
describe("TopFindings valid audit (ARU-10)", () => {
  it("renders the derived findings: citability, schema and blocked bots", () => {
    render(<TopFindings view={geminiViewFixture} />);

    // 2 bottom3 passages → 2 "Pasaje a mejorar"; 3 top3 → 3 "altamente citable".
    expect(screen.getAllByText("Pasaje a mejorar")).toHaveLength(2);
    expect(screen.getAllByText("Pasaje altamente citable")).toHaveLength(3);
    expect(
      screen.getByText("Datos estructurados: faltan estas propiedades"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bots de IA bloqueados")).toBeInTheDocument();
  });

  it("renders a single card per collapsed group listing its details (ARU-13/14)", () => {
    const { container } = render(<TopFindings view={geminiViewFixture} />);

    // ONE blocked-bots card (not one per bot) listing the blocked bot names.
    expect(screen.getAllByText("Bots de IA bloqueados")).toHaveLength(1);
    const botList = Array.from(container.querySelectorAll("ul")).find((ul) =>
      ul.textContent?.includes("OAI-SearchBot"),
    );
    expect(botList).not.toBeNull();

    // ONE structured-data card listing every missing property.
    expect(
      screen.getAllByText("Datos estructurados: faltan estas propiedades"),
    ).toHaveLength(1);
    const schemaList = Array.from(container.querySelectorAll("ul")).find((ul) =>
      ul.textContent?.includes("Organization missing sameAs"),
    );
    expect(schemaList).not.toBeNull();
  });

  it("shows the findings count chip (7 points of action)", () => {
    render(<TopFindings view={geminiViewFixture} />);
    // 2 bottom + 3 top + 1 schema issue + 1 blocked bot (fixture).
    expect(screen.getByText("7 puntos de acción")).toBeInTheDocument();
  });

  it("renders the description and the neutral recommendation for each finding", () => {
    render(<TopFindings view={geminiViewFixture} />);
    expect(
      screen.getByText("Vague filler paragraphs dilute the passage."),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Recomendación GEO:/).length).toBeGreaterThan(0);
  });

  it("never renders an impact-score chip (impactScore is null, APT-10)", () => {
    render(<TopFindings view={geminiViewFixture} />);
    expect(screen.queryByText(/pts de impacto/)).not.toBeInTheDocument();
  });
});

describe("TopFindings code snippets (ADP-6)", () => {
  it("renders the real generated JSON-LD snippet with a copy island", () => {
    render(<TopFindings view={geminiViewFixture} />);

    // schema.generated is present in the fixture → the real JSON-LD renders.
    expect(screen.getByText(/"@type": "Organization"/)).toBeInTheDocument();
    const copyButtons = screen.getAllByRole("button", {
      name: "Copiar código",
    });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it("copies the snippet to the clipboard from the code island", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<TopFindings view={geminiViewFixture} />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Copiar código" })[0],
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain('"@type": "Organization"');
    expect(
      await screen.findByRole("button", { name: "Copiar código" }),
    ).toBeInTheDocument();
  });
});

describe("TopFindings honesty edge cases (APT-10)", () => {
  it("shows the empty state when there are no findings", () => {
    const noFindings = {
      ...auditResultFixture,
      citability: {
        pageScore: 0,
        coverage: 0,
        top3: [],
        bottom3: [],
        suggestions: [],
      },
      schema: {
        detected: [],
        issues: [],
        generated: null,
        businessType: "hybrid" as const,
      },
      crawlers: { compositeScore: 0, perBot: { GPTBot: "allowed" as const } },
    };
    render(<TopFindings view={toGeminiViewModel(noFindings)} />);

    expect(
      screen.getByText("Configuración técnica sin observaciones críticas"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 puntos de acción")).toBeInTheDocument();
  });

  it("renders no code snippet when no real source exists", () => {
    const noSchemaSource = {
      ...auditResultFixture,
      schema: {
        detected: [{ "@type": "Organization" }],
        issues: ["Organization missing sameAs"],
        generated: null,
        businessType: "saas" as const,
      },
    };
    render(<TopFindings view={toGeminiViewModel(noSchemaSource)} />);

    expect(
      screen.getByText("Datos estructurados: faltan estas propiedades"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copiar código" }),
    ).not.toBeInTheDocument();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
