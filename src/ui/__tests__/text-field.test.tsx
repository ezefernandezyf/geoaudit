import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "@/ui/text-field";

/**
 * U1.4 — TextField primitive (DNF-8 delta): Gemini verbatim — label uppercase
 * tracking-wider, useId-generated ids, reserved error slot min-h-[18px],
 * leftIcon/rightElement/helperText/hideLabelVisually, hex border/ring states.
 */
describe("TextField (DNF-8)", () => {
  it("renders a label associated with the input", () => {
    render(<TextField id="url" label="URL del sitio" />);
    expect(screen.getByLabelText("URL del sitio")).toHaveAttribute("id", "url");
  });

  it("applies the Gemini uppercase label classes (hex)", () => {
    render(<TextField id="url" label="URL del sitio" />);
    const label = screen.getByText("URL del sitio");
    expect(label.className).toContain("uppercase");
    expect(label.className).toContain("tracking-wider");
    expect(label.className).toContain("text-[#475569]");
  });

  it("generates an id via useId when none is passed", () => {
    render(<TextField label="URL del sitio" />);
    expect(screen.getByLabelText("URL del sitio")).toHaveAttribute("id");
  });

  it("renders the error with role=alert", () => {
    render(
      <TextField
        id="url"
        label="URL del sitio"
        error="Ingrese una URL válida"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Ingrese una URL válida");
    expect(alert.className).toContain("text-[#ef4444]");
  });

  it("marks the input invalid and describes the error", () => {
    render(
      <TextField
        id="url"
        label="URL del sitio"
        error="Ingrese una URL válida"
      />,
    );
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "url-error");
  });

  it("renders no alert when there is no error", () => {
    render(<TextField id="url" label="URL del sitio" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // Gemini renders aria-invalid="false" (Boolean(error)); a value of "true"
    // is what marks the field invalid.
    expect(screen.getByLabelText("URL del sitio")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("forwards native input props", () => {
    const onChange = vi.fn();
    render(
      <TextField
        id="url"
        label="URL del sitio"
        placeholder="https://ejemplo.com"
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("placeholder", "https://ejemplo.com");
    fireEvent.change(input, { target: { value: "https://a.com" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("reserves space for the error slot to avoid layout shift", () => {
    const { container } = render(<TextField id="url" label="URL del sitio" />);
    const errorSlot = container.querySelector("[data-error-slot]");
    expect(errorSlot).not.toBeNull();
    expect(errorSlot?.className).toContain("min-h-[18px]");
  });

  describe("leftIcon, helperText, rightElement and hideLabelVisually", () => {
    it("renders a left icon", () => {
      render(
        <TextField
          id="url"
          label="URL del sitio"
          leftIcon={<span data-testid="left">L</span>}
        />,
      );
      expect(screen.getByTestId("left")).toBeInTheDocument();
    });

    it("renders a right element", () => {
      render(
        <TextField
          id="url"
          label="URL del sitio"
          rightElement={<button data-testid="right">Ver</button>}
        />,
      );
      expect(screen.getByTestId("right")).toBeInTheDocument();
    });

    it("renders helperText below the input", () => {
      render(
        <TextField
          id="url"
          label="URL del sitio"
          helperText="Ingrese la URL completa con https"
        />,
      );
      expect(
        screen.getByText("Ingrese la URL completa con https"),
      ).toBeInTheDocument();
    });

    it("describes the input with the helper text", () => {
      render(
        <TextField
          id="url"
          label="URL del sitio"
          helperText="Ingrese la URL completa"
        />,
      );
      expect(screen.getByLabelText("URL del sitio")).toHaveAttribute(
        "aria-describedby",
        "url-helper",
      );
    });

    it("shows the error over the helper text and keeps role=alert", () => {
      render(
        <TextField
          id="url"
          label="URL del sitio"
          error="Ingrese una URL válida"
          helperText="Ingrese la URL completa"
        />,
      );
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Ingrese una URL válida");
      expect(
        screen.queryByText("Ingrese la URL completa"),
      ).not.toBeInTheDocument();
    });

    it("hides the label visually with sr-only while keeping it accessible", () => {
      render(<TextField id="url" label="URL del sitio" hideLabelVisually />);
      const label = screen.getByText("URL del sitio");
      expect(label.className).toContain("sr-only");
    });
  });
});
