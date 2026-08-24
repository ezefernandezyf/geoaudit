import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "@/ui/text-field";

/**
 * U1.T7 — TextField primitive (DNF-8): <label> + <input type="url"> with a
 * reserved error slot that announces errors via role="alert".
 */
describe("TextField (DNF-8)", () => {
  it("renders a label associated with the input", () => {
    render(<TextField id="url" label="URL del sitio" />);
    expect(screen.getByLabelText("URL del sitio")).toHaveAttribute("id", "url");
  });

  it("defaults the input type to url", () => {
    render(<TextField id="url" label="URL del sitio" />);
    expect(screen.getByLabelText("URL del sitio")).toHaveAttribute(
      "type",
      "url",
    );
  });

  it("renders the error with role=alert", () => {
    render(
      <TextField
        id="url"
        label="URL del sitio"
        error="Ingresá una URL válida"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Ingresá una URL válida");
  });

  it("marks the input invalid and describes the error", () => {
    render(
      <TextField
        id="url"
        label="URL del sitio"
        error="Ingresá una URL válida"
      />,
    );
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "url-error");
  });

  it("renders no alert and no aria-invalid when there is no error", () => {
    render(<TextField id="url" label="URL del sitio" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("URL del sitio")).not.toHaveAttribute(
      "aria-invalid",
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
    expect(errorSlot?.className).toContain("min-h-");
  });

  describe("leftIcon, helperText and rightElement (U1.6, DNF-8)", () => {
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
          helperText="Ingresá la URL completa con https"
        />,
      );
      expect(
        screen.getByText("Ingresá la URL completa con https"),
      ).toBeInTheDocument();
    });

    it("describes the input with the helper text", () => {
      render(
        <TextField
          id="url"
          label="URL del sitio"
          helperText="Ingresá la URL completa"
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
          error="Ingresá una URL válida"
          helperText="Ingresá la URL completa"
        />,
      );
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Ingresá una URL válida");
      expect(
        screen.queryByText("Ingresá la URL completa"),
      ).not.toBeInTheDocument();
    });
  });
});
