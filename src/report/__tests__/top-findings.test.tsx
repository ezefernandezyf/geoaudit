import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { TopFindings } from "@/report/top-findings";
import { emptyCitability, emptySchema } from "@/report/__tests__/variants";

const fixtureProps = {
  citability: auditResultFixture.citability,
  schema: auditResultFixture.schema,
  crawlers: auditResultFixture.crawlers,
};

/**
 * U4.T4 — TopFindings (ARU-8): the most actionable findings — citability
 * top3/bottom3 passages + suggestions, schema issues and blocked bots.
 * Degraded sections have empty lists and render nothing fake.
 */
describe("TopFindings valid audit (ARU-8)", () => {
  it("renders the top and bottom citability passages", () => {
    render(<TopFindings {...fixtureProps} />);

    expect(
      screen.getByText(
        "GEO is the practice of optimizing content for AI assistants.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Vague filler paragraphs dilute the passage."),
    ).toBeInTheDocument();
  });

  it("renders citability suggestions as actionable items (block + key)", () => {
    render(<TopFindings {...fixtureProps} />);

    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText(/define_core_concept/)).toBeInTheDocument();
  });

  it("renders schema issues", () => {
    render(<TopFindings {...fixtureProps} />);
    expect(screen.getByText("Organization missing sameAs")).toBeInTheDocument();
  });

  it("renders blocked bots", () => {
    render(<TopFindings {...fixtureProps} />);
    expect(screen.getByText("OAI-SearchBot")).toBeInTheDocument();
    expect(screen.getByText("bloqueado")).toBeInTheDocument();
  });
});

describe("TopFindings edge cases", () => {
  it("shows an honest empty state when there are no findings", () => {
    render(
      <TopFindings
        citability={emptyCitability}
        schema={emptySchema}
        crawlers={{ compositeScore: 0, perBot: {} }}
      />,
    );
    expect(screen.getByText("Sin hallazgos destacados.")).toBeInTheDocument();
    expect(screen.queryByText("bloqueado")).not.toBeInTheDocument();
  });

  it("renders no bots section when no bot is blocked", () => {
    render(
      <TopFindings
        {...fixtureProps}
        crawlers={{ ...fixtureProps.crawlers, perBot: { GPTBot: "allowed" } }}
      />,
    );
    expect(screen.queryByText(/bloqueado/)).not.toBeInTheDocument();
  });

  it("renders no citability section when the engine is degraded (empty lists)", () => {
    render(
      <TopFindings
        citability={emptyCitability}
        schema={fixtureProps.schema}
        crawlers={fixtureProps.crawlers}
      />,
    );
    expect(screen.queryByText("Pasajes más citables")).not.toBeInTheDocument();
    expect(screen.getByText("Organization missing sameAs")).toBeInTheDocument();
  });
});
