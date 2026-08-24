import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/ui/button";

/**
 * U1.2 — Button primitive (DNF-7): Gemini verbatim classes (hex directos),
 * variants (primary/secondary/ghost/emerald/danger), sizes (sm/md/lg) and a
 * loading state that prevents double-submit (isLoading → Loader2 spin +
 * disabled + aria-busy, label "Analizando…").
 */
describe("Button (DNF-7)", () => {
  it("renders children by default", () => {
    render(<Button>Analizar</Button>);
    expect(
      screen.getByRole("button", { name: "Analizar" }),
    ).toBeInTheDocument();
  });

  it("applies Gemini hex variant classes, not tokens", () => {
    const { rerender } = render(<Button variant="primary">A</Button>);
    expect(screen.getByRole("button").className).toContain("bg-[#0f172a]");

    rerender(<Button variant="secondary">B</Button>);
    expect(screen.getByRole("button").className).toContain("border-[#e2e8f0]");

    rerender(<Button variant="emerald">C</Button>);
    expect(screen.getByRole("button").className).toContain("bg-[#10b981]");

    rerender(<Button variant="danger">D</Button>);
    expect(screen.getByRole("button").className).toContain("bg-[#ef4444]");
  });

  it("applies size classes", () => {
    const { rerender } = render(<Button size="sm">A</Button>);
    expect(screen.getByRole("button").className).toContain("h-8");

    rerender(<Button size="lg">B</Button>);
    expect(screen.getByRole("button").className).toContain("h-12");
  });

  it("defaults to type=button", () => {
    render(<Button>Analizar</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("forwards native props and className", () => {
    const onClick = vi.fn();
    render(
      <Button className="mt-4" onClick={onClick}>
        Analizar
      </Button>,
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button.className).toContain("mt-4");
  });

  describe("loading state (isLoading)", () => {
    it("disables the button and sets aria-busy", () => {
      render(
        <Button variant="primary" isLoading>
          Analizar
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("shows the Loader2 spinner and the Analizando… label", () => {
      const { container } = render(
        <Button variant="primary" isLoading>
          Analizar
        </Button>,
      );
      expect(screen.getByText("Analizando…")).toBeInTheDocument();
      expect(screen.queryByText("Analizar")).not.toBeInTheDocument();
      expect(container.querySelector("[class*='animate-spin']")).not.toBeNull();
    });

    it("applies disabled affordance classes", () => {
      render(
        <Button variant="primary" isLoading>
          Analizar
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button.className).toContain("cursor-not-allowed");
      expect(button.className).toContain("disabled:opacity-");
    });

    it("keeps children visible when not loading", () => {
      render(<Button>Analizar</Button>);
      expect(screen.getByText("Analizar")).toBeInTheDocument();
      expect(screen.queryByText("Analizando…")).not.toBeInTheDocument();
    });
  });

  describe("loading alias (deprecated `loading`)", () => {
    it("maps the deprecated loading prop to the same pending state", () => {
      render(<Button loading>Analizar</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Analizando…")).toBeInTheDocument();
    });
  });

  describe("icon slots", () => {
    it("renders a left icon beside the label", () => {
      render(
        <Button leftIcon={<span data-testid="left">L</span>}>Auditar</Button>,
      );
      expect(screen.getByTestId("left")).toBeInTheDocument();
      expect(screen.getByText("Auditar")).toBeInTheDocument();
    });

    it("renders a right icon beside the label", () => {
      render(
        <Button rightIcon={<span data-testid="right">R</span>}>Auditar</Button>,
      );
      expect(screen.getByTestId("right")).toBeInTheDocument();
    });

    it("hides icons while loading and still shows the spinner", () => {
      render(
        <Button
          isLoading
          leftIcon={<span data-testid="left">L</span>}
          rightIcon={<span data-testid="right">R</span>}
        >
          Auditar
        </Button>,
      );
      expect(screen.queryByTestId("left")).not.toBeInTheDocument();
      expect(screen.queryByTestId("right")).not.toBeInTheDocument();
      expect(screen.getByText("Analizando…")).toBeInTheDocument();
    });
  });
});
