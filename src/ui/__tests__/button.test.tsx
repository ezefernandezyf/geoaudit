import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/ui/button";

/**
 * U1.T6 — Button primitive (DNF-7): variants (primary/secondary/ghost),
 * sizes (sm/md) and a loading state that prevents double-submit and
 * communicates progress (aria-busy, disabled, spinner, "Analizando…").
 */
describe("Button (DNF-7)", () => {
  it("renders children by default", () => {
    render(<Button>Analizar</Button>);
    expect(
      screen.getByRole("button", { name: "Analizar" }),
    ).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { rerender } = render(<Button variant="primary">A</Button>);
    expect(screen.getByRole("button").className).toContain("bg-navy");

    rerender(<Button variant="secondary">B</Button>);
    expect(screen.getByRole("button").className).toContain("border");

    rerender(<Button variant="ghost">C</Button>);
    expect(screen.getByRole("button").className).toContain("bg-transparent");
  });

  it("applies size classes", () => {
    const { rerender } = render(<Button size="sm">A</Button>);
    expect(screen.getByRole("button").className).toContain("px-3");

    rerender(<Button size="md">B</Button>);
    expect(screen.getByRole("button").className).toContain("px-4");
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

  describe("loading state", () => {
    it("disables the button and sets aria-busy", () => {
      render(
        <Button variant="primary" loading>
          Analizar
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("shows a spinner and the Analizando… label", () => {
      const { container } = render(
        <Button variant="primary" loading>
          Analizar
        </Button>,
      );
      expect(screen.getByText("Analizando…")).toBeInTheDocument();
      expect(screen.queryByText("Analizar")).not.toBeInTheDocument();
      expect(container.querySelector('[class*="animate-spin"]')).not.toBeNull();
    });

    it("applies disabled affordance classes", () => {
      render(
        <Button variant="primary" loading>
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

  describe("emerald and danger variants (U1.2, DNF-7)", () => {
    it("applies the emerald variant classes", () => {
      render(<Button variant="emerald">Auditar</Button>);
      expect(screen.getByRole("button").className).toContain("bg-emerald");
    });

    it("applies the danger variant classes", () => {
      render(<Button variant="danger">Eliminar</Button>);
      expect(screen.getByRole("button").className).toContain("bg-red");
    });
  });

  describe("size lg (U1.2, DNF-7)", () => {
    it("applies the lg size classes", () => {
      render(<Button size="lg">Auditar</Button>);
      expect(screen.getByRole("button").className).toContain("px-6");
    });
  });

  describe("icon slots (U1.2, DNF-7)", () => {
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
          loading
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
